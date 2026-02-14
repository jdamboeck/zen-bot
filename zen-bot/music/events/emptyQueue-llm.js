/**
 * emptyQueue-llm handler — stops periodic LLM-generated comments when the queue finishes.
 *
 * @module zen-bot/music/events/emptyQueue-llm
 */

const llmComments = require("../services/llm-comments");

module.exports = {
	event: "emptyQueue",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {object} ctx - Shared context (log)
	 */
	async handle(queue, ctx) {
		const log = ctx.log;
		const guildId = queue.guild?.id;
		if (!guildId) return;

		if (log) log.debug(`Queue empty, stopping periodic comments (guild: ${guildId})`);
		llmComments.stopPeriodicComments(guildId);
	},
};
