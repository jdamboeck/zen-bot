/**
 * Music-comments feature — track comments and reactions during playback.
 * Exposes ctx.services["music-comments"]; relies on ctx.db.music (from music-stats) for persistence.
 *
 * @module zen-bot/music-comments
 */

/**
 * @param {object} ctx - Shared context
 * @returns {Promise<void>}
 */
async function init(ctx) {
	const log = ctx.log;
	log.info("Initializing music-comments...");
	if (!ctx.db?.music) {
		throw new Error("music-comments expects ctx.db.music; ensure music-stats is in load order before music-comments.");
	}
	log.info("Music-comments initialized");
}

module.exports = { init, dependsOn: ["core", "database", "music-stats"] };
