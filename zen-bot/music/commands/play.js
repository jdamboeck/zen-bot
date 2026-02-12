/**
 * Play command — enqueue a track from a YouTube URL or search query.
 * Requires user in voice channel; stores enqueued message in queue.metadata for track comments.
 *
 * @module zen-bot/music/commands/play
 */

const { useQueue } = require("discord-player");
const { createLogger } = require("../../core/logger");
const config = require("../config");

const log = createLogger("play");

/**
 * Ask the LLM for a short comment about the track and edit it into the enqueued message.
 *
 * @param {import("discord.js").Message} enqueuedMessage - The "enqueued!" reply to edit
 * @param {import("discord-player").Track} track
 * @param {object} ctx - Shared context (llm)
 */
async function addTrackComment(enqueuedMessage, track, ctx) {
	const comment = await ctx.llm.ask(
		`Track: "${track.title}"${track.author ? ` by ${track.author}` : ""}`,
		{ appendInstruction: config.llmTrackCommentInstruction },
	);

	const trimmed = comment.trim().slice(0, config.llmSingleCommentMaxChars);
	if (!trimmed) return;

	log.debug(`LLM track comment for "${track.title}": ${trimmed}`);

	await enqueuedMessage.edit(`**${track.title}** enqueued!\n*${trimmed}*`);
}

module.exports = {
	name: "play",
	aliases: ["p"],

	/**
	 * Play or enqueue: args joined as query (URL or search). Replies with enqueued message.
	 *
	 * @param {import("discord.js").Message} message
	 * @param {string[]} args - Query words (e.g. ["https://youtube.com/..."] or ["search", "terms"])
	 * @param {object} ctx - Shared context (player, musicConfig)
	 * @returns {Promise<import("discord.js").Message>}
	 */
	async execute(message, args, ctx) {
		const query = args.join(" ");
		log.info(`Attempting to play: ${query}`);

		if (!query) {
			log.debug("Play called without query");
			return message.reply("🛑 Link missing");
		}

		const channel = message.member.voice.channel;
		if (!channel) {
			log.debug("Play refused: user not in voice channel");
			return message.reply("You need to be in a voice channel!");
		}

		try {
			const { track } = await ctx.player.play(channel, query, {
				nodeOptions: {
					metadata: message,
					volume: ctx.musicConfig.volume,
					leaveOnEmpty: true,
					leaveOnEmptyCooldown: ctx.musicConfig.leaveOnEmptyCooldown,
					leaveOnEnd: true,
					leaveOnEndCooldown: ctx.musicConfig.leaveOnEndCooldown,
					selfDeaf: false, // Must be false for soundboard to work
				},
			});

			// Send the enqueued message
			const enqueuedMessage = await message.reply(`**${track.title}** enqueued!`);

			// Store enqueued message in queue metadata for track comments
			const queue = useQueue(message.guild.id);
			if (queue?.metadata) {
				queue.metadata.enqueuedMessage = enqueuedMessage;
			}

			log.info("Enqueued:", track.title, "| guild:", message.guild.id);

			// If LLM is available, add a comment about the track (non-blocking)
			if (ctx.llm) {
				addTrackComment(enqueuedMessage, track, ctx).catch((err) =>
					log.warn("LLM track comment failed:", err.message),
				);
			}

			return enqueuedMessage;
		} catch (e) {
			log.error("Play failed:", e);
			return message.reply(`Something went wrong: ${e.message}`);
		}
	},
};
