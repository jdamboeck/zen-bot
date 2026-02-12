/**
 * queueDelete handler — stops periodic LLM-generated comments when the queue is deleted (#stop).
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
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {object} ctx
	 */
	async handle(queue, ctx) {
		const guildId = queue.guild?.id;
		if (!guildId) return;

		log.debug(`Queue deleted, stopping periodic comments (guild: ${guildId})`);
		llmComments.stopPeriodicComments(guildId);
	},
};
