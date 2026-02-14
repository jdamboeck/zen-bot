/**
 * ready handler — logs once when the Discord client is connected and ready.
 * Sets presence to green (online) and "Operational" when no startup error occurred.
 *
 * @module zen-bot/core/events/ready
 */

const activity = require("../services/activity");

module.exports = {
	event: "clientReady",
	target: "client",

	/**
	 * @param {import("discord.js").Client} client
	 * @param {object} ctx - Shared context (log set by loader)
	 */
	async handle(client, ctx) {
		const log = ctx.log;
		if (log) log.info("Discord client ready — logged in as", client.user?.tag);
		if (log) log.debug("Guilds:", client.guilds.cache.size, "| Cached users:", client.users.cache.size);

		// No startup error: we reached ready — set green circle and Operational
		if (client.user) {
			client.user.setPresence({ status: "online" });
			activity.setBotActivity(client, "🟢 Operational");
		}
	},
};
