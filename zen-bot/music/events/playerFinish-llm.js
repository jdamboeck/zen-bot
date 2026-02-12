/**
 * playerFinish-llm handler — stops periodic LLM-generated comments when a track finishes.
 *
 * @module zen-bot/music/events/playerFinish-llm
 */

const { createLogger } = require("../../core/logger");
const llmComments = require("../services/llm-comments");

const log = createLogger("playerFinish-llm");

module.exports = {
	event: "playerFinish",
	target: "player",

	/**
	 * Stop periodic comments for this guild when the track finishes.
	 *
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {import("discord-player").Track} track
	 * @param {object} ctx
	 */
	async handle(queue, track, ctx) {
		const guildId = queue.guild?.id;
		if (!guildId) return;

		log.debug(`Track finished: "${track.title}", stopping periodic comments (guild: ${guildId})`);
		llmComments.stopPeriodicComments(guildId);
	},
};
