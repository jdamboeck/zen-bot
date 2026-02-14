/**
 * playerStart handler — starts comment/reaction tracking and schedules playback from DB.
 * Uses queue.metadata.enqueuedMessage; creates thread if there are stored comments/reactions.
 *
 * @module zen-bot/music-comments/events/playerStart
 */

const services = require("../services");

module.exports = {
	event: "playerStart",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue - metadata.enqueuedMessage from play command
	 * @param {import("discord-player").Track} track
	 * @param {object} ctx - Shared context (ctx.db.music, log)
	 */
	async handle(queue, track, ctx) {
		const log = ctx.log;
		const channel = queue.channel;
		const guild = channel?.guild;
		const enqueuedMessage = queue.metadata?.enqueuedMessage;

		if (enqueuedMessage && guild && track) {
			try {
				if (log) log.debug("Player start: starting comment tracking (guild:", guild.id, "track:", track.url?.slice(0, 40), "...)");
				services.startTrackingSession(guild.id, enqueuedMessage, track.url, track.title);
				await services.ensurePlaybackThread(guild.id, enqueuedMessage, track.url, ctx);
				services.scheduleCommentAndReactionPlayback(guild.id, enqueuedMessage, track.url, ctx);
			} catch (err) {
				if (log) log.error("Failed to setup track comments:", err);
			}
		} else if (!enqueuedMessage && guild && track && log) {
			log.debug("Player start: no enqueued message for comments (guild:", guild.id, ")");
		}
	},
};
