/**
 * Database feature — shared SQLite connection with namespaced access.
 * Provides ctx.db (register, connection, close). Must load after core, before
 * any feature that registers or uses ctx.db.
 *
 * @module zen-bot/database
 */

const { createLogger } = require("../core/logger");
const { createDatabaseContext } = require("./database");

const log = createLogger("database");

/**
 * Initialize the database feature: create and attach ctx.db.
 *
 * @param {object} ctx - Shared context (mutated: db)
 * @returns {Promise<void>}
 */
async function init(ctx) {
	log.info("Initializing database...");
	ctx.db = createDatabaseContext();
	log.info("Database initialized (ctx.db available)");
}

module.exports = { init };
