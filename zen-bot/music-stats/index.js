/**
 * Music-stats feature — registers ctx.db.music with play history, track comments, and reactions.
 * Other features (music-comments, music-stats commands) use ctx.db.music to read/write.
 *
 * @module zen-bot/music-stats
 */

const { createLogger } = require("../core/logger");
const { initMusicDatabase } = require("./database");

const log = createLogger("music-stats");

/**
 * Register the "music" database namespace so ctx.db.music is available.
 *
 * @param {object} ctx - Shared context (ctx.db.register)
 * @returns {Promise<void>}
 */
async function init(ctx) {
	log.info("Initializing music-stats...");

	// Register the 'music' database namespace
	// This makes all music database functions available at ctx.db.music
	ctx.db.register("music", initMusicDatabase);

	log.info("Music-stats initialized (ctx.db.music available)");
}

module.exports = { init };
