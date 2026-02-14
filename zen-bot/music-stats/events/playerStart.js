/**
 * playerStart handler — records each play to ctx.db.music (play_history) for musicstats.
 *
 * @module zen-bot/music-stats/events/playerStart
 */

module.exports = {
	event: "playerStart",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue - metadata.author is the requesting user
	 * @param {import("discord-player").Track} track
	 * @param {object} ctx - Shared context (ctx.db.music, log)
	 */
	async handle(queue, track, ctx) {
		const log = ctx.log;
		const channel = queue.channel;
		const guild = channel?.guild;
		const requestedBy = queue.metadata?.author;

		if (requestedBy && guild && track) {
			try {
				if (log) log.debug("Recording play (guild:", guild.id, "title:", track.title?.slice(0, 40), "user:", requestedBy.username, ")");
				ctx.db.music.recordPlay({
					videoUrl: track.url,
					videoTitle: track.title,
					userId: requestedBy.id,
					userName: requestedBy.username || requestedBy.tag,
					guildId: guild.id,
				});
			} catch (err) {
				if (log) log.error("Failed to record play:", err);
			}
		}
	},
};
