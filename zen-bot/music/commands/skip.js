/**
 * Skip command — skips the currently playing track and advances to the next in the queue.
 *
 * @module zen-bot/music/commands/skip
 */

const { useQueue } = require("discord-player");
const { createLogger } = require("../../core/logger");

const log = createLogger("skip");

module.exports = {
	name: "skip",

	/**
	 * @param {import("discord.js").Message} message
	 * @param {string[]} args
	 * @param {object} ctx - Shared context
	 * @returns {Promise<import("discord.js").Message>}
	 */
	async execute(message, args, ctx) {
		const queue = useQueue(message.guild.id);
		if (!queue) {
			log.debug("Skip requested but no queue (guild:", message.guild.id, ")");
			return message.reply("There is no music playing!");
		}

		if (!queue.isPlaying()) {
			log.debug("Skip requested but nothing playing (guild:", message.guild.id, ")");
			return message.reply("There is no track playing right now!");
		}

		const currentTitle = queue.currentTrack?.title ?? "current track";
		log.info("Skipping track (guild:", message.guild.id, "):", currentTitle);
		queue.node.skip();
		return message.reply(`⏭️ Skipped **${currentTitle}**`);
	},
};
