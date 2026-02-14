/**
 * messageCreate handler — dispatches prefix commands from core command registry.
 * Ignores bots; only messages starting with config.prefix are parsed as commands.
 * Uses ctx.log and ctx.config (API over direct dependency).
 *
 * @module zen-bot/core/events/messageCreate
 */

module.exports = {
	event: "messageCreate",
	target: "client",

	/**
	 * Parse prefix, resolve command, and execute. Other handlers (e.g. music-comments) still run.
	 * Sets ctx.log to the command's feature logger before execute.
	 *
	 * @param {import("discord.js").Message} message
	 * @param {object} ctx - Shared context (commands, config, loggers, etc.)
	 * @returns {Promise<boolean>} True if a command was found and executed
	 */
	async handle(message, ctx) {
		if (message.author.bot) return false;
		const config = ctx.config || {};
		if (!message.content.startsWith(config.prefix)) return false;

		const args = message.content.slice(config.prefix.length).trim().split(/ +/);
		const commandName = args.shift().toLowerCase();
		const log = ctx.log;

		log.debug(`Command: ${commandName}, Args: ${args.join(" ")}`);

		const command = ctx.commands.get(commandName);
		if (!command) {
			log.debug(`Unknown command: ${commandName}`);
			return false;
		}

		if (ctx.loggers && command.feature && ctx.loggers[command.feature]) {
			ctx.log = ctx.loggers[command.feature];
		}
		ctx.log.info(`Executing command: ${commandName} (by ${message.author.username})`);
		try {
			await command.execute(message, args, ctx);
		} catch (err) {
			ctx.log.error(`Error executing ${commandName}:`, err);
			message.reply(`Something went wrong: ${err.message}`).catch(() => {});
		}

		return true;
	},
};
