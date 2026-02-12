/**
 * playerStart-llm handler — starts periodic LLM-generated comments during track playback.
 * Adds fun facts/comments about the track every 2 minutes while it's playing.
 *
 * @module zen-bot/music/events/playerStart-llm
 */

const { createLogger } = require("../../core/logger");
const llmComments = require("../services/llm-comments");

const log = createLogger("playerStart-llm");

module.exports = {
	event: "playerStart",
	target: "player",

	/**
	 * Start periodic comments for the track if LLM is available.
	 *
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {import("discord-player").Track} track
	 * @param {object} ctx - Shared context (llm)
	 */
	async handle(queue, track, ctx) {
		if (!ctx.llm) {
			return; // LLM not available, skip
		}

		const enqueuedMessage = queue.metadata?.enqueuedMessage;
		if (!enqueuedMessage) {
			log.debug("No enqueued message found, skipping periodic comments");
			return;
		}

		const guildId = queue.guild?.id;
		if (!guildId) {
			log.debug("No guild ID, skipping periodic comments");
			return;
		}

		log.debug(`Starting periodic comments for "${track.title}" (guild: ${guildId})`);
		llmComments.startPeriodicComments(guildId, enqueuedMessage, track, ctx);
	},
};
