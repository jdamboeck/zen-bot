/**
 * LLM feature — shared Gemini AI client available as ctx.llm.
 * Must load after core (needs ctx.config). Other features can then use
 * ctx.llm.ask() or ctx.llm.generate() for AI-powered functionality.
 *
 * @module zen-bot/llm
 */

const { createLogger } = require("../core/logger");
const { createLlmContext } = require("./llm");

const log = createLogger("llm");

/**
 * Initialize the LLM feature: create and attach ctx.llm.
 *
 * @param {object} ctx - Shared context (mutated: llm)
 * @returns {Promise<void>}
 */
async function init(ctx) {
	const apiKey = ctx.config?.geminiApiKey;

	if (!apiKey) {
		log.warn("No Gemini API key configured — LLM feature disabled. Set GEMINI_API_KEY or add geminiApiKey to env.json.");
		ctx.llm = null;
		return;
	}

	log.info("Initializing LLM...");
	ctx.llm = createLlmContext(apiKey);
	log.info("LLM initialized (ctx.llm available)");
}

module.exports = { init };
