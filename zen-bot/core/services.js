/**
 * Core feature services — activity and soundboard.
 * Loader attaches these as ctx.services.core (api).
 *
 * @module zen-bot/core/services
 */

const activity = require("./services/activity");
const soundboard = require("./services/soundboard");

const api = { activity, soundboard };

module.exports = { api };
