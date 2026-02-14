/**
 * playerStart handler — sets bot activity and voice channel status, plays soundboard slot 1.
 * Play recording and track comments are handled by music-stats and music-comments.
 *
 * @module zen-bot/music/events/playerStart
 */

const { ActivityType } = require("discord-api-types/v10");

module.exports = {
	event: "playerStart",
	target: "player",

	/**
	 * @param {import("discord-player").GuildQueue} queue
	 * @param {import("discord-player").Track} track
	 * @param {object} ctx - Shared context (ctx.services.core.activity, ctx.services.core.soundboard, log)
	 */
	async handle(queue, track, ctx) {
		const log = ctx.log;
		const channel = queue.channel;
		const guild = channel?.guild;
		if (log) log.info("Track started:", track?.title, "| channel:", channel?.id, "| guild:", guild?.id);
		if (log) log.debug("playerStart: setting initial activity and soundboard");

		const { activity, soundboard } = ctx.services.core;

		activity.setVoiceChannelStatus(ctx.client, channel, "🎵 Finding the best audio quality", ctx.log);
		activity.setBotActivity(ctx.client, { name: "🎵 Finding the best audio quality", type: ActivityType.Listening }, ctx.log);
		if (log) log.debug("Set activity and channel status to music icon 🎵");

		soundboard.tryPlaySoundboardSlot1(guild, channel, ctx.log).catch((err) => log && log.warn("Soundboard failed:", err));

		const listeners = channel?.members?.filter((m) => !m.user.bot).size ?? 0;
		const channelName = channel?.name ?? "voice";
		const state = `to ${listeners} listener${listeners !== 1 ? "s" : ""} in #${channelName}`;
		const isYoutube = activity.isYouTubeUrl(track.url);
		const trackTitle = "💥 Blasting " + activity.truncate(track.title, 160);
		const trackActivity = {
			name: trackTitle,
			state,
			type: isYoutube ? ActivityType.Streaming : ActivityType.Listening,
			...(isYoutube && track.url && { url: track.url }),
		};

		setTimeout(() => {
			activity.setVoiceChannelStatus(ctx.client, channel, trackTitle, ctx.log);
			activity.setBotActivity(ctx.client, trackActivity, ctx.log);
			if (log) log.debug("Set channel status and activity to track:", trackTitle);
		}, soundboard.SOUNDBOARD_ICON_DURATION_MS);
	},
};
