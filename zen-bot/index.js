/**
 * zen-bot entry point and feature loader.
 * Discovers features by convention (dir with index.js, commands/, or events/),
 * applies DISABLED_FEATURES and .disabled file, topo-sorts by dependsOn,
 * loads in order, collects events, wires them, then logs in.
 *
 * @module zen-bot
 */

const fs = require("fs");
const path = require("path");
const { createLogger } = require("./core/logger");

const log = createLogger("loader");

/** Reserved dir names never treated as features. */
const RESERVED_FEATURE_NAMES = new Set(["node_modules"]);

/** Discord-player event names → target "player"; everything else → "client". */
const PLAYER_EVENTS = new Set([
	"playerStart",
	"playerFinish",
	"emptyQueue",
	"queueDelete",
	"playerError",
	"error",
]);

/**
 * Discover feature directories: have at least one of index.js, commands/, or events/.
 *
 * @param {string} zenBotDir - Absolute path to zen-bot directory
 * @returns {string[]} Sorted feature names (excluding reserved)
 */
function discoverFeatures(zenBotDir) {
	const entries = fs.readdirSync(zenBotDir, { withFileTypes: true });
	const names = [];
	for (const e of entries) {
		if (!e.isDirectory() || RESERVED_FEATURE_NAMES.has(e.name)) continue;
		const featurePath = path.join(zenBotDir, e.name);
		const hasIndex = fs.existsSync(path.join(featurePath, "index.js"));
		const hasCommands = fs.existsSync(path.join(featurePath, "commands"));
		const hasEvents = fs.existsSync(path.join(featurePath, "events"));
		if (hasIndex || hasCommands || hasEvents) names.push(e.name);
	}
	return names.sort();
}

/**
 * Build enabled feature set: discovered minus disabled (config + .disabled file).
 * Core is never disabled.
 *
 * @param {string[]} discovered - From discoverFeatures()
 * @param {Set<string>} disabledSet - From config + .disabled
 * @param {string} zenBotDir
 * @returns {string[]}
 */
function enabledFeatures(discovered, disabledSet, zenBotDir) {
	const out = [];
	for (const name of discovered) {
		if (disabledSet.has(name)) continue;
		const featurePath = path.join(zenBotDir, name);
		if (fs.existsSync(path.join(featurePath, ".disabled"))) {
			if (name === "core") log.warn("core cannot be disabled; ignoring .disabled file in core");
			else continue;
		}
		out.push(name);
	}
	return out;
}

/**
 * Topo-sort features by dependsOn. Core must be first.
 *
 * @param {string[]} enabled - Enabled feature names
 * @param {string} zenBotDir
 * @returns {string[]} Load order
 */
function topoSortFeatures(enabled, zenBotDir) {
	const enabledSet = new Set(enabled);
	const depMap = new Map(); // feature -> dependsOn (array)

	for (const name of enabled) {
		const featurePath = path.join(zenBotDir, name);
		const indexPath = path.join(featurePath, "index.js");
		let deps = ["core"];
		if (fs.existsSync(indexPath)) {
			try {
				const feature = require(indexPath);
				if (Array.isArray(feature.dependsOn)) deps = feature.dependsOn;
			} catch (err) {
				log.warn(`Could not read dependsOn for ${name}, using ["core"]:`, err.message);
			}
		}
		for (const d of deps) {
			if (!enabledSet.has(d) && d !== "core") {
				throw new Error(`Feature "${name}" depends on "${d}" which is not enabled or missing.`);
			}
		}
		depMap.set(name, deps);
	}

	// Kahn's algorithm
	const inDegree = new Map();
	for (const name of enabled) inDegree.set(name, 0);
	for (const name of enabled) {
		for (const d of depMap.get(name) || []) {
			if (d !== name && enabledSet.has(d)) {
				inDegree.set(name, inDegree.get(name) + 1);
			}
		}
	}
	const queue = [];
	for (const name of enabled) {
		if (inDegree.get(name) === 0) queue.push(name);
	}
	const order = [];
	while (queue.length > 0) {
		const n = queue.shift();
		order.push(n);
		for (const name of enabled) {
			if (name === n) continue;
			const deps = depMap.get(name) || [];
			if (deps.includes(n)) {
				const newDeg = inDegree.get(name) - 1;
				inDegree.set(name, newDeg);
				if (newDeg === 0) queue.push(name);
			}
		}
	}

	if (order.length !== enabled.length) {
		throw new Error("Feature dependency cycle detected. Check dependsOn exports.");
	}

	// Ensure core is first
	const coreIdx = order.indexOf("core");
	if (coreIdx > 0) {
		order.splice(coreIdx, 1);
		order.unshift("core");
	}
	return order;
}

