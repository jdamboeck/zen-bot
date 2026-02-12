/**
 * LLM feature — shared Gemini AI client available as ctx.llm.
 * Must load after core. Other features can then use ctx.llm.ask() or ctx.llm.generate().
 *
 * @module zen-bot/llm
 */

const { createLogger } = require("../core/logger");
const { createLlmContext } = require("./llm");
const config = require("./config");

const log = createLogger("llm");

/**
 * Initialize the LLM feature: create and attach ctx.llm.
 *
 * @param {object} ctx - Shared context (mutated: llm)
 * @returns {Promise<void>}
 */
async function init(ctx) {
	if (!config.geminiApiKey) {
		log.warn("No Gemini API key configured — LLM feature disabled. Set LLM_GEMINI_API_KEY.");
		ctx.llm = null;
		return;
	}

	log.info("Initializing LLM...");
	ctx.llm = createLlmContext(config.geminiApiKey, {
		model: config.model,
		botCharacter: config.botCharacter,
	});
	log.info("LLM initialized (ctx.llm available)");
}

module.exports = { init };
