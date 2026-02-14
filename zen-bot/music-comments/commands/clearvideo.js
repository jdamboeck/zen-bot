/**
 * Clearvideo command — clears comments and reactions for the current track only.
 * Must be used as a reply to the enqueued message of the currently playing track. Requires Administrator.
 *
 * @module zen-bot/music-comments/commands/clearvideo
 */

module.exports = {
	name: "clearvideo",
	permissions: ["Administrator"],

	/**
	 * @param {import("discord.js").Message} message - Must be a reply to the current track's enqueued message
	 * @param {string[]} args
	 * @param {object} ctx - Shared context (ctx.services["music-comments"], ctx.db.music, log)
	 * @returns {Promise<import("discord.js").Message>}
	 */
	async execute(message, args, ctx) {
		const log = ctx.log;
		if (!message.member.permissions.has("Administrator")) {
			if (log) log.debug("Clearvideo refused: user lacks Administrator (guild:", message.guild.id, ")");
			return message.reply("🛑 You need the 'Administrator' permission to use this command.");
		}

		if (!message.reference?.messageId) {
			if (log) log.debug("Clearvideo refused: not a reply (guild:", message.guild.id, ")");
			return message.reply("🛑 Reply to an enqueued message with `#clearvideo` to clear comments for that video.");
		}

		const guildId = message.guild.id;
		const session = ctx.services["music-comments"].getActiveSession(guildId);

		if (!session || message.reference.messageId !== session.messageId) {
			if (log) log.debug("Clearvideo refused: reply not to current track enqueued message (guild:", guildId, ")");
			return message.reply("🛑 Reply to the currently playing track's enqueued message to clear its comments.");
		}

		if (log) log.info("Clearing comments and reactions for video (guild:", guildId, "url:", session.trackUrl?.slice(0, 50), "...)");
		try {
			const commentsDeleted = ctx.db.music.clearVideoComments(session.trackUrl, guildId);
			const reactionsDeleted = ctx.db.music.clearVideoReactions(session.trackUrl, guildId);
			if (log) log.info("Cleared", commentsDeleted, "comments and", reactionsDeleted, "reactions for video (guild:", guildId, ")");
			const parts = [];
			if (commentsDeleted) parts.push(`${commentsDeleted} comment${commentsDeleted !== 1 ? "s" : ""}`);
			if (reactionsDeleted) parts.push(`${reactionsDeleted} reaction${reactionsDeleted !== 1 ? "s" : ""}`);
			const msg = parts.length ? `✅ Cleared ${parts.join(" and ")} for this video.` : "✅ No comments or reactions to clear for this video.";
			return message.reply(msg);
		} catch (e) {
			if (log) log.error("Failed to clear video comments/reactions:", e);
			return message.reply(`Failed to clear: ${e.message}`);
		}
	},
};
