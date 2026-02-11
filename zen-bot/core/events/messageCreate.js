/**
 * messageCreate handler — dispatches prefix commands from core command registry.
 * Ignores bots; only messages starting with config.prefix are parsed as commands.
 *
 * @module zen-bot/core/events/messageCreate
 */

const { createLogger } = require("../logger");
const config = require("../config");

const log = createLogger("commands");

module.exports = {
	event: "messageCreate",
	target: "client",

	/**
	 * Parse prefix, resolve command, and execute. Other handlers (e.g. music-comments) still run.
	 *
	 * @param {import("discord.js").Message} message
	 * @param {object} ctx - Shared context (commands, config, etc.)
	 * @returns {Promise<boolean>} True if a command was found and executed
	 */
	async handle(message, ctx) {
		// Ignore bot messages
		if (message.author.bot) return false;

		// Check for command prefix
		if (!message.content.startsWith(config.prefix)) return false;

		const args = message.content.slice(config.prefix.length).trim().split(/ +/);
		const commandName = args.shift().toLowerCase();

		log.debug(`Command: ${commandName}, Args: ${args.join(" ")}`);

		const command = ctx.commands.get(commandName);
		if (!command) {
			log.debug(`Unknown command: ${commandName}`);
			return false;
		}

		log.info(`Executing command: ${commandName} (by ${message.author.username})`);
		try {
			await command.execute(message, args, ctx);
		} catch (err) {
			log.error(`Error executing ${commandName}:`, err);
			message.reply(`Something went wrong: ${err.message}`).catch(() => {});
		}

		return true;
	},
};
