/**
 * queueDelete handler — stops periodic LLM-generated comments when the queue is deleted (#stop).
 * We read queue.guild?.id immediately; the queue may be tearing down so we avoid further access.
 *
 * @module zen-bot/music/events/queueDelete-llm
 */

const { createLogger } = require("../../core/logger");
const llmComments = require("../services/llm-comments");

const log = createLogger("queueDelete-llm");

module.exports = {
	event: "queueDelete",
	target: "player",

	/**
	 * Stop periodic comments for this guild when the queue is deleted.
	 *
	 * @param {import("discord-player").GuildQueue} queue - Queue being deleted (read guild once, then avoid further access)
	 * @param {object} ctx - Shared context
	 */
	async handle(queue, ctx) {
		const guildId = queue?.guild?.id;
		if (!guildId) {
			log.debug("Queue deleted but no guild id; skipping periodic comment cleanup");
			return;
		}

		try {
			log.debug(`Queue deleted, stopping periodic comments (guild: ${guildId})`);
			llmComments.stopPeriodicComments(guildId);
		} catch (err) {
			log.warn("Error stopping periodic comments on queue delete:", err.message);
		}
	},
};
