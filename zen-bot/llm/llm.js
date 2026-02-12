/**
 * LLM Module — shared Gemini client with reusable API.
 *
 * Provides a context object (ctx.llm) that any feature can use to interact
 * with the Gemini LLM. Follows the same namespace pattern as the database module.
 *
 * PATTERN:
 * - LLM feature initializes the Gemini connection
 * - Other features call ctx.llm.ask(prompt) for simple Q&A
 * - Or ctx.llm.generate(contents, opts) for full control
 *
 * @module zen-bot/llm/llm
 *
 * @example
 * // Simple question from any feature:
 * const answer = await ctx.llm.ask("What is the capital of France?");
 *
 * // With a system instruction:
 * const answer = await ctx.llm.ask("Summarise this", {
 *     systemInstruction: "You are a summarisation assistant.",
 * });
 *
 * // Full control:
 * const result = await ctx.llm.generate({
 *     contents: [{ role: "user", parts: [{ text: "Hello" }] }],
 *     systemInstruction: { parts: [{ text: "Be brief." }] },
 * });
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createLogger } = require("../core/logger");
const config = require("./config");

const log = createLogger("llm");

/**
 * Create the LLM context object that gets attached to ctx.llm.
 * Model and bot character: options override, else config (single source in config.js).
 *
 * @param {string} apiKey - Gemini API key
 * @param {object} [options]
 * @param {string} [options.model] - Model name override
 * @param {string} [options.botCharacter] - Bot character template override
 * @returns {object} LLM context object
 */
function createLlmContext(apiKey, options = {}) {
	const modelName = options.model ?? config.model;
	const botCharacter = options.botCharacter ?? config.botCharacter;
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: modelName });

	log.info(`Gemini model ready: ${modelName}`);

	const llmContext = {
		/** The model name in use. */
		modelName,

		/** The bot character template being used. */
		botCharacter,

		/** The raw GenerativeModel instance for advanced use. */
		model,

		/**
		 * Generate content with full control over the request.
		 * Returns the raw Gemini response and logs stats.
		 *
		 * @param {object} request - generateContent request body (contents, systemInstruction, etc.)
		 * @returns {Promise<import("@google/generative-ai").GenerateContentResult>}
		 */
		async generate(request) {
			const result = await model.generateContent(request);
			logStats(result, modelName);
			return result;
		},

		/**
		 * Simple question → answer helper. Wraps generate() with sensible defaults.
		 * Automatically applies the bot character template unless overridden.
		 *
		 * @param {string} prompt - The user prompt / question
		 * @param {object} [opts]
		 * @param {string} [opts.systemInstruction] - Full system instruction (replaces character if provided)
		 * @param {string} [opts.appendInstruction] - Task instruction appended after bot character (ignored if systemInstruction provided)
		 * @param {boolean} [opts.useCharacter=true] - Whether to use bot character (ignored if systemInstruction provided)
		 * @returns {Promise<string>} The text response
		 */
		async ask(prompt, opts = {}) {
			const request = {
				contents: [
					{ role: "user", parts: [{ text: prompt }] },
				],
			};

			let systemInstruction = opts.systemInstruction;
			if (!systemInstruction && opts.useCharacter !== false) {
				systemInstruction = opts.appendInstruction
					? `${botCharacter}\n\n${opts.appendInstruction}`
					: botCharacter;
			}

			if (systemInstruction) {
				request.systemInstruction = {
					parts: [{ text: systemInstruction }],
				};
			}

			const result = await llmContext.generate(request);
			return result.response.text();
		},
	};

	return llmContext;
}

/**
 * Log token usage and safety stats from a Gemini response.
 *
 * @param {import("@google/generative-ai").GenerateContentResult} result
 * @param {string} modelName
 */
function logStats(result, modelName) {
	const response = result.response;
	const usage = response.usageMetadata;
	const candidate = response.candidates?.[0];

	log.debug(
		`Gemini stats — model: ${modelName}` +
		` | finish: ${candidate?.finishReason ?? "unknown"}` +
		` | tokens: ${usage?.totalTokenCount ?? "?"} total` +
		` (prompt: ${usage?.promptTokenCount ?? "?"},` +
		` response: ${usage?.candidatesTokenCount ?? "?"})` +
		` | safety: ${(candidate?.safetyRatings ?? []).map((r) => `${r.category}=${r.probability}`).join(", ") || "none"}`,
	);
}

module.exports = { createLlmContext };
