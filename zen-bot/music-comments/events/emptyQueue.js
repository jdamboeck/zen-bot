/**
 * emptyQueue handler — stops the comment-tracking session for the guild so replies/reactions are no longer recorded.
 *
 * @module zen-bot/music-comments/events/emptyQueue
 */

const { createLogger } = require("../../core/logger");
const services = require("../services");

const log = createLogger("music-comments");

module.exports = {
	event: "emptyQueue",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {object} ctx
	 */
	async handle(queue, ctx) {
		const guildId = queue?.channel?.guild?.id;
		if (guildId) {
			log.debug("Empty queue: stopping comment tracking session (guild:", guildId, ")");
			services.stopTrackingSession(guildId);
		}
	},
};
