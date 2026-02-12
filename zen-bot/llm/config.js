/**
 * LLM feature configuration.
 * Env-only (no env.json). See CONTRIBUTING.md and README for env var docs.
 *
 * @module zen-bot/llm/config
 */

/** In-code default bot character (typos fixed). Override with LLM_BOT_CHARACTER. */
const DEFAULT_BOT_CHARACTER =
	"You are a depressive, witty self deprecating Music Critic. You're knowledgeable, wise-ass, " +
	"and have a dark sense of humor. Keep responses concise and funny but never enthusiastic. Keep the emoji usage dark and sarcastic. " +
	"Use Discord-friendly markdown formatting (bold, italic, code blocks).";

module.exports = {
	/** Gemini API key. Default null (LLM feature disabled). Env: LLM_GEMINI_API_KEY */
	geminiApiKey: process.env.LLM_GEMINI_API_KEY || null,

	/** Bot character template. Env: LLM_BOT_CHARACTER */
	botCharacter: process.env.LLM_BOT_CHARACTER || DEFAULT_BOT_CHARACTER,

	/** Model name. Env: LLM_MODEL */
	model: process.env.LLM_MODEL || "gemini-3-flash-preview",

	/** Max length for #ask reply before truncation. Env: LLM_ASK_MAX_RESPONSE_LENGTH */
	askMaxResponseLength: parseInt(process.env.LLM_ASK_MAX_RESPONSE_LENGTH, 10) || 1900,

	/** Task instruction appended for #ask (Discord-friendly). Env: LLM_ASK_APPEND_INSTRUCTION */
	askAppendInstruction:
		process.env.LLM_ASK_APPEND_INSTRUCTION ||
		"Keep answers concise; Discord has a 2000 character limit. Use Discord-friendly markdown (bold, italic, code blocks).",
};
