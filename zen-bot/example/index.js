/**
 * Example Feature - Demonstrates all zen-bot patterns.
 *
 * This feature serves as a reference implementation showing:
 * - Feature initialization with the context object
 * - Configuration with environment variable overrides
 * - Creating and exposing services
 * - Registering a database namespace (ctx.db.example)
 * - Logging with prefixed loggers
 * - Inter-feature dependencies
 *
 * Depends on core and database (dependsOn in module.exports ensures load order).
 *
 * @module zen-bot/example
 */

/**
 * Initialize the example feature.
 *
 * This function is called by the feature loader (bot/index.js) during startup.
 * It receives the shared context object containing resources from previously
 * loaded features.
 *
 * @param {object} ctx - Shared context object
 * @param {import('discord.js').Client} ctx.client - Discord.js client (from core)
 * @param {import('discord-player').Player} ctx.player - discord-player instance (from music)
 * @param {object} ctx.db - Database context with namespaced access (from database feature)
 * @param {Map} ctx.commands - Command registry (from core)
 * @param {object} ctx.services - Shared services from all features
 * @param {object} ctx.config - Core configuration (token, prefix)
 */
async function init(ctx) {
	const log = ctx.log;
	log.info("Initializing example feature...");

	if (!ctx.client) throw new Error("Example feature requires core feature (ctx.client missing)");
	if (!ctx.db) throw new Error("Example feature requires database feature (ctx.db missing)");

	const cfg = ctx.exampleConfig;
	log.debug("Configuration loaded:", {
		greeting: cfg.greeting,
		maxGreetings: cfg.maxGreetings,
		cooldownMs: cfg.cooldownMs,
		featureEnabled: cfg.featureEnabled,
	});

	// Feature-specific setup (services are attached by loader from services.js)
	// Example: Log when the bot is ready
	ctx.client.once("clientReady", () => {
		log.info(`Example feature active! Greeting: "${cfg.greeting}"`);
	});

	log.info("Example feature initialized (ctx.db.example available)");
}

module.exports = { init, dependsOn: ["core", "database"] };
