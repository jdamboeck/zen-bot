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
 * Load commands from zen-bot feature directories.
 * If enabledFeatures is provided, only those features are scanned; otherwise all feature dirs are scanned.
 * Skips index.js and files missing name or execute. Each command is tagged with .feature.
 *
 * @param {string[]} [enabledFeatures] - Feature names to load commands from (e.g. from ctx.enabledFeatures)
 * @returns {Map<string, { name: string, execute: Function, aliases?: string[], feature: string }>}
 */
function loadCommands(enabledFeatures) {
	const commands = new Map();
	const zenBotDir = path.join(__dirname, "..", "..");

	const features = enabledFeatures != null && enabledFeatures.length > 0
		? enabledFeatures
		: fs.readdirSync(zenBotDir, { withFileTypes: true })
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

				command.feature = feature;
				// Register by primary name (lowercase so messageCreate lookup matches)
				const nameKey = String(command.name).toLowerCase();
				if (!nameKey) continue;
				commands.set(nameKey, command);

				// Register aliases (shortcuts) with same normalization
				if (Array.isArray(command.aliases)) {
					for (const alias of command.aliases) {
						const aliasKey = String(alias).toLowerCase();
						if (aliasKey) commands.set(aliasKey, command);
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
