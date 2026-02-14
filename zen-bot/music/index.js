/**
 * Music feature — discord-player setup, yt-dlp extractor, and music config.
 * Provides ctx.player and ctx.musicConfig; play/pause/resume/stop commands live in music/commands.
 *
 * @module zen-bot/music
 */

const { Player } = require("discord-player");
const { DefaultExtractors } = require("@discord-player/extractor");
const { get } = require("../core/config");
const { YtDlpExtractor } = require("./extractor");

/**
 * Create player, register YtDlpExtractor and default extractors.
 * ctx.musicConfig is attached by loader from config.js.
 *
 * @param {object} ctx - Shared context (mutated: player)
 * @returns {Promise<void>}
 */
async function init(ctx) {
	const log = ctx.log;
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

	if (String(get("LOG_LEVEL", "debug")).toLowerCase() === "debug") {
		const { startPotProviderLogTail } = require("./pot-provider-log-tail");
		startPotProviderLogTail();
	}

	log.info("Music initialized");
}

module.exports = { init, dependsOn: ["core"] };
