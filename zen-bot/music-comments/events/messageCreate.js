/**
 * messageCreate handler — records replies to the tracked enqueued message as track comments.
 * Runs after core command handler; only processes messages that are replies to the active session message.
 *
 * @module zen-bot/music-comments/events/messageCreate
 */

const services = require("../services");

module.exports = {
	event: "messageCreate",
	target: "client",

	/**
	 * @param {import("discord.js").Message} message
	 * @param {object} ctx - Shared context (ctx.services.comments, ctx.db.music)
	 * @returns {Promise<boolean>} True if message was a reply to tracked message and was handled
	 */
	async handle(message, ctx) {
		return services.handlePotentialReply(message, ctx);
	},
};
