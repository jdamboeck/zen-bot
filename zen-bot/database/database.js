/**
 * Database Module - Shared SQLite connection with namespaced access.
 *
 * This module provides a single database connection that multiple features
 * can use by registering their own namespaces. Each feature adds its tables
 * and query functions to ctx.db.[namespace].
 *
 * PATTERN:
 * - Database feature initializes the database connection
 * - Features call ctx.db.register(namespace, initFn) to add their tables
 * - Query functions are accessed via ctx.db.[namespace].[method]
 *
 * @module zen-bot/database/database
 */

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { get } = require("../core/config");
const { createLogger } = require("../core/logger");

const log = createLogger("database");

/**
 * Database path - configurable via DB_PATH (env or env.json). Default: data/zen-bot.db (data/ is created if missing).
 * @type {string}
 */
const dbPath = get("DB_PATH", "data/zen-bot.db");

/**
 * The shared database connection.
 * @type {Database.Database|null}
 */
let db = null;

/**
 * Get or create the database connection.
 * @returns {Database.Database}
 */
function getConnection() {
	if (!db) {
		const dir = path.dirname(dbPath);
		if (dir !== ".") {
			fs.mkdirSync(dir, { recursive: true });
		}
		db = new Database(dbPath);
		log.info(`Initialized SQLite database at ${dbPath}`);
	}
	return db;
}

/**
 * Create the database context object.
 *
 * This object is assigned to ctx.db and provides:
 * - register(namespace, initFn) - Register a feature's database namespace
 * - connection - Raw database connection (for advanced use)
 * - close() - Close the database connection
 *
 * Features register their namespaces, which become accessible as ctx.db.[namespace].
 *
 * @param {object} [ctx] - Shared context (passed to feature init fns for ctx.log)
 * @returns {object} Database context object
 *
 * @example
 * // Feature database.js: init(db, ctx) -> use ctx.log
 * ctx.db.register("music", (db, ctx) => ({ ... }));
 */
function createDatabaseContext(ctx) {
	const connection = getConnection();

	const dbContext = {
		/**
		 * Register a feature's database namespace.
		 *
		 * The init function receives (connection, ctx) and should return an object of query functions.
		 *
		 * @param {string} namespace - Unique namespace for the feature
		 * @param {function(Database.Database, object): object} initFn - Initialization function
		 */
		register(namespace, initFn) {
			if (this[namespace]) {
				log.warn(`Database namespace '${namespace}' already registered, overwriting`);
			}

			log.debug(`Registering database namespace: ${namespace}`);
			const namespaceApi = initFn(connection, ctx);
			this[namespace] = namespaceApi;
			log.info(`Registered database namespace: ${namespace}`);
		},

		/**
		 * Raw database connection for advanced use.
		 * Prefer using namespaced methods when possible.
		 * @type {Database.Database}
		 */
		get connection() {
			return connection;
		},

		/**
		 * Close the database connection.
		 * Called during graceful shutdown.
		 */
		close() {
			if (db) {
				db.close();
				db = null;
				log.info("Closed database connection");
			}
		},
	};

	return dbContext;
}

module.exports = {
	createDatabaseContext,
	getConnection,
};
