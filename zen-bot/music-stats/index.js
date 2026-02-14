/**
 * Music-stats feature — play history, track comments, and reactions.
 * ctx.db.music is registered by loader from database.js (convention).
 *
 * @module zen-bot/music-stats
 */

/**
 * @param {object} ctx - Shared context (ctx.db from database feature)
 */
async function init(ctx) {
	const log = ctx.log;
	log.info("Initializing music-stats...");
	if (!ctx.db) {
		throw new Error("music-stats expects ctx.db; ensure database is in load order before music-stats.");
	}
	log.info("Music-stats initialized (ctx.db.music available)");
}

module.exports = { init, dependsOn: ["core", "database"] };
