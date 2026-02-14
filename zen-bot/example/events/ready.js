/**
 * Ready Event Handler - Runs when the bot connects to Discord.
 *
 * Demonstrates:
 * - One-time initialization events
 * - Accessing ctx.client for bot information
 * - Logging startup information
 *
 * NOTE: This event fires once when the bot first connects.
 * Multiple features can have ready handlers - they all run.
 *
 * @module zen-bot/example/events/ready
 */

module.exports = {
	event: "clientReady",
	target: "client",

	/**
	 * @param {import('discord.js').Client} client
	 * @param {object} ctx - Shared context (log, exampleConfig)
	 */
	async handle(client, ctx) {
		const log = ctx.log;
		const config = ctx.exampleConfig;

		if (log) log.info("Example feature is ready!");
		if (log) log.info(`Greeting configured: "${config?.greeting}"`);
		if (log) log.info(`Max greetings: ${config?.maxGreetings}`);
		if (log) log.info(`Cooldown: ${config?.cooldownFormatted}`);

		if (log) log.info(`Bot is in ${ctx.client.guilds.cache.size} guilds`);

		if (config?.verbose && log) {
			for (const [, guild] of ctx.client.guilds.cache) {
				log.debug(`  - ${guild.name} (${guild.memberCount} members)`);
			}
		}

		// ───────────────────────────────────────────────────────────────────────
		// ONE-TIME SETUP
		// ───────────────────────────────────────────────────────────────────────
		// Perform any initialization that requires the bot to be connected

		// Example: Could set up scheduled tasks, sync data, etc.
	},
};