/**
 * Load event handlers from a feature's events/ directory.
 * target is inferred from event name when missing.
 *
 * @param {string} featurePath - Absolute path to the feature directory
 * @param {string} featureName - Feature name for logging and handler metadata
 * @returns {Array<{ event: string, target: "client"|"player", handle: Function, feature: string }>}
 */
function collectEventHandlers(featurePath, featureName) {
	const eventsDir = path.join(featurePath, "events");
	const handlers = [];

	if (!fs.existsSync(eventsDir)) return handlers;

	const files = fs.readdirSync(eventsDir).filter((f) => f.endsWith(".js"));

	for (const file of files) {
		try {
			const handler = require(path.join(eventsDir, file));
			if (handler.event && handler.handle) {
				let target = handler.target;
				if (target !== "client" && target !== "player") {
					target = PLAYER_EVENTS.has(handler.event) ? "player" : "client";
					if (handler.target !== undefined) {
						log.warn(
							`Event handler ${featureName}/events/${file}: invalid target (got "${handler.target}"), inferred "${target}"`
						);
					}
				}
				handlers.push({
					...handler,
					target,
					feature: featureName,
				});
				log.debug(`Collected event handler: ${featureName}/${handler.event}`);
			}
		} catch (err) {
			log.error(`Failed to load event ${featureName}/events/${file}:`, err.message);
		}
	}

	return handlers;
}

/**
 * Attach all collected handlers to ctx.client (target "client") or ctx.player.events (target "player").
 * Sets ctx.log to the handler's feature logger before each handle().
 *
 * @param {object} ctx - Shared context (client, player, loggers)
 * @param {Array<{ event: string, target: string, handle: Function, feature: string }>} handlers
 */
function wireEvents(ctx, handlers) {
	const clientEvents = new Map();
	const playerEvents = new Map();

	for (const handler of handlers) {
		const target = handler.target === "player" ? playerEvents : clientEvents;
		if (!target.has(handler.event)) target.set(handler.event, []);
		target.get(handler.event).push(handler);
	}

	for (const [event, eventHandlers] of clientEvents) {
		log.debug(`Wiring client event: ${event} (${eventHandlers.length} handlers)`);
		ctx.client.on(event, async (...args) => {
			for (const handler of eventHandlers) {
				try {
					ctx.log = ctx.loggers[handler.feature] ?? log;
					const result = await handler.handle(...args, ctx);
					if (event === "messageCreate" && handler.feature === "core" && result === true) {
						// Command was handled; other handlers still run
					}
				} catch (err) {
					log.error(`Error in ${handler.feature}/${event}:`, err);
				}
			}
		});
	}

	if (!ctx.player) {
		if (playerEvents.size > 0) {
			log.warn(`Skipping ${playerEvents.size} player event handler(s): no player`);
		}
	} else {
		for (const [event, eventHandlers] of playerEvents) {
			log.debug(`Wiring player event: ${event} (${eventHandlers.length} handlers)`);
			ctx.player.events.on(event, async (...args) => {
				for (const handler of eventHandlers) {
					try {
						ctx.log = ctx.loggers[handler.feature] ?? log;
						await handler.handle(...args, ctx);
					} catch (err) {
						log.error(`Error in ${handler.feature}/${event}:`, err);
					}
				}
			});
		}
	}
}

/**
 * Register database namespace from feature's database.js if present.
 * Namespace = module.namespace or feature name. Called after feature init.
 * Failures are logged and non-fatal (feature continues to load).
 */
