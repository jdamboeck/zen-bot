/**
 * Ask command — ask the bot a question and get an AI-powered answer via ctx.llm.
 *
 * @module zen-bot/llm/commands/ask
 */

const { createLogger } = require("../../core/logger");

const log = createLogger("ask");

/** Discord message cap is 2 000 chars. Leave room for formatting. */
const MAX_RESPONSE_LENGTH = 1900;

const SYSTEM_INSTRUCTION =
	"You are a helpful Discord bot assistant. Keep your answers concise and to the point " +
	"since Discord messages have a character limit. Use markdown formatting that works in " +
	"Discord (bold, italic, code blocks, etc.).";

module.exports = {
	name: "ask",
	aliases: ["ai", "gem"],

	/**
	 * @param {import("discord.js").Message} message
	 * @param {string[]} args
	 * @param {object} ctx - Shared context (llm, config)
	 */
	async execute(message, args, ctx) {
		const question = args.join(" ").trim();
		if (!question) {
			return message.reply("Please provide a question. Usage: `#ask <your question>`");
		}

		if (!ctx.llm) {
			log.warn("Ask command used but LLM feature is not available");
			return message.reply("The AI feature is not configured. The bot owner needs to set a Gemini API key.");
		}

		log.info(`Ask from ${message.author.username}: ${question.slice(0, 80)}${question.length > 80 ? "…" : ""}`);

		// Show typing indicator while waiting for the response
		await message.channel.sendTyping();

		try {
			let answer = await ctx.llm.ask(question, {
				systemInstruction: SYSTEM_INSTRUCTION,
			});

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
