/**
 * emptyQueue-llm handler — stops periodic LLM-generated comments when the queue finishes.
 *
 * @module zen-bot/music/events/emptyQueue-llm
 */

const { createLogger } = require("../../core/logger");
const llmComments = require("../services/llm-comments");

const log = createLogger("emptyQueue-llm");

module.exports = {
	event: "emptyQueue",
	target: "player",

	/**
	 * Stop periodic comments for this guild when the queue is empty.
	 *
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {object} ctx
	 */
	async handle(queue, ctx) {
		const guildId = queue.guild?.id;
		if (!guildId) return;

		log.debug(`Queue empty, stopping periodic comments (guild: ${guildId})`);
		llmComments.stopPeriodicComments(guildId);
	},
};
