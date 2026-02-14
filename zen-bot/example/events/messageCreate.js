/**
 * MessageCreate Event Handler - Responds to specific messages.
 *
 * Demonstrates:
 * - Event handler structure for Discord.js events
 * - Filtering messages (ignore bots, check content)
 * - Accessing services and config from ctx
 * - Non-blocking event handling
 *
 * EVENT DISCOVERY:
 * Events are auto-discovered from zen-bot/[feature]/events/*.js
 * Multiple features can handle the same event; handlers run in load order (dependsOn).
 *
 * @module zen-bot/example/events/messageCreate
 */

module.exports = {
	event: "messageCreate",
	target: "client",

	/**
	 * @param {import('discord.js').Message} message
	 * @param {object} ctx - Shared context (log, exampleConfig)
	 */
	async handle(message, ctx) {
		const log = ctx.log;
		const config = ctx.exampleConfig;

		if (message.author.bot) return;
		if (!config?.featureEnabled) return;
		if (!message.guild) return;

		const content = message.content.toLowerCase();

		if (content.includes("good bot")) {
			if (log) log.debug(`Received "good bot" from ${message.author.username}`);
			try {
				await message.react("❤️");
				if (log) log.info(`Reacted to "good bot" from ${message.author.username}`);
			} catch (err) {
				if (log) log.warn(`Failed to react: ${err.message}`);
			}
			return;
		}

		if (content.includes("bad bot")) {
			if (log) log.debug(`Received "bad bot" from ${message.author.username}`);
			try {
				await message.react("😢");
				if (log) log.info(`Reacted to "bad bot" from ${message.author.username}`);
			} catch (err) {
				if (log) log.warn(`Failed to react: ${err.message}`);
			}
			return;
		}

		if (config?.verbose && log) {
			log.debug(`Message in #${message.channel.name}: ${message.content.slice(0, 50)}`);
		}
	},
};
