/**
 * Skip command — skips the currently playing track and advances to the next in the queue.
 *
 * @module zen-bot/music/commands/skip
 */

const { useQueue } = require("discord-player");

module.exports = {
	name: "skip",

	/**
	 * @param {import("discord.js").Message} message
	 * @param {string[]} args
	 * @param {object} ctx - Shared context
	 * @returns {Promise<import("discord.js").Message>}
	 */
	async execute(message, args, ctx) {
		const log = ctx.log;
		const queue = useQueue(message.guild.id);
		if (!queue) {
			if (log) log.debug("Skip requested but no queue (guild:", message.guild.id, ")");
			return message.reply("There is no music playing!");
		}

		if (!queue.isPlaying()) {
			if (log) log.debug("Skip requested but nothing playing (guild:", message.guild.id, ")");
			return message.reply("There is no track playing right now!");
		}

		const currentTitle = queue.currentTrack?.title ?? "current track";
		if (log) log.info("Skipping track (guild:", message.guild.id, "):", currentTitle);
		queue.node.skip();
		return message.reply(`⏭️ Skipped **${currentTitle}**`);
	},
};
