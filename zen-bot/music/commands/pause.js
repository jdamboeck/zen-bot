/**
 * Pause command — pauses the current track (queue remains).
 *
 * @module zen-bot/music/commands/pause
 */

const { useQueue } = require("discord-player");
const { createLogger } = require("../../core/logger");

const log = createLogger("pause");

module.exports = {
	name: "pause",

	/**
	 * @param {import("discord.js").Message} message
	 * @param {string[]} args
	 * @param {object} ctx
	 * @returns {Promise<import("discord.js").Message>}
	 */
	async execute(message, args, ctx) {
		const queue = useQueue(message.guild.id);
		if (!queue) {
			log.debug("Pause requested but no queue (guild:", message.guild.id, ")");
			return message.reply("There is no music playing right now!");
		}

		log.info("Pausing playback (guild:", message.guild.id, ")");
		queue.node.setPaused(true);
		return message.reply("⏸️ Playback has been paused.");
	},
};
