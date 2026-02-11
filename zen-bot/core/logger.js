/**
 * Logger factory — prefixed console logging with level filtering.
 * No config files; level is controlled by LOG_LEVEL env (debug | info | warn | error; default: debug).
 *
 * @module zen-bot/core/logger
 */

/** @type {Record<string, number>} */
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LOG_LEVELS.debug;

/**
 * Create a named logger. Output is prefixed with [name].
 *
 * @param {string} name - Logger name (e.g. "core", "music")
 * @returns {{ debug: (...args: unknown[]) => void, info: (...args: unknown[]) => void, warn: (...args: unknown[]) => void, error: (...args: unknown[]) => void }}
 */
function createLogger(name) {
	const prefix = `[${name}]`;
	return {
		debug: (...args) => currentLevel <= LOG_LEVELS.debug && console.debug(prefix, ...args),
		info: (...args) => currentLevel <= LOG_LEVELS.info && console.log(prefix, ...args),
		warn: (...args) => currentLevel <= LOG_LEVELS.warn && console.warn(prefix, ...args),
		error: (...args) => currentLevel <= LOG_LEVELS.error && console.error(prefix, ...args),
	};
}

module.exports = { createLogger };
