/**
 * Core feature — Discord client, command registry, and shared services.
 * Must load first; other features depend on ctx.client, ctx.commands, ctx.config.
 * ctx.db is provided by the database feature (load after core).
 *
 * @module zen-bot/core
 */

const { Client, GatewayIntentBits } = require("discord.js");
const { loadCommands } = require("./commands");

/**
 * Create client and command registry. Config and services are attached by loader (ctx.coreConfig, ctx.services.core).
 *
 * @param {object} ctx - Shared context (mutated: client, commands, config)
 * @returns {Promise<void>}
 */
async function init(ctx) {
	const log = ctx.log;
	const config = ctx.coreConfig;
	log.info("Initializing core...");
	log.debug("Config: prefix =", config?.prefix);

	ctx.client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildVoiceStates,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildMessageReactions,
			GatewayIntentBits.MessageContent,
		],
	});

	ctx.commands = loadCommands(ctx.enabledFeatures);
	ctx.config = config;

	log.info("Core initialized");
}

module.exports = { init, dependsOn: [] };
