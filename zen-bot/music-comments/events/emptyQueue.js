/**
 * emptyQueue handler — stops the comment-tracking session for the guild so replies/reactions are no longer recorded.
 *
 * @module zen-bot/music-comments/events/emptyQueue
 */

const services = require("../services");

module.exports = {
	event: "emptyQueue",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {object} ctx - Shared context (log)
	 */
	async handle(queue, ctx) {
		const log = ctx.log;
		const guildId = queue?.channel?.guild?.id;
		if (guildId) {
			if (log) log.debug("Empty queue: stopping comment tracking session (guild:", guildId, ")");
			services.stopTrackingSession(guildId);
		}
	},
};
