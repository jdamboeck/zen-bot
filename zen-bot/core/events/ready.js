/**
 * ready handler — logs once when the Discord client is connected and ready.
 *
 * @module zen-bot/core/events/ready
 */

const { createLogger } = require("../logger");

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
	},
};
