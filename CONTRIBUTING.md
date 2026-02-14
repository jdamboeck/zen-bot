# Contributing to zen-bot

This document explains the architecture and conventions for developing features for zen-bot.

## Philosophy

1. **Automatism over configuration** — Convention eliminates boilerplate
2. **Minimalism** — Every abstraction must earn its place
3. **Simplicity** — Code should be obvious, not clever

## Architecture Overview

```
zen-bot/
├── index.js              # Feature loader (orchestrates everything)
├── core/                 # Core feature
│   ├── index.js          # Feature entry point (init function)
│   ├── config.js         # Feature configuration
│   ├── logger.js         # Shared logger factory
│   ├── commands/         # Command modules
│   │   └── index.js      # Command registry
│   ├── events/           # Event handlers
│   │   └── messageCreate.js
│   └── services/         # Shared services
│       ├── activity.js
│       └── soundboard.js
├── database/             # Database feature (ctx.db)
│   ├── index.js          # Feature entry point
│   └── database.js       # SQLite connection and context
├── music/                # Music feature
│   ├── index.js
│   ├── config.js
│   ├── extractor.js      # Custom yt-dlp extractor
│   ├── po-token.js       # PO token fetching
│   ├── commands/
│   │   ├── play.js
│   │   ├── stop.js
│   │   ├── pause.js
│   │   └── resume.js
│   └── events/
│       ├── playerStart.js
│       ├── playerError.js
│       ├── error.js
│       └── emptyQueue.js
└── [feature]/            # Your feature here
```

> **Note:** The main application directory is `zen-bot/` (not `bot/`).

## The Context Object (`ctx`)

Features communicate through a shared context object passed to all `init()` functions and event handlers:

```javascript
ctx = {
  client: Client,           // Discord.js client (set by core)
  player: Player,           // discord-player instance (set by music)
  db: {                     // Database context (set by database feature)
    register: Function,     // Register a namespace: ctx.db.register("name", initFn)
    connection: Database,   // Raw better-sqlite3 connection
    close: Function,        // Close database connection
    music: Object,          // Music namespace (set by music-stats)
    example: Object,        // Example namespace (set by example)
    // ... other feature namespaces
  },
  commands: Map,            // Command registry (set by core)
  services: {               // Shared services (loader attaches from each feature's services.js)
    core: { activity, soundboard },  // Bot activity/status, soundboard
    "music-comments": Object,         // Comment session management
    example: Object,        // Example feature API
    // ... ctx.services[featureName] per feature with services.js
  },
  config: Object,           // Core config (token, prefix; set by core)
  log: Object,              // Feature-scoped logger (set by loader when invoking your command/event)
  loggers: Object,          // All feature loggers: ctx.loggers[featureName]
  enabledFeatures: Array,   // Names of enabled features
  // Feature configs: ctx.[featureName]Config (e.g. ctx.coreConfig, ctx.musicConfig, ctx.exampleConfig)
}
```

Features add their exports to `ctx` during initialization. Later features can access them.

## Creating a Feature

### 1. Create the Feature Directory

```
zen-bot/
└── my-feature/
    ├── index.js          # Required: feature entry point
    ├── config.js         # Optional: feature configuration
    ├── commands/         # Optional: command modules
    │   └── mycommand.js
    ├── events/           # Optional: event handlers
    │   └── messageCreate.js
    └── services.js       # Optional: feature services
```

### 2. Feature discovery and load order

**Features are discovered automatically.** Any directory under `zen-bot/` that has at least one of `index.js`, `commands/`, or `events/` is a feature. No central list to edit.

- **Default: enabled.** New features are enabled as soon as they exist.
- **Disable by config:** Set `DISABLED_FEATURES` in env or `env.json` (comma-separated), e.g. `"DISABLED_FEATURES": "example,moderation"`. The `core` feature cannot be disabled.
- **Optional .disabled file:** Placing a file named `.disabled` inside a feature directory also disables that feature (unless it is `core`).
- **Load order** is inferred from **dependsOn**. In your feature's `index.js`, export `dependsOn: ["core", "database"]` (or whatever you need). The loader topo-sorts features; cycles or missing dependencies cause startup to fail.

### 3. Scaffold (optional)

From the project root:

```bash
npm run create-feature -- my-feature
```

This creates `zen-bot/my-feature/` with `index.js`, `config.js`, `commands/`, and `events/`. The feature is enabled by default.

### 4. Create `index.js` (optional for commands-only features)

If your feature only has `commands/` or `events/`, you can omit `index.js`; the loader will still discover and wire them. If you need to run setup (e.g. register a db namespace, attach services), add `index.js` with an `init(ctx)` function and export **dependsOn**:

```javascript
/**
 * My Feature - Brief description.
 */

/**
 * Initialize the feature. Use ctx.log (set by loader).
 * @param {object} ctx - Shared context (log, client, db, etc.)
 */
async function init(ctx) {
  const log = ctx.log;
  if (log) log.info("Initializing my-feature...");

  // Access dependencies from ctx (client, player, db, etc.)
  // Export services for other features
  ctx.services.myFeature = {
    doSomething: () => { /* ... */ },
  };

  if (log) log.info("my-feature initialized");
}

module.exports = { init, dependsOn: ["core"] };
```

