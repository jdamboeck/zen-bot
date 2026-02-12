/**
 * zen-bot entry point and feature loader.
 * Loads features in FEATURE_ORDER, collects event handlers from each feature's events/ dir,
 * wires them to the Discord client or player, then logs in.
 *
 * @module zen-bot
 */

const fs = require("fs");
const path = require("path");
const { createLogger } = require("./core/logger");

const log = createLogger("loader");

/** Load order; later features can depend on ctx populated by earlier ones. database must follow core and precede any feature that uses ctx.db. */
const FEATURE_ORDER = [
	"core",
	"database",
	"llm",
	"music",
	"moderation",
	"music-stats",
	"music-comments",
];

/**
 * Load event handlers from a feature's events/ directory.
 * Each .js file must export { event, target, handle }.
 *
 * @param {string} featurePath - Absolute path to the feature directory (e.g. zen-bot/music)
 * @param {string} featureName - Feature name (e.g. "music") for logging and handler metadata
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
				handlers.push({
					...handler,
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
 *
 * @param {object} ctx - Shared context (client, player)
 * @param {Array<{ event: string, target: string, handle: Function, feature: string }>} handlers
 */
function wireEvents(ctx, handlers) {
	// Group handlers by event and target
	const clientEvents = new Map();
	const playerEvents = new Map();

	for (const handler of handlers) {
		const target = handler.target === "player" ? playerEvents : clientEvents;
		if (!target.has(handler.event)) {
			target.set(handler.event, []);
		}
		target.get(handler.event).push(handler);
	}

	// Wire client events
	for (const [event, eventHandlers] of clientEvents) {
		log.debug(`Wiring client event: ${event} (${eventHandlers.length} handlers)`);
		ctx.client.on(event, async (...args) => {
			for (const handler of eventHandlers) {
				try {
					const result = await handler.handle(...args, ctx);
					// For messageCreate, if a handler returns true, it handled the message
					// (used by command dispatch - other handlers should still run for replies)
					if (event === "messageCreate" && handler.feature === "core" && result === true) {
						// Command was handled, but we still want other handlers to run
						// (music-comments needs to check for replies)
					}
				} catch (err) {
					log.error(`Error in ${handler.feature}/${event}:`, err);
				}
			}
		});
	}

	// Wire player events (only if player was created by a loaded feature, e.g. music)
	if (!ctx.player) {
		if (playerEvents.size > 0) {
			log.warn(`Skipping ${playerEvents.size} player event handler(s): no player (music feature not loaded)`);
		}
	} else {
		for (const [event, eventHandlers] of playerEvents) {
			log.debug(`Wiring player event: ${event} (${eventHandlers.length} handlers)`);
			ctx.player.events.on(event, async (...args) => {
				for (const handler of eventHandlers) {
					try {
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
 * Load features, wire events, and log in. Resolves with the shared context when ready.
 *
 * @returns {Promise<object>} Shared context (client, player, db, commands, config, etc.)
 */
async function start() {
	log.info("Starting zen-bot...");

	// Shared context object
	const ctx = {
		client: null,
		player: null,
		db: null,
		commands: new Map(),
		services: {},
		config: null,
		musicConfig: null,
		/** Feature names that are enabled (from FEATURE_ORDER). Used by command loader and help. */
		enabledFeatures: [...FEATURE_ORDER],
	};

	const zenBotDir = __dirname;
	const allHandlers = [];

	// Load features in order
	for (const featureName of FEATURE_ORDER) {
		const featurePath = path.join(zenBotDir, featureName);

		if (!fs.existsSync(featurePath)) {
			log.warn(`Feature not found: ${featureName}`);
			continue;
		}

		const featureIndex = path.join(featurePath, "index.js");
		if (!fs.existsSync(featureIndex)) {
			log.warn(`Feature missing index.js: ${featureName}`);
			continue;
		}

		try {
			log.info(`Loading feature: ${featureName}`);
			const feature = require(featureIndex);

			if (typeof feature.init === "function") {
				await feature.init(ctx);
			}

			// Collect event handlers
			const handlers = collectEventHandlers(featurePath, featureName);
			allHandlers.push(...handlers);
		} catch (err) {
			log.error(`Failed to load feature ${featureName}:`, err);
			throw err;
		}
	}

	// Wire all event handlers
	log.info(`Wiring ${allHandlers.length} event handlers...`);
	wireEvents(ctx, allHandlers);

	// Login
	log.info("Logging in to Discord...");
	await ctx.client.login(ctx.config.botToken);

	log.info("zen-bot started successfully!");
	return ctx;
}

module.exports = { start };

// If this is the entry point, start zen-bot
if (require.main === module) {
	start().catch((err) => {
		console.error("Failed to start zen-bot:", err);
		process.exit(1);
	});
}
