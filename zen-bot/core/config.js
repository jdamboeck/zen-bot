/**
 * Core configuration — bot token, command prefix, log services.
 * Loads env.json via dotenv-json (does not overwrite process.env), then reads from process.env.
 * Use get() for type coercion. Keys in env.json must match ENV names (e.g. BOT_TOKEN, PREFIX).
 *
 * @module zen-bot/core/config
 */

const path = require("path");

try {
	require("dotenv-json")({ path: path.join(__dirname, "../../env.json") });
} catch (e) {
	if (e.code !== "ENOENT" && !e.message?.includes("JSON")) throw e;
}

/**
 * Normalize value to array of trimmed non-empty strings (string or array accepted).
 * @param {unknown} v
 * @returns {string[]}
 */
function toServiceList(v) {
	if (v == null) return [];
	return Array.isArray(v)
		? v.map((s) => String(s).trim()).filter(Boolean)
		: String(v).split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Get config value from process.env with optional type coercion.
 * Use after dotenv-json has run; env vars take precedence over env.json.
 *
 * @param {string} envKey - Environment variable name (e.g. "BOT_TOKEN", "PREFIX").
 * @param {string|number|boolean|string[]|null} defaultVal - Default when missing or invalid.
 * @param {{ type?: 'string'|'int'|'bool'|'array'|'serviceList' }} [options]
 * @returns {string|number|boolean|string[]}
 */
function get(envKey, defaultVal, options = {}) {
	const raw = process.env[envKey];
	const type = options.type || "string";

	if (raw === undefined || raw === "") {
		if (type === "bool" && typeof defaultVal === "boolean") return defaultVal;
		return defaultVal;
	}

	switch (type) {
		case "int": {
			const n = parseInt(raw, 10);
			return Number.isNaN(n) ? defaultVal : n;
		}
		case "bool":
			if (typeof defaultVal === "boolean") {
				return defaultVal ? raw !== "false" && raw !== "0" : raw === "true" || raw === "1";
			}
			return raw === "true" || raw === "1";
		case "array": {
			if (raw.startsWith("[")) {
				try {
					const parsed = JSON.parse(raw);
					return Array.isArray(parsed) ? parsed.map((s) => String(s).trim()) : String(raw).split(",").map((s) => s.trim()).filter(Boolean);
				} catch {
					return String(raw).split(",").map((s) => s.trim()).filter(Boolean);
				}
			}
			return String(raw).split(",").map((s) => s.trim()).filter(Boolean);
		}
		case "serviceList":
			return toServiceList(raw);
		default:
			return raw;
	}
}

const botToken = get("BOT_TOKEN", undefined);
if (!botToken) {
	console.error("Missing BOT_TOKEN. Set BOT_TOKEN env var or add BOT_TOKEN to env.json (copy env.example.json).");
	process.exit(1);
}

/** Service names to exclude from log output. Env: LOG_EXCLUDE_SERVICES */
const logExcludeServices = get("LOG_EXCLUDE_SERVICES", [], { type: "serviceList" });

/** Service names to include (only these log when non-empty). Env: LOG_INCLUDE_SERVICES */
const logIncludeServices = get("LOG_INCLUDE_SERVICES", [], { type: "serviceList" });

/** @type {{ botToken: string, prefix: string, logExcludeServices: string[], logIncludeServices: string[], get: Function }} */
module.exports = {
	botToken,
	/** Command prefix (e.g. "."). Env: PREFIX */
	prefix: get("PREFIX", "#"),
	logExcludeServices,
	logIncludeServices,
	get,
};
