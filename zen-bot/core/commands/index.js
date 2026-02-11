/**
 * Command loader — discovers commands from all feature directories.
 * Each file in zen-bot/[feature]/commands/*.js exporting { name, execute } is registered;
 * aliases are supported via command.aliases.
 *
 * @module zen-bot/core/commands
 */

const fs = require("fs");
const path = require("path");
const { createLogger } = require("../logger");

const log = createLogger("commands");

/**
 * Load all commands from zen-bot feature directories.
 * Skips index.js and files missing name or execute.
 *
 * @returns {Map<string, { name: string, execute: Function, aliases?: string[], permissions?: string[] }>}
 */
function loadCommands() {
	const commands = new Map();
	const zenBotDir = path.join(__dirname, "..", "..");

	// Get all feature directories
	const features = fs.readdirSync(zenBotDir, { withFileTypes: true })
		.filter((d) => d.isDirectory() && d.name !== "node_modules")
		.map((d) => d.name);

	for (const feature of features) {
		const commandsDir = path.join(zenBotDir, feature, "commands");

		if (!fs.existsSync(commandsDir)) continue;

		const files = fs.readdirSync(commandsDir)
			.filter((f) => f.endsWith(".js") && f !== "index.js");

		for (const file of files) {
			try {
				const command = require(path.join(commandsDir, file));

				if (!command.name || typeof command.execute !== "function") {
					log.warn(`Skipping ${feature}/commands/${file}: missing name or execute`);
					continue;
				}

				commands.set(command.name, command);

				// Register aliases
				if (Array.isArray(command.aliases)) {
					for (const alias of command.aliases) {
						commands.set(alias, command);
					}
				}

				log.debug(`Loaded command: ${command.name} from ${feature}`);
			} catch (err) {
				log.error(`Failed to load ${feature}/commands/${file}:`, err.message);
			}
		}
	}

	log.info(`Loaded ${commands.size} commands`);
	return commands;
}

module.exports = { loadCommands };
