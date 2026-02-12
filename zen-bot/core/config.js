/**
 * Core configuration — bot token, command prefix, and API keys.
 * Loads from environment variables first, then falls back to env.json.
 *
 * @module zen-bot/core/config
 */

let envJson = {};
try {
	envJson = require("../../env.json");
} catch (e) {
	if (e.code !== "MODULE_NOT_FOUND" && !e.message?.includes("JSON")) throw e;
}

const botToken = process.env.BOT_TOKEN || envJson.botToken;
if (!botToken) {
	console.error("Missing botToken. Set BOT_TOKEN env var or add botToken to env.json (copy env.example.json).");
	process.exit(1);
}

/** @type {{ botToken: string, prefix: string }} */
module.exports = {
	botToken,
	/** Command prefix (e.g. "#"). Override with PREFIX env. */
	prefix: process.env.PREFIX || "#",
};