## Commands

Commands live in `zen-bot/[feature]/commands/[name].js`.

### Command Structure

```javascript
/**
 * MyCommand - Brief description.
 * Use ctx.log (set by loader before execute). No require of core/logger.
 */

module.exports = {
  name: "mycommand",
  aliases: ["mc", "mycmd"],

  async execute(message, args, ctx) {
    const log = ctx.log;
    if (log) log.info(`Executing with args: ${args.join(", ")}`);

    // Access other features
    const player = ctx.player;
    const db = ctx.db;

    // Reply to user
    return message.reply("Done!");
  },
};
```

### Command Discovery

Commands are auto-discovered by scanning `zen-bot/*/commands/*.js`. No manual registration needed.

The `core` feature's command loader:
1. Scans all feature directories
2. Loads all `.js` files from `commands/` subdirectories
3. Registers primary names and aliases to `ctx.commands`

## Events

Events live in `zen-bot/[feature]/events/[eventName].js`.

### Event Structure

```javascript
/**
 * Handler for [event description].
 * Use ctx.log (set by loader). Target is optional—inferred from event name if missing.
 */

module.exports = {
  event: "messageCreate",
  target: "client",  // optional: "client" for Discord events, "player" for discord-player

  async handle(message, ctx) {
    const log = ctx.log;
    if (log) log.debug(`Received message: ${message.content}`);
  },
};
```

**Target** is optional. Set `target` to `"client"` for Discord.js events or `"player"` for discord-player events. If missing or invalid, the loader infers from the event name (e.g. playerStart → player).

### Client Events (Discord.js)

Target: `"client"`

Common events:
- `ready` - Bot connected
- `messageCreate` - Message received
- `interactionCreate` - Slash command/button interaction
- `guildMemberAdd` - Member joined

### Player Events (discord-player)

Target: `"player"`

Common events:
- `playerStart` - Track started playing
- `playerError` - Playback error
- `error` - Queue error
- `emptyQueue` - Queue finished
- `emptyChannel` - Voice channel empty

### Multiple Handlers

Multiple features can handle the same event. Handlers run in feature load order.

Example: `playerStart` is handled by:
1. `music/events/playerStart.js` - Updates bot activity
2. `music-stats/events/playerStart.js` - Records to database
3. `music-comments/events/playerStart.js` - Schedules comment playback

## Configuration

Feature configuration uses a simple pattern: defaults with environment variable overrides.

Config is loaded via **dotenv-json** (env.json in the project root) and **process.env**. dotenv-json does not overwrite existing environment variables, so env vars always take precedence. Keys in **env.json** must match ENV names (e.g. `BOT_TOKEN`, `PREFIX`, `LOG_LEVEL`). Use **env.example.json** as the canonical list—copy it to `env.json` for local secrets. If you use a dotenv-based workflow, `.env.example` may duplicate that list; keep one as the source of truth to avoid drift.

### Create `config.js`

Use `get(envKey, default, { type })` from `../core/config` so your feature reads from both env vars and env.json (keys = ENV names). Types: `'string'`, `'int'`, `'bool'`, `'array'`, `'serviceList'`.

```javascript
/**
 * My Feature configuration. Keys in env.json must match ENV names (e.g. MY_FEATURE_SETTING).
 */
const { get } = require("../core/config");

module.exports = {
  someSetting: get("MY_FEATURE_SETTING", "default_value"),
  timeout: get("MY_FEATURE_TIMEOUT", 5000, { type: "int" }),
  enabled: get("MY_FEATURE_ENABLED", true, { type: "bool" }),
};
```

### Use in Feature

The loader attaches your feature's config as `ctx.[featureName]Config` before calling `init(ctx)`. Do not require config in init or assign it to ctx.

```javascript
async function init(ctx) {
  const config = ctx.myFeatureConfig;  // Loader sets this from your config.js
  const log = ctx.log;                 // Loader sets this before init
  log.info("Setting:", config?.someSetting);
}
```

## Logger

In **init**, **commands**, and **events** use `ctx.log` (the loader sets it before each init and before each command/event handler). Use **createLogger** only in submodules (e.g. `database.js`, `services.js`) that are not invoked by the loader with ctx.

### Usage (init / commands / events)

```javascript
async function init(ctx) {
  const log = ctx.log;
  log.debug("Verbose debugging info");
  log.info("General information");
}
```

### Submodules (database.js, services.js, etc.)

```javascript
const { createLogger } = require("../core/logger");
const log = createLogger("my-feature-db");
```

### Log Levels

Controlled by `LOG_LEVEL` (env var or env.json key; default: `debug`):
- `debug` - All messages (default; use for actions and status changes)
- `info` - Notable events (command executed, feature initialized, etc.)
- `warn` - Recoverable issues (fallbacks, retries)
- `error` - Failures (exceptions, failed operations)

