/**
 * ready handler — logs once when the Discord client is connected and ready.
 * Sets presence to green (online) and "Operational" when no startup error occurred.
 *
 * @module zen-bot/core/events/ready
 */

const { createLogger } = require("../logger");
const activity = require("../services/activity");

const log = createLogger("core");

module.exports = {
	event: "clientReady",
	target: "client",

	/**
	 * @param {import("discord.js").Client} client
	 * @param {object} ctx - Shared context
	 */
	async handle(client, ctx) {
		log.info("Discord client ready — logged in as", client.user?.tag);
		log.debug("Guilds:", client.guilds.cache.size, "| Cached users:", client.users.cache.size);

		// No startup error: we reached ready — set green circle and Operational
		if (client.user) {
			client.user.setPresence({ status: "online" });
			activity.setBotActivity(client, "🟢 Operational");
		}
	},
};
