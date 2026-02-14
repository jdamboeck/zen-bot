/**
 * Greet Command - Greets the user.
 *
 * Demonstrates:
 * - Basic command structure with name and aliases
 * - Accessing services from ctx
 * - Replying to messages
 * - Using the logger
 *
 * COMMAND DISCOVERY:
 * Commands are auto-discovered from bot/[feature]/commands/*.js
 * No manual registration needed - just export the command module.
 *
 * @module zen-bot/example/commands/greet
 */

module.exports = {
	// ─────────────────────────────────────────────────────────────────────────
	// COMMAND METADATA
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Primary command name.
	 * This is required and must be unique across all features.
	 * @type {string}
	 */
	name: "greet",

	/**
	 * Alternative names for this command.
	 * Optional - omit if no aliases needed.
	 * Each alias must also be unique across all features.
	 * @type {string[]}
	 */
	aliases: ["hi", "hello"],

	// ─────────────────────────────────────────────────────────────────────────
	// COMMAND HANDLER
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Execute the command.
	 *
	 * @param {import('discord.js').Message} message - The message that triggered the command
	 * @param {string[]} args - Command arguments (prefix and command name stripped)
	 * @param {object} ctx - Shared context object
	 * @returns {Promise<import('discord.js').Message>} - The reply message
	 *
	 * @example
	 * // User types: #greet
	 * // args = []
	 *
	 * @example
	 * // User types: #greet @someone
	 * // args = ["@someone"]
	 */
	async execute(message, args, ctx) {
		const log = ctx.log;
		if (log) log.debug(`Greet command executed by ${message.author.username}`);
		if (log) log.debug(`Arguments: ${args.length > 0 ? args.join(", ") : "(none)"}`);

		const { example } = ctx.services;

		if (!example) {
			if (log) log.error("Example services not available - feature may not be loaded");
			return message.reply("Something went wrong. Please try again later.");
		}

		// ───────────────────────────────────────────────────────────────────────
		// EXECUTE BUSINESS LOGIC
		// ───────────────────────────────────────────────────────────────────────
		// Delegate to services - keep commands thin
		// Pass guildId for database persistence

		const result = example.greet(
			message.author.id,
			message.author.username,
			message.guild?.id
		);

		// ───────────────────────────────────────────────────────────────────────
		// RESPOND TO USER
		// ───────────────────────────────────────────────────────────────────────
		// Use message.reply() to respond

		if (!result.success) {
			if (log) log.debug(`Greet failed: ${result.message}`);
			return message.reply(result.message);
		}

		if (log) log.info(`Greeted ${message.author.username}: "${result.message}"`);
		return message.reply(result.message);
	},
};
