/**
 * Queue error handler — logs queue-level errors (e.g. track resolution failures).
 *
 * @module zen-bot/music/events/error
 */

const { createLogger } = require("../../core/logger");

const log = createLogger("player");

module.exports = {
	event: "error",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {Error} error
	 * @param {object} ctx
	 */
	async handle(queue, error, ctx) {
		const guildId = queue?.guild?.id ?? "unknown";
		log.error("Queue error (guild:", guildId, "):", error.message);
		log.debug("Queue error details:", error);
	},
};
