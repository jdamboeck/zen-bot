/**
 * Stop command — deletes the queue, leaves voice, and clears bot activity/voice status.
 *
 * @module zen-bot/music/commands/stop
 */

const { useQueue } = require("discord-player");

module.exports = {
	name: "stop",

	/**
	 * @param {import("discord.js").Message} message
	 * @param {string[]} args
	 * @param {object} ctx - Shared context (ctx.services.core.activity)
	 * @returns {Promise<import("discord.js").Message>}
	 */
	async execute(message, args, ctx) {
		const log = ctx.log;
		const queue = useQueue(message.guild.id);
		if (!queue) {
			if (log) log.debug("Stop requested but no queue (guild:", message.guild.id, ")");
			return message.reply("There is no music playing!");
		}

		if (log) log.info("Stopping player and clearing queue (guild:", message.guild.id, ")");
		const vc = queue.channel;
		queue.delete();

		// Clear activity
		ctx.services.core.activity.setBotActivity(ctx.client, null, ctx.log);
		if (vc) {
			ctx.services.core.activity.setVoiceChannelStatus(ctx.client, vc, "", ctx.log);
		}

		return message.reply("Stopped the player and cleared the queue!");
	},
};
