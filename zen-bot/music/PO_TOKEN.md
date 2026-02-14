# PO Token Support

This document explains the PO (Proof-of-Origin) token system used to bypass YouTube's bot detection.

## Overview

YouTube increasingly blocks requests it identifies as bots. The PO token provider generates tokens that prove the request originates from a legitimate browser session, reducing 403 errors.

## Architecture

```
┌─────────────────┐     HTTP      ┌──────────────────────────┐
│   zen-bot       │──────────────▶│  PO Token Provider       │
│   (Node.js)     │               │  (bgutil-ytdlp-pot-      │
│                 │◀──────────────│   provider)              │
│  - po-token.js  │   PO Token    │  Port 4416               │
│  - extractor.js │               │                          │
└─────────────────┘               └──────────────────────────┘
         │
         │  --po-token=xxx
         ▼
   ┌───────────┐
   │  yt-dlp   │
   └───────────┘
```

## Components

### PO Token Provider

The [bgutil-ytdlp-pot-provider](https://github.com/Brainicism/bgutil-ytdlp-pot-provider) server runs separately and provides:

- HTTP endpoint at `http://127.0.0.1:4416`
- Token generation on demand
- Browser fingerprint simulation

Setup is automatic during `npm install` via `scripts/ensure-bgutil-plugin.js`.

### Token Cache (`po-token.js`)

Located in `zen-bot/music/po-token.js`, this module:

- Fetches tokens from the provider server
- Caches tokens for configurable duration (default: 6 hours)
- Retries failed requests with exponential backoff
- Falls back gracefully if provider is unavailable

### Extractor Integration (`extractor.js`)

The custom `YtDlpExtractor` in `zen-bot/music/extractor.js`:

- Checks if URL is a YouTube URL
- Fetches PO token for YouTube requests
- Passes token to yt-dlp via extractor args; when using system yt-dlp, the extractor passes `--plugin-dirs` with `third_party/yt-dlp/yt-dlp-plugins` so the PO plugin is found

## Configuration

These can be set via environment variables or in `env.json` (keys = ENV names; env vars take precedence). See `env.example.json`.

| Variable | Default | Description |
|----------|---------|-------------|
| `PO_TOKEN_URL` | `http://127.0.0.1:4416` | Provider server URL |
| `PO_TOKEN_TTL_HOURS` | `6` | Token cache duration |
| `PO_TOKEN_RETRIES` | `3` | Retry attempts on failure |
| `PO_TOKEN_RETRY_DELAY` | `2000` | Ms between retries |

## Usage

### Recommended: Start Both Services

Use `npm run start:full` (or `./start.sh` / `start.bat`) to start both the provider and zen-bot:

```bash
npm run start:full
```

This:
1. Starts the PO token provider in the background
2. Waits for it to initialize
3. Starts zen-bot
4. Stops the provider when zen-bot exits

### Manual Start

Start the provider in one terminal:

```bash
cd third_party/bgutil-ytdlp-pot-provider/server
node build/main.js
```

Start zen-bot in another:

```bash
npm start
```

### Custom Port

To use a different port:

1. Start the provider with `--port`:
   ```bash
   node build/main.js --port 8080
   ```

2. Set the environment variable:
   ```bash
   PO_TOKEN_URL=http://127.0.0.1:8080 npm start
   ```

## Troubleshooting

### Provider Not Starting

Check if dependencies are installed:

```bash
cd third_party/bgutil-ytdlp-pot-provider/server
npm install
npx tsc
```

### 403 Errors Despite PO Token

- Token may be expired — restart the provider
- YouTube may be blocking your IP — try a VPN or proxy
- Some content may require cookies — not currently supported

### Connection Refused to Provider

- Ensure provider is running on the configured port
- Check firewall settings
- Verify `PO_TOKEN_URL` (env var or in `env.json`)

### Debug Logging

Enable debug logging to see token fetching:

```bash
`LOG_LEVEL=debug npm start` (or set `LOG_LEVEL` in `env.json`)
```

Look for `[po-token]` log entries.

## How Tokens Work

1. zen-bot receives play request for YouTube URL
2. Extractor calls `fetchPoToken()`
3. Cache returns existing token or fetches new one
4. Token is passed to yt-dlp via extractor (plugin dir `third_party/yt-dlp/yt-dlp-plugins` is passed as `--plugin-dirs` when using system yt-dlp)
5. yt-dlp includes token in YouTube API requests
6. YouTube accepts request as "legitimate"

Tokens are visitor-specific and time-limited. The cache automatically refreshes expired tokens.
