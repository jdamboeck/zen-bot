/**
 * Ask command — ask the bot a question and get an AI-powered answer via Gemini.
 *
 * @module zen-bot/core/commands/ask
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createLogger } = require("../logger");

const log = createLogger("ask");

/** Lazily initialised Gemini model (created on first use). */
let model = null;

/**
 * Initialise (or return cached) Gemini model.
 *
 * @param {string} apiKey
 * @returns {import("@google/generative-ai").GenerativeModel}
 */
function getModel(apiKey) {
	if (!model) {
		const genAI = new GoogleGenerativeAI(apiKey);
		model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
	}
	return model;
}

/** Discord message cap is 2 000 chars. Leave room for formatting. */
const MAX_RESPONSE_LENGTH = 1900;

module.exports = {
	name: "ask",
	aliases: ["ai", "gem"],

	/**
	 * @param {import("discord.js").Message} message
	 * @param {string[]} args
	 * @param {object} ctx - Shared context (config)
	 */
	async execute(message, args, ctx) {
		const question = args.join(" ").trim();
		if (!question) {
			return message.reply("Please provide a question. Usage: `#ask <your question>`");
		}

		const apiKey = ctx.config?.geminiApiKey;
		if (!apiKey) {
			log.warn("Ask command used but no Gemini API key configured");
			return message.reply("The AI feature is not configured. The bot owner needs to set a Gemini API key.");
		}

		log.info(`Ask from ${message.author.username}: ${question.slice(0, 80)}${question.length > 80 ? "…" : ""}`);

		// Show typing indicator while waiting for the response
		await message.channel.sendTyping();

		try {
			const gemini = getModel(apiKey);

			const result = await gemini.generateContent({
				contents: [
					{
						role: "user",
						parts: [{ text: question }],
					},
				],
				systemInstruction: {
					parts: [
						{
							text: "You are a helpful Discord bot assistant. Keep your answers concise and to the point since Discord messages have a character limit. Use markdown formatting that works in Discord (bold, italic, code blocks, etc.).",
						},
					],
				},
			});

			const response = result.response;
			let answer = response.text();

			// Log API stats
			const usage = response.usageMetadata;
			const candidate = response.candidates?.[0];
			log.debug(
				`Gemini stats — model: gemini-3-flash-preview` +
				` | finish: ${candidate?.finishReason ?? "unknown"}` +
				` | tokens: ${usage?.totalTokenCount ?? "?"} total` +
				` (prompt: ${usage?.promptTokenCount ?? "?"},` +
				` response: ${usage?.candidatesTokenCount ?? "?"})` +
				` | safety: ${(candidate?.safetyRatings ?? []).map((r) => `${r.category}=${r.probability}`).join(", ") || "none"}`,
			);
			log.info(`Gemini reply (${answer.length} chars): ${answer.slice(0, 200)}${answer.length > 200 ? "…" : ""}`);

			// Truncate if needed
			if (answer.length > MAX_RESPONSE_LENGTH) {
				answer = answer.slice(0, MAX_RESPONSE_LENGTH) + "\n\n*…response truncated*";
			}

			return message.reply(answer);
		} catch (err) {
			log.error("Gemini API error:", err.message);
			return message.reply("Something went wrong while asking the AI. Please try again later.");
		}
	},
};
