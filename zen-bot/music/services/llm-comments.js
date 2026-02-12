/**
 * LLM Comments Service — manages periodic AI-generated comments during track playback.
 *
 * Adds fun facts/comments about the currently playing track every 2 minutes.
 * Comments are appended to the enqueued message as they're generated.
 *
 * @module zen-bot/music/services/llm-comments
 */

const { createLogger } = require("../../core/logger");

const log = createLogger("llm-comments");

/** Interval between comments (2 minutes). */
const COMMENT_INTERVAL_MS = 2 * 60 * 1000;

/** Map of guildId -> interval ID for active comment intervals. */
const activeIntervals = new Map();

/** Discord message length limit. Use a safe cap to avoid failed edits. */
const MAX_MESSAGE_LENGTH = 1950;

/**
 * Track comment instruction — shared by play.js (first comment) and periodic comments.
 */
const TRACK_COMMENT_INSTRUCTION =
	"Write a single short, witty one-liner comment (max 150 chars) about either " +
	"the artist or the song — a fun fact, a hot take, a trivia tidbit, or a vibe check. " +
	"Make it different from previous comments. No quotes, no hashtags, no emojis. " +
	"Just the comment text, nothing else.";

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
				{ appendInstruction: TRACK_COMMENT_INSTRUCTION },
			);

			const trimmed = comment.trim().slice(0, 200);
			if (!trimmed) {
				log.debug("Empty comment from LLM, skipping");
				return;
			}

			log.debug(`Periodic comment for "${track.title}": ${trimmed}`);

			let newContent = `${currentContent}\n*${trimmed}*`;
			if (newContent.length > MAX_MESSAGE_LENGTH) {
				const lines = currentContent.split("\n");
				const firstLine = lines[0] || currentContent;
				const oldCommentLines = lines.slice(1);
				const allComments = [...oldCommentLines, `*${trimmed}*`];
				let result = firstLine;
				for (let i = allComments.length - 1; i >= 0; i--) {
					const candidate = firstLine + "\n" + allComments.slice(i).join("\n");
					if (candidate.length <= MAX_MESSAGE_LENGTH) {
						result = candidate;
						break;
					}
				}
				if (result === firstLine && allComments.length > 0) {
					result = firstLine + "\n" + allComments[allComments.length - 1];
				}
				newContent = result;
				log.debug("Truncated enqueued message to fit Discord limit");
			}
			await enqueuedMessage.edit(newContent);
		} catch (err) {
			log.warn("Failed to generate periodic comment:", err.message);
			// Don't stop the interval on error, just log and continue
		}
	}, COMMENT_INTERVAL_MS);

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
	COMMENT_INTERVAL_MS,
	TRACK_COMMENT_INSTRUCTION,
};
