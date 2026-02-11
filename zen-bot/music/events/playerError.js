/**
 * playerError handler — logs audio playback errors (e.g. stream failures).
 *
 * @module zen-bot/music/events/playerError
 */

const { createLogger } = require("../../core/logger");

const log = createLogger("player");

module.exports = {
	event: "playerError",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {Error} error
	 * @param {object} ctx
	 */
	async handle(queue, error, ctx) {
		const guildId = queue?.guild?.id ?? "unknown";
		log.error("Audio player error (guild:", guildId, "):", error.message);
		log.debug("Player error details:", error);
	},
};
