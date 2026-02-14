/**
 * Resume command — resumes paused playback.
 *
 * @module zen-bot/music/commands/resume
 */

const { useQueue } = require("discord-player");

module.exports = {
	name: "resume",

	/**
	 * @param {import("discord.js").Message} message
	 * @param {string[]} args
	 * @param {object} ctx
	 * @returns {Promise<import("discord.js").Message>}
	 */
	async execute(message, args, ctx) {
		const log = ctx.log;
		const queue = useQueue(message.guild.id);
		if (!queue) {
			if (log) log.debug("Resume requested but no queue (guild:", message.guild.id, ")");
			return message.reply("There is no music playing right now!");
		}

		if (log) log.info("Resuming playback (guild:", message.guild.id, ")");
		queue.node.setPaused(false);
		return message.reply("▶️ Playback has been resumed.");
	},
};
