/**
 * emptyQueue handler — clears bot activity and voice channel status when the queue finishes.
 * Session cleanup for track comments is done by music-comments.
 *
 * @module zen-bot/music/events/emptyQueue
 */

const { createLogger } = require("../../core/logger");

const log = createLogger("emptyQueue");

module.exports = {
	event: "emptyQueue",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {object} ctx - Shared context (services.activity)
	 */
	async handle(queue, ctx) {
		const guildId = queue?.guild?.id ?? "unknown";
		log.info("Queue empty, clearing activity (guild:", guildId, ")");
		log.debug("Queue empty, clearing activity");

		ctx.services.activity.setBotActivity(ctx.client, null);

		if (queue?.channel) {
			ctx.services.activity.setVoiceChannelStatus(ctx.client, queue.channel, "");
		}
	},
};
