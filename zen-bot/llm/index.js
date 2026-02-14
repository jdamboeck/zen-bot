/**
 * LLM feature — shared Gemini AI client available as ctx.llm.
 * Must load after core. Other features can then use ctx.llm.ask() or ctx.llm.generate().
 *
 * @module zen-bot/llm
 */

const { createLlmContext } = require("./llm");

/**
 * Initialize the LLM feature: create and attach ctx.llm.
 * Config is attached by loader as ctx.llmConfig.
 *
 * @param {object} ctx - Shared context (mutated: llm)
 * @returns {Promise<void>}
 */
async function init(ctx) {
	const log = ctx.log;
	const config = ctx.llmConfig;
	if (!config?.geminiApiKey) {
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

module.exports = { init, dependsOn: ["core"] };
