/**
 * emptyQueue handler — clears bot activity and voice channel status when the queue finishes.
 * Session cleanup for track comments is done by music-comments.
 *
 * @module zen-bot/music/events/emptyQueue
 */

module.exports = {
	event: "emptyQueue",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {object} ctx - Shared context (ctx.services.core.activity, log)
	 */
	async handle(queue, ctx) {
		const log = ctx.log;
		const guildId = queue?.guild?.id ?? "unknown";
		if (log) log.info("Queue empty, clearing activity (guild:", guildId, ")");
		if (log) log.debug("Queue empty, clearing activity");

		ctx.services.core.activity.setBotActivity(ctx.client, null, ctx.log);

		if (queue?.channel) {
			ctx.services.core.activity.setVoiceChannelStatus(ctx.client, queue.channel, "", ctx.log);
		}
	},
};
