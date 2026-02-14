# Changelog

All notable changes to zen-bot are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

_Nothing yet._

---

## [0.02.02] - 2026-02-14

### Added

- **Feature discovery and loader**
  - Features are discovered by convention: any directory under `zen-bot/` with at least one of `index.js`, `commands/`, or `events/` is a feature. No central feature list.
  - Load order is determined by topo-sort from each feature’s `dependsOn` (Kahn’s algorithm; core is forced first).
  - Optional `index.js`: features with only `commands/` or `events/` are still discovered and wired.

- **Configuration and disabling**
  - `DISABLED_FEATURES` in core config (env or env.json, array) disables features by name. Core cannot be disabled.
  - Per-feature `.disabled` file: placing an empty `.disabled` file inside a feature directory disables that feature (same effect as listing it in `DISABLED_FEATURES`).
  - `env.example.json` documents `DISABLED_FEATURES`.

- **Config and context by convention**
  - For each feature, if `config.js` exists, the loader sets `ctx.[featureName]Config` before calling `init(ctx)`. Features use `ctx.[featureName]Config` instead of requiring config in init.
  - The loader sets `ctx.log` to the feature’s logger before each feature init and before each command/event handler. No fallback `createLogger` in feature entry points.

- **Database convention**
  - If a feature has `database.js` exporting `init` (and optional `namespace`), the loader calls `ctx.db.register(namespace, init)` after that feature’s init. The init signature is `init(db, ctx)` so implementations can use `ctx.log`.
  - Central database passes `ctx` into feature init functions.

- **Services convention**
  - If a feature has `services.js` exporting `api` (and optional `init(ctx)`), the loader calls `init(ctx)` if present and sets `ctx.services.[featureName]` to `api`. No manual assignment in feature index.js.
  - Core exposes activity and soundboard via `zen-bot/core/services.js` as `ctx.services.core` (activity, soundboard).
  - Music-comments exposes its API as `ctx.services["music-comments"]` (default naming).

- **Scaffold script**
  - `npm run create-feature -- <name>` creates `zen-bot/<name>/` with `index.js`, `config.js`, `commands/`, and `events/`. Feature is enabled by default.
  - New script: `scripts/create-feature.js`.

- **Documentation**
  - `docs/archive/` for historical plan docs; `docs/archive/README.md` points to current docs.

- **Example disabled by default**
  - Empty file `zen-bot/example/.disabled` so the example feature is off until the file is removed or the feature is enabled via config.

### Changed

- **Loader (`zen-bot/index.js`)**
  - Replaced hardcoded feature list with discovery, `DISABLED_FEATURES`, `.disabled` check, and topo-sort by `dependsOn`.
  - Attaches per-feature config as `ctx.[featureName]Config`, registers database namespaces from `database.js`, attaches services from `services.js` after each feature init.
  - Creates `ctx.loggers[featureName]` for each enabled feature and sets `ctx.log` before init and before each event handler (with fallback to loader log if missing).
  - Event target is optional; inferred from event name (player events → `"player"`, else `"client"`).
  - JSDoc for `registerFeatureDatabase` and `attachFeatureServices` notes that failures are logged and non-fatal.

- **Core**
  - Uses `ctx.coreConfig` (loader-attached) instead of requiring `./config`; assigns `ctx.config` for the rest of the app.
  - Activity and soundboard moved to convention: new `zen-bot/core/services.js` exports `api`; loader sets `ctx.services.core`. Removed manual `ctx.services = { activity, soundboard }` from core init.
  - `core/services/activity.js` and `core/services/soundboard.js`: public functions accept an optional `optLog` (e.g. `ctx.log`); callers in music pass `ctx.log`.

- **Database**
  - `createDatabaseContext(ctx)` and `register(namespace, initFn)` call `initFn(connection, ctx)`. Feature `database.js` implementations use `init(db, ctx)` and `ctx?.log`.
  - Example and music-stats database modules updated to `init(db, ctx)` and optional chaining on `ctx.log`.

