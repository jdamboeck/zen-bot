/**
 * PlayerStart Event Handler - Runs when a track starts playing.
 *
 * Demonstrates:
 * - discord-player event handling (target: "player")
 * - Accessing queue and track information
 * - Inter-feature communication via ctx.services
 *
 * PLAYER EVENTS:
 * discord-player emits events through player.events, not directly on the player.
 * The feature loader handles this automatically when target is "player".
 *
 * Common player events:
 * - playerStart: Track started playing
 * - playerFinish: Track finished
 * - playerError: Playback error
 * - error: Queue error
 * - emptyQueue: Queue finished
 * - emptyChannel: Voice channel empty
 *
 * @module zen-bot/example/events/playerStart
 */

module.exports = {
	event: "playerStart",
	target: "player",

	/**
	 * @param {import('discord-player').GuildQueue} queue
	 * @param {import('discord-player').Track} track
	 * @param {object} ctx - Shared context (log, exampleConfig)
	 */
	async handle(queue, track, ctx) {
		const log = ctx.log;
		const config = ctx.exampleConfig;

		if (!config?.featureEnabled) return;

		if (log) log.debug(`Track started: "${track.title}"`);

		const metadata = queue.metadata;
		if (metadata?.channel && log) log.debug(`Playing in channel: ${metadata.channel.name}`);

		if (ctx.db && log) {
			log.debug(`Track URL: ${track.url}`);
			log.debug(`Requested by: ${track.requestedBy?.username || "Unknown"}`);
		}

		if (config?.verbose && log) {
			log.info(`Now playing: "${track.title}" by ${track.author}`);
			log.info(`Duration: ${track.duration}`);
			log.info(`Source: ${track.source}`);
		}
	},
};
