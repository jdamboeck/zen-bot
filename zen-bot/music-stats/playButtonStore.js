/**
 * In-memory store mapping musicstats message IDs to ordered video URLs for play buttons.
 * Button customIds are indices into this list; entries expire after TTL to avoid stale clicks.
 *
 * @module zen-bot/music-stats/playButtonStore
 */

/** Time-to-live for stored URLs (15 minutes). */
const TTL_MS = 15 * 60 * 1000;

/** @type {Map<string, { urls: string[], createdAt: number }>} */
const store = new Map();

/**
 * Associate a musicstats reply message with the list of video URLs for its play buttons.
 *
 * @param {string} messageId - Discord message ID of the musicstats reply
 * @param {string[]} urls - Video URLs in display order (e.g. top overall then top by user)
 */
function set(messageId, urls) {
	store.set(messageId, { urls, createdAt: Date.now() });
}

/**
 * Resolve a button index to a video URL. Returns null if messageId unknown or expired.
 *
 * @param {string} messageId - Message ID of the musicstats reply
 * @param {number} index - Button index (0-based, matches customId suffix)
 * @returns {string|null}
 */
function getUrl(messageId, index) {
	const entry = store.get(messageId);
	if (!entry) return null;
	if (Date.now() - entry.createdAt > TTL_MS) {
		store.delete(messageId);
		return null;
	}
	const url = entry.urls[index];
	return url ?? null;
}

/** Remove all expired entries from the store. */
function prune() {
	const now = Date.now();
	for (const [id, entry] of store.entries()) {
		if (now - entry.createdAt > TTL_MS) store.delete(id);
	}
}

module.exports = { set, getUrl, prune };
