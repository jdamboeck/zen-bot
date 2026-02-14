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

/** Normalize env or env.json value to array of trimmed non-empty service names (string or array accepted). */
function toServiceList(v) {
	if (v == null) return [];
	return Array.isArray(v)
		? v.map((s) => String(s).trim()).filter(Boolean)
		: String(v).split(",").map((s) => s.trim()).filter(Boolean);
}

/** Service names to exclude from log output. Override with LOG_EXCLUDE_SERVICES env. */
const logExcludeServices = toServiceList(process.env.LOG_EXCLUDE_SERVICES ?? envJson.logExcludeServices);

/** Service names to include (only these log when non-empty). Override with LOG_INCLUDE_SERVICES env. */
const logIncludeServices = toServiceList(process.env.LOG_INCLUDE_SERVICES ?? envJson.logIncludeServices);

/** @type {{ botToken: string, prefix: string, logExcludeServices: string[], logIncludeServices: string[] }} */
module.exports = {
	botToken,
	/** Command prefix (e.g. "#"). Override with PREFIX env. */
	prefix: process.env.PREFIX || "#",
	logExcludeServices,
	logIncludeServices,
};
