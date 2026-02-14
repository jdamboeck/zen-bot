/**
 * Music feature — discord-player setup, yt-dlp extractor, and music config.
 * Provides ctx.player and ctx.musicConfig; play/pause/resume/stop commands live in music/commands.
 *
 * @module zen-bot/music
 */

const { Player } = require("discord-player");
const { DefaultExtractors } = require("@discord-player/extractor");
const { createLogger } = require("../core/logger");
const { YtDlpExtractor } = require("./extractor");
const config = require("./config");

const log = createLogger("music");

/**
 * Create player, register YtDlpExtractor and default extractors, attach musicConfig to ctx.
 *
 * @param {object} ctx - Shared context (mutated: player, musicConfig)
 * @returns {Promise<void>}
 */
async function init(ctx) {
	log.info("Initializing music...");

	// Initialize the Player with audio quality settings
	ctx.player = new Player(ctx.client, {
		ytdlOptions: {
			quality: "highestaudio",
			highWaterMark: 1 << 25,
		},
	});

	// Register extractors
	log.info("Loading extractors...");
	await ctx.player.extractors.register(YtDlpExtractor, {});
	await ctx.player.extractors.loadMulti(DefaultExtractors);

	log.info(
		"Extractors loaded:",
		ctx.player.extractors.store.map((e) => e.identifier)
	);

	// Store config for commands
	ctx.musicConfig = config;

	if (process.env.LOG_LEVEL?.toLowerCase() === "debug") {
		const { startPotProviderLogTail } = require("./pot-provider-log-tail");
		startPotProviderLogTail();
	}

	log.info("Music initialized");
}

module.exports = { init };
