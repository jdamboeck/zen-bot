/**
 * Tails third_party/logs/pot-provider.log and injects each new line into the music logger
 * with a [pot-provider] prefix. Only started when LOG_LEVEL=debug.
 *
 * @module zen-bot/music/pot-provider-log-tail
 */

const fs = require("fs");
const path = require("path");
const { createLogger } = require("../core/logger");

const log = createLogger("music");

const LOG_PATH = path.join(__dirname, "..", "..", "third_party", "logs", "pot-provider.log");

/**
 * Start tailing the POT provider log file and pass each new line to log.debug("[pot-provider]", line).
 * If the file does not exist, does nothing (no retry). Call only when LOG_LEVEL=debug.
 */
function startPotProviderLogTail() {
	try {
		fs.accessSync(LOG_PATH, fs.constants.R_OK);
	} catch {
		return;
	}

	let position = 0;
	try {
		const stat = fs.statSync(LOG_PATH);
		position = stat.size;
	} catch {
		return;
	}

	let reading = false;
	fs.watch(LOG_PATH, (event, filename) => {
		if (event !== "change" || reading) return;
		try {
			const stat = fs.statSync(LOG_PATH);
			if (stat.size < position) position = 0;
			if (stat.size <= position) return;
			reading = true;
			const stream = fs.createReadStream(LOG_PATH, { start: position, end: stat.size - 1 });
			let buffer = "";
			stream.on("data", (chunk) => {
				buffer += chunk.toString();
			});
			stream.on("end", () => {
				position = stat.size;
				reading = false;
				const lines = buffer.split(/\r?\n/);
				for (const line of lines) {
					const trimmed = line.trim();
					if (trimmed) log.debug("[pot-provider]", trimmed);
				}
			});
			stream.on("error", () => {
				reading = false;
			});
		} catch (err) {
			// non-fatal: file may have been rotated or removed
		}
	});
}

module.exports = { startPotProviderLogTail };
