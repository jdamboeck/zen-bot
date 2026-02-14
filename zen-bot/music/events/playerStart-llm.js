/**
 * playerStart-llm handler — starts periodic LLM-generated comments during track playback.
 * Adds fun facts/comments about the track every 2 minutes while it's playing.
 *
 * @module zen-bot/music/events/playerStart-llm
 */

const llmComments = require("../services/llm-comments");

module.exports = {
	event: "playerStart",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {import("discord-player").Track} track
	 * @param {object} ctx - Shared context (llm, log)
	 */
	async handle(queue, track, ctx) {
		const log = ctx.log;
		if (!ctx.llm) return;

		const enqueuedMessage = queue.metadata?.enqueuedMessage;
		if (!enqueuedMessage) {
			if (log) log.debug("No enqueued message found, skipping periodic comments");
			return;
		}

		const guildId = queue.guild?.id;
		if (!guildId) {
			if (log) log.debug("No guild ID, skipping periodic comments");
			return;
		}

		if (log) log.debug(`Starting periodic comments for "${track.title}" (guild: ${guildId})`);
		llmComments.startPeriodicComments(guildId, enqueuedMessage, track, ctx);
	},
};