- **Example feature**
  - Removed manual services init and `ctx.services.example` assignment; uses loader convention (`services.js` exports `api`).
  - Uses `ctx.exampleConfig` only (no `require("./config")` in index or events).
  - Example services and events use `ctx.log`; example services set module-level config from `ctx.exampleConfig` in `init(ctx)`.
  - Example events use defensive `config?.` for config access.
  - Database PATTERN comment updated: loader registers from `database.js` by convention.

- **LLM**
  - Uses `ctx.llmConfig` (loader-attached) instead of requiring `./config` in init.

- **Music**
  - Uses `ctx.log` only in init (no createLogger fallback). References `ctx.services.core` for activity and soundboard; passes `ctx.log` into activity/soundboard calls.
  - `music/events/playerStart.js`, `emptyQueue.js`, `music/commands/stop.js`: use `ctx.services.core.activity` and `ctx.services.core.soundboard` with `ctx.log`.

- **Music-comments**
  - Uses default naming: `ctx.services["music-comments"]`; added `api` export and `init(ctx)` in services.js; removed manual `ctx.services.comments` in index. Commands and events updated to `ctx.services["music-comments"]`.

- **Music-stats**
  - Init uses `ctx.log` only. Database init uses `init(db, ctx)` and `ctx?.log`.

- **All feature inits**
  - Use `const log = ctx.log` (no createLogger fallback).
  - Use loader-attached config where applicable (`ctx.coreConfig`, `ctx.llmConfig`, `ctx.exampleConfig`, etc.).

- **All commands**
  - Use `ctx.log` and `ctx.[featureName]Config` (or equivalent); no `require("../core/logger")` or `require("../config")` in command files.

- **All event handlers**
  - Use `ctx.log` and `ctx.[featureName]Config` where needed; no createLogger or config require in event files. Core `messageCreate` sets `ctx.log` to the command’s feature logger before execute.

- **CONTRIBUTING.md**
  - Context object: updated `services` (core, music-comments, example) and configs (`ctx.[featureName]Config`).
  - “Use in Feature”: config is loader-attached; no require or manual assign in init.
  - Logger: use `ctx.log` in init/commands/events; createLogger only in submodules.
  - Services: convention (api export, loader attaches); no manual assign in index.
  - Database: `init(db, ctx)`, use `ctx?.log`; sample updated.

- **example/README.md**
  - Services and Database samples updated to convention (init, api, `init(db, ctx)`, `ctx?.log`). Enabling section documents `.disabled` and `DISABLED_FEATURES`.

- **package.json**
  - Added script: `"create-feature": "node scripts/create-feature.js"`.

- **core/config.js**
  - Reads `disabledFeatures` from `get("DISABLED_FEATURES", [], { type: "array" })`.

### Removed

- Central feature list / `FEATURE_ORDER` (replaced by discovery and `dependsOn`).
- Redundant createLogger fallbacks in feature inits (loader guarantees `ctx.log`).
- Redundant config requires in feature inits (loader sets `ctx.[featureName]Config`).
- Manual `ctx.services` assignment in example and music-comments index (replaced by services convention).
- Manual `ctx.services = { activity, soundboard }` in core (replaced by core/services.js).
- Initial `musicConfig: null` from loader ctx (configs are loader-attached per feature).

### Fixed

- Event handler logging and config: single contract (ctx.log, ctx.[feature]Config) set by loader; no inconsistent fallbacks.
- Documentation aligned with loader behavior and conventions so new features follow one path.

---

### Notes (0.02.02)

- Submodules that are not invoked by the loader with `ctx` (e.g. `database/database.js`, `music/extractor.js`, `llm/llm.js`, `music/services/llm-comments.js`) continue to use `createLogger` or accept optional log where callers pass it.
- For current feature-development flow, see **CONTRIBUTING.md**. Historical plan docs are in **docs/archive/**.

[Unreleased]: https://github.com/your-org/zen-bot/compare/v0.02.02...HEAD
[0.02.02]: https://github.com/your-org/zen-bot/compare/v0.02.01...v0.02.02
