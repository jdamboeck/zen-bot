/**
 * messageReactionAdd handler — records reactions on the tracked enqueued message with timestamp.
 * Only handles reactions on the current session's enqueued message; loader passes (reaction, user, details, ctx).
 *
 * @module zen-bot/music-comments/events/messageReactionAdd
 */

const services = require("../services");

module.exports = {
	event: "messageReactionAdd",
	target: "client",

	/**
	 * @param {import("discord.js").MessageReaction} reaction
	 * @param {import("discord.js").User} user
	 * @param {object} _details - Discord.js reaction event details
	 * @param {object} ctx - Shared context (ctx.db.music)
	 * @returns {Promise<boolean>} True if reaction was on tracked message and was saved
	 */
	async handle(reaction, user, _details, ctx) {
		return services.handleReactionAdd(reaction, user, ctx);
	},
};
