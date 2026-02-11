/**
 * playerStart handler — starts comment/reaction tracking and schedules playback from DB.
 * Uses queue.metadata.enqueuedMessage; creates thread if there are stored comments/reactions.
 *
 * @module zen-bot/music-comments/events/playerStart
 */

const { createLogger } = require("../../core/logger");
const services = require("../services");

const log = createLogger("music-comments");

module.exports = {
	event: "playerStart",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue - metadata.enqueuedMessage from play command
	 * @param {import("discord-player").Track} track
	 * @param {object} ctx - Shared context (ctx.db.music)
	 */
	async handle(queue, track, ctx) {
		const channel = queue.channel;
		const guild = channel?.guild;
		const enqueuedMessage = queue.metadata?.enqueuedMessage;

		if (enqueuedMessage && guild && track) {
			try {
				log.debug("Player start: starting comment tracking (guild:", guild.id, "track:", track.url?.slice(0, 40), "...)");
				// Start tracking session for this playback
				services.startTrackingSession(guild.id, enqueuedMessage, track.url, track.title);

				// Create a thread from the enqueued message for playback when there are comments/reactions
				await services.ensurePlaybackThread(guild.id, enqueuedMessage, track.url, ctx);

				// Schedule playback of comments and reactions in sync (single timeline by timestamp)
				services.scheduleCommentAndReactionPlayback(guild.id, enqueuedMessage, track.url, ctx);
			} catch (err) {
				log.error("Failed to setup track comments:", err);
			}
		} else if (!enqueuedMessage && guild && track) {
			log.debug("Player start: no enqueued message for comments (guild:", guild.id, ")");
		}
	},
};
