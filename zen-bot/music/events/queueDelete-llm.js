/**
 * queueDelete handler — stops periodic LLM-generated comments when the queue is deleted (#stop).
 * We read queue.guild?.id immediately; the queue may be tearing down so we avoid further access.
 *
 * @module zen-bot/music/events/queueDelete-llm
 */

const llmComments = require("../services/llm-comments");

module.exports = {
	event: "queueDelete",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {object} ctx - Shared context (log)
	 */
	async handle(queue, ctx) {
		const log = ctx.log;
		const guildId = queue?.guild?.id;
		if (!guildId) {
			if (log) log.debug("Queue deleted but no guild id; skipping periodic comment cleanup");
			return;
		}

		try {
			if (log) log.debug(`Queue deleted, stopping periodic comments (guild: ${guildId})`);
			llmComments.stopPeriodicComments(guildId);
		} catch (err) {
			if (log) log.warn("Error stopping periodic comments on queue delete:", err.message);
		}
	},
};
