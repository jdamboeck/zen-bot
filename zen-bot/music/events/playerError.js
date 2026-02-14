/**
 * playerError handler — logs audio playback errors (e.g. stream failures).
 *
 * @module zen-bot/music/events/playerError
 */

module.exports = {
	event: "playerError",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {Error} error
	 * @param {object} ctx - Shared context (log)
	 */
	async handle(queue, error, ctx) {
		const log = ctx.log;
		const guildId = queue?.guild?.id ?? "unknown";
		if (log) log.error("Audio player error (guild:", guildId, "):", error.message);
		if (log) log.debug("Player error details:", error);
	},
};
