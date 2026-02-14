# Example Feature

This feature demonstrates all patterns and conventions in zen-bot.

**Use this as a reference when creating your own features.**

## Structure

```
zen-bot/example/
├── index.js              # Feature entry point (required)
├── config.js             # Configuration with env overrides
├── database.js           # Database namespace registration
├── services.js           # Stateful service module
├── commands/
│   ├── greet.js          # Primary command with aliases
│   ├── greetcount.js     # Command that reads state
│   └── resetgreet.js     # Command that modifies state
├── events/
│   ├── messageCreate.js  # Discord.js event handler
│   ├── ready.js          # One-time startup event
│   └── playerStart.js    # discord-player event handler
└── README.md             # Feature documentation
```

## Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `#greet` | `#hi`, `#hello` | Get greeted by the bot |
| `#greetcount` | `#gc` | Show your greet count |
| `#resetgreet` | `#rg` | Reset your greet count |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `EXAMPLE_GREETING` | `Hello` | Default greeting message |
| `EXAMPLE_MAX_GREETINGS` | `100` | Maximum greets before cooldown |
| `EXAMPLE_COOLDOWN_MS` | `5000` | Cooldown between greets (ms) |
| `EXAMPLE_ENABLED` | `true` | Enable/disable the feature |
| `EXAMPLE_VERBOSE` | `false` | Enable verbose logging |
| `EXAMPLE_SPECIAL_GREETINGS` | `Howdy,Hey there,Greetings` | Special greetings (comma-separated) |

## Patterns Demonstrated

### 1. Feature Entry Point (`index.js`)

Use `ctx.log` (set by loader). Export `dependsOn` so load order is correct.

```javascript
async function init(ctx) {
    const log = ctx.log;
    if (log) log.info("Initializing my-feature...");
    // Access dependencies from ctx; export services to ctx.services
    if (log) log.info("my-feature initialized");
}

module.exports = { init, dependsOn: ["core"] };
```

### 2. Configuration (`config.js`)

Use `get(envKey, default, { type })` from `../core/config` so settings come from env vars or env.json (keys = ENV names). Types: `'string'`, `'int'`, `'bool'`, `'array'`, `'serviceList'`.

```javascript
const { get } = require("../core/config");

module.exports = {
    setting: get("MY_SETTING", "default"),
    timeout: get("MY_TIMEOUT", 5000, { type: "int" }),
    enabled: get("MY_ENABLED", true, { type: "bool" }),
    items: get("MY_ITEMS", ["a", "b", "c"], { type: "array" }),
};
```

### 3. Commands (`commands/[name].js`)

```javascript
module.exports = {
    name: "commandname",
    aliases: ["cn", "cmd"],

    async execute(message, args, ctx) {
        // message: Discord.js Message
        // args: Array of arguments
        // ctx: Shared context
        return message.reply("Response");
    },
};
```

### 4. Events (`events/[eventName].js`)

Use `ctx.log`. `target` is optional (inferred from event name if missing).

```javascript
module.exports = {
    event: "messageCreate",
    target: "client",   // optional: "client" or "player"

    async handle(message, ctx) {
        const log = ctx.log;
        if (log) log.debug("Received message");
    },
};
```

### 5. Services (`services.js`)

Export `init(ctx)` and `api`. The loader calls `init(ctx)` then sets `ctx.services.[featureName]` to `api`. Use `ctx.log` and `ctx.[featureName]Config` in init.

```javascript
const { createLogger } = require("../core/logger");
let log = createLogger("my-service");

function init(ctx) {
    if (ctx?.log) log = ctx.log;
}

function doSomething(input) {
    log.debug("Doing something");
    return result;
}

const api = { doSomething };
module.exports = { init, api };
```

### 6. Database Namespace (`database.js`)

Export `init(db, ctx)`. The loader passes the connection and ctx so you can use `ctx.log`. The loader registers from this file automatically; no code in index.js.

```javascript
function initMyFeatureDatabase(db, ctx) {
    const log = ctx?.log;

    db.exec(`
        CREATE TABLE IF NOT EXISTS my_table (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            data TEXT NOT NULL
        );
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
    };
}

module.exports = { init: initMyFeatureDatabase, namespace: "myFeature" };
```

## Events Handled

| Event | Target | Description |
|-------|--------|-------------|
| `messageCreate` | client | Reacts to "good bot" / "bad bot" |
| `ready` | client | Logs startup information |
| `playerStart` | player | Logs when music starts (verbose) |

## Inter-Feature Dependencies

This feature declares `dependsOn: ["core", "database"]` in index.js so the loader runs it after core and database.

## Database Namespace

This feature registers the `example` namespace on `ctx.db`:

```javascript
// Available at ctx.db.example
ctx.db.example.saveGreeting({ userId, userName, guildId, greetingText });
ctx.db.example.getGreetingCount(userId, guildId);
ctx.db.example.getTotalGreetings(guildId);
ctx.db.example.getRecentGreetings(guildId, limit);
ctx.db.example.getTopGreeters(guildId, limit);
ctx.db.example.clearUserGreetings(userId, guildId);
ctx.db.example.clearAllGreetings(guildId);
```

The database is persistent - greetings survive bot restarts.

## Enabling the Feature

Features are **discovered and enabled by default**. This example ships with a **`.disabled`** file so it is off until you enable it:

- **Enable:** Remove the file `zen-bot/example/.disabled`, or ensure `example` is not in `DISABLED_FEATURES` in env.json and remove `.disabled`.
- **Disable again:** Add an empty file `zen-bot/example/.disabled`, or set `DISABLED_FEATURES` in env.json to include `example`.

Use the example for learning; disable it in production if you don't need it.