function registerFeatureDatabase(ctx, featureName, zenBotDir) {
	if (!ctx.db) return;
	const featurePath = path.join(zenBotDir, featureName);
	const dbPath = path.join(featurePath, "database.js");
	if (!fs.existsSync(dbPath)) return;
	try {
		const dbModule = require(dbPath);
		const initFn = dbModule.default || dbModule.init;
		if (typeof initFn !== "function") return;
		const namespace = dbModule.namespace != null ? dbModule.namespace : featureName;
		ctx.db.register(namespace, initFn);
		log.debug(`Registered db namespace: ${namespace} (feature: ${featureName})`);
	} catch (err) {
		log.error(`Failed to register db for ${featureName}:`, err.message);
	}
}

/**
 * Attach services from feature's services.js if present. Called after feature init.
 * Failures are logged and non-fatal (feature continues to load).
 */
function attachFeatureServices(ctx, featureName, zenBotDir) {
	const featurePath = path.join(zenBotDir, featureName);
	const servicesPath = path.join(featurePath, "services.js");
	if (!fs.existsSync(servicesPath)) return;
	try {
		const services = require(servicesPath);
		if (typeof services.init === "function") {
			services.init(ctx);
		}
		const api = services.api != null ? services.api : services;
		if (api && typeof api === "object" && !ctx.services[featureName]) {
			ctx.services[featureName] = api;
			log.debug(`Attached services: ${featureName}`);
		}
	} catch (err) {
		log.error(`Failed to attach services for ${featureName}:`, err.message);
	}
}

/**
 * Load features, wire events, and log in. Resolves with the shared context when ready.
 *
 * @returns {Promise<object>} Shared context (client, player, db, commands, config, loggers, etc.)
 */
async function start() {
	log.info("Starting zen-bot...");

	const zenBotDir = __dirname;
	const config = require("./core/config");
	let disabledSet = new Set(config.disabledFeatures || []);
	if (disabledSet.has("core")) {
		log.warn("core cannot be disabled; ignoring DISABLED_FEATURES for core");
		disabledSet = new Set([...disabledSet].filter((n) => n !== "core"));
	}

	const discovered = discoverFeatures(zenBotDir);
	const enabled = enabledFeatures(discovered, disabledSet, zenBotDir);
	const loadOrder = topoSortFeatures(enabled, zenBotDir);

	const ctx = {
		client: null,
		player: null,
		db: null,
		commands: new Map(),
		services: {},
		config: null,
		enabledFeatures: enabled,
		loggers: {},
		log: null,
	};

	// Create loggers for all enabled features
	for (const name of enabled) {
		ctx.loggers[name] = createLogger(name);
	}

	const allHandlers = [];

	for (const featureName of loadOrder) {
		const featurePath = path.join(zenBotDir, featureName);
		if (!fs.existsSync(featurePath)) continue;

		ctx.log = ctx.loggers[featureName];

		// Config by convention
		const configPath = path.join(featurePath, "config.js");
		if (fs.existsSync(configPath)) {
			try {
				const cfg = require(configPath);
				ctx[`${featureName}Config`] = typeof cfg === "function" ? cfg() : cfg;
			} catch (err) {
				log.error(`Failed to load config for ${featureName}:`, err.message);
			}
		}

		const featureIndex = path.join(featurePath, "index.js");
		if (fs.existsSync(featureIndex)) {
			try {
				log.info(`Loading feature: ${featureName}`);
				const feature = require(featureIndex);
				if (typeof feature.init === "function") {
					await feature.init(ctx);
				}
			} catch (err) {
				log.error(`Failed to load feature ${featureName}:`, err);
				throw err;
			}
		}

		// DB namespace by convention (after init)
		registerFeatureDatabase(ctx, featureName, zenBotDir);

		// Services by convention (after init)
		attachFeatureServices(ctx, featureName, zenBotDir);

		const handlers = collectEventHandlers(featurePath, featureName);
		allHandlers.push(...handlers);
	}

	log.info(`Wiring ${allHandlers.length} event handlers...`);
	wireEvents(ctx, allHandlers);

	log.info("Logging in to Discord...");
	await ctx.client.login(ctx.config.botToken);

	log.info("zen-bot started successfully!");
	return ctx;
}

module.exports = { start };

if (require.main === module) {
	start().catch((err) => {
		console.error("Failed to start zen-bot:", err);
		process.exit(1);
	});
}
