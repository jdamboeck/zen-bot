/**
 * Music feature configuration — volume, leave timeouts, PO token, LLM track comments.
 *
 * @module zen-bot/music/config
 */

const DEFAULT_LLM_TRACK_COMMENT_INSTRUCTION =
	"Write a single short, witty one-liner comment (max 150 chars) about either " +
	"the artist or the song — a fun fact, a hot take, a trivia tidbit, or a vibe check. " +
	"Make it different from previous comments. No quotes, no hashtags, no emojis. " +
	"Just the comment text, nothing else.";

/** @type {{ volume: number, leaveOnEmptyCooldown: number, leaveOnEndCooldown: number, poTokenUrl: string, poTokenTtlHours: number, poTokenRetries: number, poTokenRetryDelay: number, llmCommentIntervalMs: number, llmEnqueuedMessageMaxLength: number, llmSingleCommentMaxChars: number, llmTrackCommentInstruction: string }} */
module.exports = {
	/** Default volume 0–100. Env: MUSIC_VOLUME */
	volume: parseInt(process.env.MUSIC_VOLUME) || 50,
	/** Ms to wait in empty queue before leaving. Env: MUSIC_LEAVE_TIMEOUT */
	leaveOnEmptyCooldown: parseInt(process.env.MUSIC_LEAVE_TIMEOUT) || 60000,
	/** Ms to wait after last track before leaving. Env: MUSIC_LEAVE_TIMEOUT */
	leaveOnEndCooldown: parseInt(process.env.MUSIC_LEAVE_TIMEOUT) || 60000,
	/** PO token HTTP endpoint. Env: PO_TOKEN_URL */
	poTokenUrl: process.env.PO_TOKEN_URL || "http://127.0.0.1:4416",
	/** PO token cache TTL in hours. Env: PO_TOKEN_TTL_HOURS */
	poTokenTtlHours: parseInt(process.env.PO_TOKEN_TTL_HOURS) || 6,
	/** Retry count for fetching PO token. Env: PO_TOKEN_RETRIES */
	poTokenRetries: parseInt(process.env.PO_TOKEN_RETRIES) || 3,
	/** Ms between PO token retries. Env: PO_TOKEN_RETRY_DELAY */
	poTokenRetryDelay: parseInt(process.env.PO_TOKEN_RETRY_DELAY) || 2000,

	/** Interval between LLM track comments (ms). Env: MUSIC_LLM_COMMENT_INTERVAL_MS */
	llmCommentIntervalMs: parseInt(process.env.MUSIC_LLM_COMMENT_INTERVAL_MS, 10) || 120000,
	/** Max length for enqueued message when appending comments. Env: MUSIC_LLM_MESSAGE_MAX_LENGTH */
	llmEnqueuedMessageMaxLength: parseInt(process.env.MUSIC_LLM_MESSAGE_MAX_LENGTH, 10) || 1950,
	/** Max chars for a single LLM track comment. Env: MUSIC_LLM_SINGLE_COMMENT_MAX_CHARS */
	llmSingleCommentMaxChars: parseInt(process.env.MUSIC_LLM_SINGLE_COMMENT_MAX_CHARS, 10) || 200,
	/** LLM instruction for track comments. Env: MUSIC_LLM_TRACK_COMMENT_INSTRUCTION */
	llmTrackCommentInstruction:
		process.env.MUSIC_LLM_TRACK_COMMENT_INSTRUCTION || DEFAULT_LLM_TRACK_COMMENT_INSTRUCTION,
};
