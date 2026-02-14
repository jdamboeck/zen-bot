/**
 * Queue error handler — logs queue-level errors (e.g. track resolution failures).
 *
 * @module zen-bot/music/events/error
 */

module.exports = {
	event: "error",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {Error} error
	 * @param {object} ctx - Shared context (log)
	 */
	async handle(queue, error, ctx) {
		const log = ctx.log;
		const guildId = queue?.guild?.id ?? "unknown";
		if (log) log.error("Queue error (guild:", guildId, "):", error.message);
		if (log) log.debug("Queue error details:", error);
	},
};
