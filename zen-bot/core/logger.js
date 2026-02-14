/**
 * Logger factory — prefixed console logging with level filtering.
 * Level from LOG_LEVEL env; service exclude/include from core config (overridable by LOG_EXCLUDE_SERVICES / LOG_INCLUDE_SERVICES).
 *
 * Environment variables:
 * - LOG_LEVEL: "debug" | "info" | "warn" | "error" (default: debug)
 * - LOG_TIMESTAMP: "1" or "true" to show ms-since-start in prefix for all levels (default: only in debug)
 * - NO_COLOR: set (any value) to disable ANSI colors for service name and timestamp
 * - LOG_EXCLUDE_SERVICES: comma-separated service names to exclude (overrides config.logExcludeServices)
 * - LOG_INCLUDE_SERVICES: comma-separated service names to include; when set, only these log (overrides config.logIncludeServices)
 *
 * Output format: [name..... [ <ms> [ message (green for [name....], blue for ms; " [ " as separator).
 * Service name is padded with dots or truncated to a fixed width of 12 chars so all lines align from the first log.
 * Timestamp is sub-ms since process start (e.g. 0000000156.145); shown in debug by default or when LOG_TIMESTAMP=1.
 *
 * @module zen-bot/core/logger
 */

/** @type {Record<string, number>} */
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LOG_LEVELS.debug;

/** [level name, min level value, console method]. Used to generate debug/info/warn/error. */
const LEVEL_METHODS = [
	["debug", LOG_LEVELS.debug, "debug"],
	["info", LOG_LEVELS.info, "log"],
	["warn", LOG_LEVELS.warn, "warn"],
	["error", LOG_LEVELS.error, "error"],
];
const logTimestamp = process.env.LOG_TIMESTAMP === "1" || process.env.LOG_TIMESTAMP === "true";
const noColor = process.env.NO_COLOR != null && process.env.NO_COLOR !== "";

const C = noColor
	? { green: "", blue: "", reset: "" }
	: { green: "\x1b[32m", blue: "\x1b[34m", reset: "\x1b[0m" };

const config = require("./config");
/** Service names to exclude from log output (from config, overridable by LOG_EXCLUDE_SERVICES). */
const excludedServices = new Set(config.logExcludeServices || []);
/** When non-empty, only these service names log (from config, overridable by LOG_INCLUDE_SERVICES). */
const includedServices = new Set(config.logIncludeServices || []);

/** High-resolution time at logger module load (for sub-ms timestamps). */
const startPerf = performance.now();

/** Fixed width for integer part of ms (zero-padded). 10 digits = ~115 days. */
const MS_INT_WIDTH = 10;
/** Decimal places for sub-millisecond resolution. */
const MS_DECIMALS = 3;

/** Separator between service and timestamp: space, open bracket, space. */
const SEP = " [ ";
/** Separator between timestamp and message: space, open bracket (no trailing space). */
const SEP_BEFORE_MSG = " [";

/** Fixed character width for service name (padding/truncation). Always 12 so all lines align from the first log. */
const SERVICE_NAME_WIDTH = 10;

/**
 * Format service name to fixed width: name, space, then dots to fill (or truncate). Total length = SERVICE_NAME_WIDTH (12).
 * @param {string} name - Logger name
 * @returns {string}
 */
function toFixedWidthName(name) {
	const w = SERVICE_NAME_WIDTH;
	if (name.length >= w) return name.slice(0, w);
	return name + " " + ".".repeat(w - name.length - 1);
}

/**
 * Milliseconds since program start with sub-ms resolution (e.g. "0000000160.042").
 * @returns {string}
 */
function msSinceStart() {
	const ms = performance.now() - startPerf;
	const intPart = Math.floor(ms);
	const fracPart = (ms % 1).toFixed(MS_DECIMALS).slice(1); // leading "." + decimals
	return String(intPart).padStart(MS_INT_WIDTH, "0") + fracPart;
}

/**
 * Build log prefix: green [name.....], optional " [ " + blue ms-since-start. Shown by default in debug mode, or when LOG_TIMESTAMP=1.
 * @param {string} name - Logger name
 * @returns {string}
 */
function buildPrefix(name) {
	const servicePart = `${C.green}[${toFixedWidthName(name)}${C.reset}`;
	const showTs = logTimestamp || currentLevel <= LOG_LEVELS.debug;
	const mid = showTs ? `${SEP}${C.blue}${msSinceStart()}${C.reset}${SEP_BEFORE_MSG}` : SEP;
	return servicePart + mid;
}

/**
 * Create a named logger. Output is prefixed with [name] (green), optional timestamp (blue), and delimiters; in debug mode a timestamp is shown after the service name.
 *
 * @param {string} name - Logger name (e.g. "core", "music")
 * @returns {{ debug: (...args: unknown[]) => void, info: (...args: unknown[]) => void, warn: (...args: unknown[]) => void, error: (...args: unknown[]) => void }}
 */
function createLogger(name) {
	const prefix = () => buildPrefix(name);
	const log = {};
	for (const [level, minLevel, consoleMethod] of LEVEL_METHODS) {
		log[level] = (...args) => {
			if (excludedServices.has(name)) return;
			if (includedServices.size > 0 && !includedServices.has(name)) return;
			if (currentLevel > minLevel) return;
			console[consoleMethod](prefix(), ...args);
		};
	}
	return log;
}

module.exports = { createLogger };
