/**
 * Music feature configuration — volume, leave timeouts, PO token, LLM track comments.
 * Uses core/config get() (env vars and env.json, keys = ENV names). See env.example.json.
 *
 * @module zen-bot/music/config
 */

const { get } = require("../core/config");

const DEFAULT_LLM_TRACK_COMMENT_INSTRUCTION =
	"Write a single short, witty one-liner comment (max 150 chars) about either " +
	"the artist or the song — a fun fact, a hot take, a trivia tidbit, or a vibe check. " +
	"Make it different from previous comments. No quotes, no hashtags, no emojis. " +
	"Just the comment text, nothing else.";

/** @type {{ volume: number, leaveOnEmptyCooldown: number, leaveOnEndCooldown: number, poTokenUrl: string, poTokenTtlHours: number, poTokenRetries: number, poTokenRetryDelay: number, llmCommentIntervalMs: number, llmEnqueuedMessageMaxLength: number, llmSingleCommentMaxChars: number, llmTrackCommentInstruction: string }} */
module.exports = {
	/** Default volume 0–100. Env: MUSIC_VOLUME */
	volume: get("MUSIC_VOLUME", 50, { type: "int" }),
	/** Ms to wait in empty queue before leaving. Env: MUSIC_LEAVE_TIMEOUT */
	leaveOnEmptyCooldown: get("MUSIC_LEAVE_TIMEOUT", 60000, { type: "int" }),
	/** Ms to wait after last track before leaving. Env: MUSIC_LEAVE_TIMEOUT */
	leaveOnEndCooldown: get("MUSIC_LEAVE_TIMEOUT", 60000, { type: "int" }),
	/** PO token HTTP endpoint. Env: PO_TOKEN_URL */
	poTokenUrl: get("PO_TOKEN_URL", "http://127.0.0.1:4416"),
	/** PO token cache TTL in hours. Env: PO_TOKEN_TTL_HOURS */
	poTokenTtlHours: get("PO_TOKEN_TTL_HOURS", 6, { type: "int" }),
	/** Retry count for fetching PO token. Env: PO_TOKEN_RETRIES */
	poTokenRetries: get("PO_TOKEN_RETRIES", 3, { type: "int" }),
	/** Ms between PO token retries. Env: PO_TOKEN_RETRY_DELAY */
	poTokenRetryDelay: get("PO_TOKEN_RETRY_DELAY", 2000, { type: "int" }),

	/** Interval between LLM track comments (ms). Env: MUSIC_LLM_COMMENT_INTERVAL_MS */
	llmCommentIntervalMs: get("MUSIC_LLM_COMMENT_INTERVAL_MS", 200000, { type: "int" }),
	/** Max length for enqueued message when appending comments. Env: MUSIC_LLM_MESSAGE_MAX_LENGTH */
	llmEnqueuedMessageMaxLength: get("MUSIC_LLM_MESSAGE_MAX_LENGTH", 1950, { type: "int" }),
	/** Max chars for a single LLM track comment. Env: MUSIC_LLM_SINGLE_COMMENT_MAX_CHARS */
	llmSingleCommentMaxChars: get("MUSIC_LLM_SINGLE_COMMENT_MAX_CHARS", 200, { type: "int" }),
	/** LLM instruction for track comments. Env: MUSIC_LLM_TRACK_COMMENT_INSTRUCTION */
	llmTrackCommentInstruction: get("MUSIC_LLM_TRACK_COMMENT_INSTRUCTION", DEFAULT_LLM_TRACK_COMMENT_INSTRUCTION),
};
