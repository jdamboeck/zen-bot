/**
 * Music-comments feature — track comments and reactions during playback.
 * Exposes ctx.services.comments; relies on ctx.db.music (from music-stats) for persistence.
 * Replies to the enqueued message and reactions on it are recorded and replayed in sync with the track.
 *
 * @module zen-bot/music-comments
 */

const { createLogger } = require("../core/logger");
const services = require("./services");

const log = createLogger("music-comments");

/**
 * Attach comments service to ctx.services.comments.
 *
 * @param {object} ctx - Shared context (mutated: services.comments)
 * @returns {Promise<void>}
 */
async function init(ctx) {
	log.info("Initializing music-comments...");

	// Export services for other features
	ctx.services.comments = services;

	log.info("Music-comments initialized");
}

module.exports = { init };
