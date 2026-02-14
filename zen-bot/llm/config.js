/**
 * LLM feature configuration.
 * Uses core/config get() (env vars and env.json, keys = ENV names). See env.example.json and CONTRIBUTING.md.
 *
 * @module zen-bot/llm/config
 */

const { get } = require("../core/config");

/** In-code default bot character. Override with LLM_BOT_CHARACTER. */
const DEFAULT_BOT_CHARACTER =
	"You are a depressive, witty self deprecating Music Critic. You're knowledgeable, wise-ass, " +
	"and have a dark sense of humor. Keep responses concise and funny but never enthusiastic. Keep the emoji usage dark and sarcastic. " +
	"Use Discord-friendly markdown formatting (bold, italic, code blocks).";

const DEFAULT_ASK_INSTRUCTION =
	"Keep answers concise; Discord has a 2000 character limit. Use Discord-friendly markdown (bold, italic, code blocks).";

module.exports = {
	/** Gemini API key. Default null (LLM feature disabled). Env: LLM_GEMINI_API_KEY */
	geminiApiKey: get("LLM_GEMINI_API_KEY", null),

	/** Bot character template. Env: LLM_BOT_CHARACTER */
	botCharacter: get("LLM_BOT_CHARACTER", DEFAULT_BOT_CHARACTER),

	/** Model name. Env: LLM_MODEL */
	model: get("LLM_MODEL", "gemini-3-flash-preview"),

	/** Max length for #ask reply before truncation. Env: LLM_ASK_MAX_RESPONSE_LENGTH */
	askMaxResponseLength: get("LLM_ASK_MAX_RESPONSE_LENGTH", 1900, { type: "int" }),

	/** Task instruction appended for #ask (Discord-friendly). Env: LLM_ASK_APPEND_INSTRUCTION */
	askAppendInstruction: get("LLM_ASK_APPEND_INSTRUCTION", DEFAULT_ASK_INSTRUCTION),
};
