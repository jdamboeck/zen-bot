/**
 * LLM Comments Service — manages periodic AI-generated comments during track playback.
 *
 * Adds fun facts/comments about the currently playing track every 2 minutes.
 * Comments are appended to the enqueued message as they're generated.
 *
 * @module zen-bot/music/services/llm-comments
 */

const { createLogger } = require("../../core/logger");
const config = require("../config");

const log = createLogger("llm-comments");

/** Map of guildId -> interval ID for active comment intervals. */
const activeIntervals = new Map();

/**
 * Start periodic comments for a track. Comments will be added every 2 minutes
 * until stopPeriodicComments() is called for this guild.
 *
 * @param {string} guildId - Guild ID
 * @param {import("discord.js").Message} enqueuedMessage - Message to append comments to
 * @param {import("discord-player").Track} track - Currently playing track
 * @param {object} ctx - Shared context (llm)
 */
function startPeriodicComments(guildId, enqueuedMessage, track, ctx) {
	if (!ctx.llm) {
		log.debug("LLM not available, skipping periodic comments");
		return;
	}

	// Stop any existing interval for this guild
	stopPeriodicComments(guildId);

	log.debug(`Starting periodic comments for "${track.title}" (guild: ${guildId})`);

	const intervalId = setInterval(async () => {
		try {
			// Check if message still exists and is editable
			if (!enqueuedMessage || enqueuedMessage.deleted) {
				log.debug("Enqueued message deleted, stopping periodic comments");
				stopPeriodicComments(guildId);
				return;
			}

			// Get current message content
			const currentContent = enqueuedMessage.content;

			// Generate a new comment
			const comment = await ctx.llm.ask(
				`Track: "${track.title}"${track.author ? ` by ${track.author}` : ""}`,
				{ appendInstruction: config.llmTrackCommentInstruction },
			);

			const trimmed = comment.trim().slice(0, config.llmSingleCommentMaxChars);
			if (!trimmed) {
				log.debug("Empty comment from LLM, skipping");
				return;
			}

			log.debug(`Periodic comment for "${track.title}": ${trimmed}`);

			const maxMsgLen = config.llmEnqueuedMessageMaxLength;
			let newContent = `${currentContent}\n*${trimmed}*`;
			if (newContent.length > maxMsgLen) {
				const lines = currentContent.split("\n");
				const firstLine = lines[0] || currentContent;
				const oldCommentLines = lines.slice(1);
				const allComments = [...oldCommentLines, `*${trimmed}*`];
				let result = firstLine;
				for (let i = allComments.length - 1; i >= 0; i--) {
					const candidate = firstLine + "\n" + allComments.slice(i).join("\n");
					if (candidate.length <= maxMsgLen) {
						result = candidate;
						break;
					}
				}
				if (result === firstLine && allComments.length > 0) {
					result = firstLine + "\n" + allComments[allComments.length - 1];
				}
				newContent = result;
				// Hard cap: first line or a single comment can exceed limit (e.g. very long title)
				if (newContent.length > maxMsgLen) {
					newContent = newContent.slice(0, maxMsgLen);
					log.debug("Truncated enqueued message (hard cap) to fit Discord limit");
				} else {
					log.debug("Truncated enqueued message to fit Discord limit");
				}
			}
			await enqueuedMessage.edit(newContent);
		} catch (err) {
			log.warn("Failed to generate periodic comment:", err.message);
			// Don't stop the interval on error, just log and continue
		}
	}, config.llmCommentIntervalMs);

	activeIntervals.set(guildId, intervalId);
	log.info(`Started periodic comments for guild ${guildId}`);
}

/**
 * Stop periodic comments for a guild.
 *
 * @param {string} guildId - Guild ID
 */
function stopPeriodicComments(guildId) {
	const intervalId = activeIntervals.get(guildId);
	if (intervalId) {
		clearInterval(intervalId);
		activeIntervals.delete(guildId);
		log.debug(`Stopped periodic comments for guild ${guildId}`);
	}
}

/**
 * Stop all periodic comments (cleanup on shutdown).
 */
function stopAllPeriodicComments() {
	for (const [guildId, intervalId] of activeIntervals) {
		clearInterval(intervalId);
		log.debug(`Stopped periodic comments for guild ${guildId}`);
	}
	activeIntervals.clear();
	log.info("Stopped all periodic comments");
}

module.exports = {
	startPeriodicComments,
	stopPeriodicComments,
	stopAllPeriodicComments,
};
