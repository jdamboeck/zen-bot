/**
 * playerFinish-llm handler — stops periodic LLM-generated comments when a track finishes.
 *
 * @module zen-bot/music/events/playerFinish-llm
 */

const llmComments = require("../services/llm-comments");

module.exports = {
	event: "playerFinish",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {import("discord-player").Track} track
	 * @param {object} ctx - Shared context (log)
	 */
	async handle(queue, track, ctx) {
		const log = ctx.log;
		const guildId = queue.guild?.id;
		if (!guildId) return;

		if (log) log.debug(`Track finished: "${track.title}", stopping periodic comments (guild: ${guildId})`);
		llmComments.stopPeriodicComments(guildId);
	},
};
