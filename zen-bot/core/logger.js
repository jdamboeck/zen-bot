/**
 * Logger factory — prefixed console logging with level filtering.
 * No config files; level is controlled by LOG_LEVEL env (debug | info | warn | error; default: debug).
 *
 * Environment variables:
 * - LOG_LEVEL: "debug" | "info" | "warn" | "error" (default: debug)
 * - LOG_TIMESTAMP: "1" or "true" to show ms-since-start in prefix for all levels (default: only in debug)
 * - NO_COLOR: set (any value) to disable ANSI colors for service name and timestamp
 *
 * Output format: [name] · <ms> · message (colors: green for [name], blue for ms; middle dot · as delimiter).
 * Timestamp is zero-padded ms since process start; shown in debug by default or when LOG_TIMESTAMP=1.
 *
 * @module zen-bot/core/logger
 */

/** @type {Record<string, number>} */
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LOG_LEVELS.debug;
const logTimestamp = process.env.LOG_TIMESTAMP === "1" || process.env.LOG_TIMESTAMP === "true";
const noColor = process.env.NO_COLOR != null && process.env.NO_COLOR !== "";

const C = noColor
	? { green: "", blue: "", reset: "" }
	: { green: "\x1b[32m", blue: "\x1b[34m", reset: "\x1b[0m" };

/** Time when the process started (logger module load). */
const startMs = Date.now();

/** Fixed width for ms-since-start (zero-padded). 10 digits = ~115 days. */
const MS_WIDTH = 10;

/** Delimiter between service name and timestamp (or before message). */
const DELIM = " \u00b7 "; // middle dot

/**
 * Milliseconds since program start, zero-padded to fixed character count.
 * @returns {string}
 */
function msSinceStart() {
	const ms = Date.now() - startMs;
	return String(ms).padStart(MS_WIDTH, "0");
}

/**
 * Build log prefix: green [name], optional delimiter + blue ms-since-start. Shown by default in debug mode, or when LOG_TIMESTAMP=1.
 * @param {string} name - Logger name
 * @returns {string}
 */
function buildPrefix(name) {
	const servicePart = `${C.green}[${name}]${C.reset}`;
	const showTs = logTimestamp || currentLevel <= LOG_LEVELS.debug;
	if (!showTs) return servicePart + DELIM;
	return `${servicePart}${DELIM}${C.blue}${msSinceStart()}${C.reset}${DELIM}`;
}

/**
 * Create a named logger. Output is prefixed with [name] (green), optional timestamp (blue), and delimiters; in debug mode a timestamp is shown after the service name.
 *
 * @param {string} name - Logger name (e.g. "core", "music")
 * @returns {{ debug: (...args: unknown[]) => void, info: (...args: unknown[]) => void, warn: (...args: unknown[]) => void, error: (...args: unknown[]) => void }}
 */
function createLogger(name) {
	return {
		debug: (...args) => {
			if (currentLevel > LOG_LEVELS.debug) return;
			console.debug(buildPrefix(name), ...args);
		},
		info: (...args) => {
			if (currentLevel > LOG_LEVELS.info) return;
			console.log(buildPrefix(name), ...args);
		},
		warn: (...args) => {
			if (currentLevel > LOG_LEVELS.warn) return;
			console.warn(buildPrefix(name), ...args);
		},
		error: (...args) => {
			if (currentLevel > LOG_LEVELS.error) return;
			console.error(buildPrefix(name), ...args);
		},
	};
}

module.exports = { createLogger };
