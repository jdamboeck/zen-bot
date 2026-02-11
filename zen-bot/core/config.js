/**
 * Core configuration — bot token and command prefix.
 * Loads from environment variables first, then falls back to env.json.
 *
 * @module zen-bot/core/config
 */

let botToken = process.env.BOT_TOKEN;
if (!botToken) {
	try {
		botToken = require("../../env.json").botToken;
	} catch (e) {
		if (e.code === "MODULE_NOT_FOUND" || e.message?.includes("JSON")) {
			console.error("Missing or invalid env.json. Copy env.example.json to env.json and set your botToken (or set BOT_TOKEN env var).");
			process.exit(1);
		}
		throw e;
	}
}
if (!botToken) {
	console.error("env.json must contain botToken (or set BOT_TOKEN env var).");
	process.exit(1);
}

/** @type {{ botToken: string, prefix: string }} */
module.exports = {
	botToken,
	/** Command prefix (e.g. "#"). Override with PREFIX env. */
	prefix: process.env.PREFIX || "#",
};
