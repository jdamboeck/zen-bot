/**
 * Moderation feature — provides channel moderation commands (e.g. clear).
 *
 * @module zen-bot/moderation
 */

/**
 * No-op init; commands are loaded by core from moderation/commands.
 *
 * @param {object} ctx - Shared context
 * @returns {Promise<void>}
 */
async function init(ctx) {
	const log = ctx.log;
	log.info("Initializing moderation...");
	log.info("Moderation initialized");
}

module.exports = { init, dependsOn: ["core"] };