## Services

Services are shared utilities exposed through `ctx.services.[featureName]`. The loader attaches them by convention from each feature's `services.js`.

### Convention: services.js

Export an `api` object (and optional `init(ctx)`). The loader calls `init(ctx)` if present, then sets `ctx.services.[featureName]` to `api` (or the module). You do not assign to `ctx.services` in your feature's index.js.

```javascript
// zen-bot/my-feature/services.js

const { createLogger } = require("../core/logger");
let log = createLogger("my-service");

function init(ctx) {
  if (ctx?.log) log = ctx.log;
}

function doSomething(data) {
  log.debug("Doing something with", data);
  return data.toUpperCase();
}

const api = { doSomething };
module.exports = { init, api };
```

### Exposing Services

No code in index.js is needed. The loader loads your `services.js`, calls `init(ctx)` if present, and sets `ctx.services.[featureName]` from the exported `api` (or the module).

### Using Services from Other Features

```javascript
async function execute(message, args, ctx) {
  const result = ctx.services.myFeature.doSomething("hello");
  message.reply(result);
}
```

## Database

The **database** feature provides a shared SQLite database through `ctx.db`. Load order is determined by `dependsOn`; list database after core. The loader registers namespaces from each feature's `database.js` by convention (no manual `ctx.db.register` in your init).

### Database Architecture

```
ctx.db
├── register(namespace, initFn)  # Register a new namespace
├── connection                    # Raw better-sqlite3 connection
├── close()                       # Close connection
├── music                         # Namespace from music-stats
│   ├── recordPlay()
│   ├── getTopVideosOverall()
│   └── ...
└── example                       # Namespace from example feature
    ├── saveGreeting()
    ├── getGreetingCount()
    └── ...
```

### Registering a Database Namespace (convention)

Create a `database.js` file in your feature. Export an `init(db, ctx)` function (and optionally `namespace`). The loader calls it with the raw connection and ctx so you can use `ctx.log`. The loader registers after your feature's init—you do not register in index.js.

```javascript
// zen-bot/my-feature/database.js

function initMyFeatureDatabase(db, ctx) {
  const log = ctx?.log;

  db.exec(`
    CREATE TABLE IF NOT EXISTS my_table (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_my_table_user ON my_table(user_id);
  `);

  if (log) log.info("My feature tables initialized");

  return {
    saveData({ userId, data }) {
      const stmt = db.prepare("INSERT INTO my_table (user_id, data) VALUES (?, ?)");
      stmt.run(userId, data);
    },
    getData(userId) {
      const stmt = db.prepare("SELECT * FROM my_table WHERE user_id = ?");
      return stmt.all(userId);
    },
    clearData(userId) {
      const stmt = db.prepare("DELETE FROM my_table WHERE user_id = ?");
      return stmt.run(userId).changes;
    },
  };
}

module.exports = { init: initMyFeatureDatabase, namespace: "myFeature" };
```

After your feature loads, `ctx.db.myFeature` is available.

### Using Database Namespaces

In commands and events, access via `ctx.db.[namespace]`:

```javascript
// In a command
async execute(message, args, ctx) {
  // Use music namespace
  const topVideos = ctx.db.music.getTopVideosOverall(guildId, 10);

  // Use your feature's namespace
  ctx.db.myFeature.saveData({ userId: message.author.id, data: "hello" });
}
```

### Existing Namespaces

| Namespace | Feature | Description |
|-----------|---------|-------------|
| `music` | music-stats | Play history and track comments |
| `example` | example | Greeting storage (demo) |

### Best Practices

1. **One namespace per feature** — Keep data ownership clear
2. **Use descriptive method names** — `getTopVideos()` not `get()`
3. **Create indexes** — For columns used in WHERE clauses
4. **Log table creation** — Helps debug initialization issues
5. **Return query objects** — Makes the API discoverable

## Testing Your Feature

1. Start with `LOG_LEVEL=debug` to see all output
2. Use the logger liberally during development
3. Test all commands and event handlers
4. Verify feature dependencies are met

```bash
LOG_LEVEL=debug npm start
```

## Checklist for New Features

- [ ] Create `zen-bot/[feature]/` with optional `index.js` (export `init`, `dependsOn`), `config.js`, `commands/`, `events/`
- [ ] No central list to edit—feature is discovered and enabled by default
- [ ] To disable: set `DISABLED_FEATURES` in env.json or add a `.disabled` file in the feature dir
- [ ] Use `ctx.log` in commands and events; use `ctx.[featureName]Config` for config
- [ ] Optional: run `npm run create-feature -- my-feature` to scaffold
- [ ] Document environment variables in your feature README if needed

## Code Style

- Use JSDoc comments for functions
- Log at appropriate levels (debug for verbose, info for important, warn for recoverable issues, error for failures)
- Prefer async/await over callbacks
- Keep functions small and focused
- Name files after their primary export

## Example Feature

See `zen-bot/example/` for a fully documented example feature that demonstrates all patterns.
