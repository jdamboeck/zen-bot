/**
 * Database feature — shared SQLite connection with namespaced access.
 * Provides ctx.db (register, connection, close). Must load after core, before
 * any feature that registers or uses ctx.db.
 *
 * @module zen-bot/database
 */

const { createDatabaseContext } = require("./database");

/**
 * Initialize the database feature: create and attach ctx.db.
 *
 * @param {object} ctx - Shared context (mutated: db)
 * @returns {Promise<void>}
 */
async function init(ctx) {
	const log = ctx.log;
	log.info("Initializing database...");
	ctx.db = createDatabaseContext(ctx);
	log.info("Database initialized (ctx.db available)");
}

module.exports = { init, dependsOn: ["core"] };
