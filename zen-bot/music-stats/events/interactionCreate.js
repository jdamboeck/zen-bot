/**
 * interactionCreate handler — handles musicstats play and stop buttons.
 * Play buttons resolve URL from playButtonStore and invoke the play command; stop invokes the stop command.
 *
 * @module zen-bot/music-stats/events/interactionCreate
 */

const playButtonStore = require("../playButtonStore");

const PREFIX_PLAY = "musicstats_play_";
const CUSTOM_ID_STOP = "musicstats_stop";

module.exports = {
	event: "interactionCreate",
	target: "client",

	/**
	 * @param {import("discord.js").Interaction} interaction
	 * @param {object} ctx - Shared context (commands, log)
	 * @returns {Promise<boolean>} True if this handler processed the interaction
	 */
	async handle(interaction, ctx) {
		const log = ctx.log;
		if (!interaction.isButton()) return false;

		// Handle stop button
		if (interaction.customId === CUSTOM_ID_STOP) {
			// Defer so we have time to run stop (Discord 3s limit)
			await interaction.deferReply().catch(() => {});

			// Adapter: message.reply() -> interaction.editReply() (we already deferred)
			const messageLike = {
				reply(contentOrOptions) {
					const content = typeof contentOrOptions === "string" ? contentOrOptions : (contentOrOptions?.content ?? "");
					return interaction.editReply(content);
				},
				author: interaction.user,
				guild: interaction.guild,
				member: interaction.member,
			};

			const stopCmd = ctx.commands.get("stop");
			if (!stopCmd) {
				await interaction.editReply("Stop command not available.").catch(() => {});
				return true;
			}

			try {
				await stopCmd.execute(messageLike, [], ctx);
			} catch (err) {
				if (log) log.error("Musicstats stop button failed:", err);
				await interaction.editReply(`Something went wrong: ${err.message}`).catch(() => {});
			}

			return true;
		}

		// Handle play buttons
		if (!interaction.customId.startsWith(PREFIX_PLAY)) return false;

		const indexStr = interaction.customId.slice(PREFIX_PLAY.length);
		const index = parseInt(indexStr, 10);
		if (Number.isNaN(index) || index < 0) return false;

		const videoUrl = playButtonStore.getUrl(interaction.message.id, index);
		if (!videoUrl) {
			await interaction.reply({ content: "This play button has expired.", ephemeral: true }).catch(() => {});
			return true;
		}

		// Defer so we have time to run play (Discord 3s limit)
		await interaction.deferReply().catch(() => {});

		// Adapter: message.reply() -> interaction.editReply() (we already deferred)
		const messageLike = {
			reply(contentOrOptions) {
				const content = typeof contentOrOptions === "string" ? contentOrOptions : (contentOrOptions?.content ?? "");
				return interaction.editReply(content);
			},
			author: interaction.user,
			guild: interaction.guild,
			member: interaction.member,
		};

		const playCmd = ctx.commands.get("play");
		if (!playCmd) {
			await interaction.editReply("Play command not available.").catch(() => {});
			return true;
		}

		try {
			await playCmd.execute(messageLike, [videoUrl], ctx);
		} catch (err) {
			if (log) log.error("Musicstats play button failed:", err);
			await interaction.editReply(`Something went wrong: ${err.message}`).catch(() => {});
		}

		return true;
	},
};
