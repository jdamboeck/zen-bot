/**
 * Bot presence and voice channel status — activity text and voice channel status line.
 * Used by music and stop command to show "now playing" and clear when idle.
 *
 * @module zen-bot/core/services/activity
 */

const { ActivityType } = require("discord-api-types/v10");
const { createLogger } = require("../logger");
const url = require("../utils/url");

const log = createLogger("activity");

/** Max length for activity name/state (Discord limit). */
const MAX_ACTIVITY_LEN = 128;

/**
 * Truncate a string to a maximum length, appending "..." if needed.
 *
 * @param {string} str
 * @param {number} [max=MAX_ACTIVITY_LEN]
 * @returns {string}
 */
function truncate(str, max = MAX_ACTIVITY_LEN) {
	return str && str.length > max ? str.slice(0, max - 3) + "..." : str;
}

/**
 * Set the bot's rich presence (activity). Clears if activityOrName is null.
 *
 * @param {import("discord.js").Client} client
 * @param {string|{ name: string, state?: string, type?: number, url?: string }|null} activityOrName - Simple string, or { name, state?, type?, url? }
 */
function setBotActivity(client, activityOrName) {
	if (!client.user) return;
	if (!activityOrName) {
		log.debug("Activity cleared");
		client.user.setActivity(null);
		return;
	}
	if (typeof activityOrName === "string") {
		log.debug("Activity set:", truncate(activityOrName));
		client.user.setActivity(truncate(activityOrName));
		return;
	}
	// Full activity: { name, state?, type?, url? }
	const name = truncate(activityOrName.name);
	const state = activityOrName.state != null ? truncate(String(activityOrName.state)) : undefined;
	const opts = { type: activityOrName.type ?? ActivityType.Playing, state };
	if (activityOrName.url) opts.url = activityOrName.url;
	log.debug("Activity set:", name, state ? `(${state})` : "");
	client.user.setActivity(name, opts);
}

/**
 * Set the voice channel status line (text under the bot in the voice channel).
 * Uses Discord REST PUT /channels/:id/voice-status; bot must be in the channel.
 *
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").VoiceChannel|string} voiceChannel - Channel or channel ID
 * @param {string|null} status - Status text (empty string clears)
 */
async function setVoiceChannelStatus(client, voiceChannel, status) {
	const channelId = voiceChannel?.id ?? voiceChannel;
	if (!channelId || !client.rest) return;
	const text = status == null ? "" : String(status).slice(0, MAX_ACTIVITY_LEN);
	try {
		await client.rest.put(`/channels/${channelId}/voice-status`, { body: { status: text } });
		log.debug("Set voice status to:", text || "(empty)");
	} catch (e) {
		log.warn("Failed to set voice status:", e.message || e);
	}
}

/**
 * @param {string} u - URL or string to check
 * @returns {boolean}
 */
function isYouTubeUrl(u) {
	return url.isYouTubeUrl(u);
}

module.exports = {
	MAX_ACTIVITY_LEN,
	truncate,
	setBotActivity,
	setVoiceChannelStatus,
	isYouTubeUrl,
};
