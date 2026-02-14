/**
 * Ask command — ask the bot a question and get an AI-powered answer via ctx.llm.
 *
 * @module zen-bot/llm/commands/ask
 */

module.exports = {
	name: "ask",
	aliases: ["ai", "gem"],

	/**
	 * @param {import("discord.js").Message} message
	 * @param {string[]} args
	 * @param {object} ctx - Shared context (llm, llmConfig, log)
	 */
	async execute(message, args, ctx) {
		const log = ctx.log;
		const cfg = ctx.llmConfig || {};
		const question = args.join(" ").trim();
		if (!question) {
			return message.reply("Please provide a question. Usage: `#ask <your question>`");
		}

		if (!ctx.llm) {
			if (log) log.warn("Ask command used but LLM feature is not available");
			return message.reply("The AI feature is not configured. Set LLM_GEMINI_API_KEY.");
		}

		if (log) log.info(`Ask from ${message.author.username}: ${question.slice(0, 80)}${question.length > 80 ? "…" : ""}`);

		await message.channel.sendTyping();

		try {
			let answer = await ctx.llm.ask(question, {
				appendInstruction: cfg.askAppendInstruction,
			});

			const maxLen = cfg.askMaxResponseLength;
			if (log) log.info(`Gemini reply (${answer.length} chars): ${answer.slice(0, 200)}${answer.length > 200 ? "…" : ""}`);

			// Truncate if needed
			if (answer.length > maxLen) {
				answer = answer.slice(0, maxLen) + "\n\n*…response truncated*";
			}

			return message.reply(answer);
		} catch (err) {
			if (log) log.error("Gemini API error:", err.message);
			return message.reply("Something went wrong while asking the AI. Please try again later.");
		}
	},
};
