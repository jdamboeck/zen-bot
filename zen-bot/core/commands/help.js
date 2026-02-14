/**
 * Help command — lists commands from enabled features only (and their aliases).
 *
 * @module zen-bot/core/commands/help
 */

module.exports = {
	name: "help",

	/**
	 * @param {import("discord.js").Message} message
	 * @param {string[]} args
	 * @param {object} ctx - Shared context (commands, config, enabledFeatures, log)
	 */
	async execute(message, args, ctx) {
		const log = ctx.log;
		if (log) log.debug(`Help command by ${message.author.username}`);

		const prefix = ctx.config?.prefix ?? "#";
		const commands = ctx.commands;
		const enabledSet = ctx.enabledFeatures != null && ctx.enabledFeatures.length > 0
			? new Set(ctx.enabledFeatures)
			: null;

		if (!commands || commands.size === 0) {
			return message.reply("No commands registered.");
		}

		// Unique commands by primary name; only from enabled features when ctx.enabledFeatures is set
		const byName = new Map();
		for (const cmd of commands.values()) {
			if (enabledSet != null && cmd.feature != null && !enabledSet.has(cmd.feature)) continue;
			if (!byName.has(cmd.name)) byName.set(cmd.name, cmd);
		}

		const list = Array.from(byName.values());
		if (list.length === 0) {
			return message.reply("No commands available from enabled features.");
		}

		const lines = list
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((cmd) => {
				const main = `${prefix}${cmd.name}`;
				const aliasList = Array.isArray(cmd.aliases) && cmd.aliases.length > 0
					? ` (${cmd.aliases.join(", ")})`
					: "";
				return `${main}${aliasList}`;
			});

		const text = `**Registered commands:**\n\`\`\`\n${lines.join("\n")}\n\`\`\``;
		return message.reply(text);
	},
};
