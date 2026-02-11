/**
 * URL utilities — YouTube URL detection, video ID extraction, and thumbnail URL.
 *
 * @module zen-bot/core/utils/url
 */

/**
 * Check if a string is a YouTube URL (youtube.com, www.youtube.com, youtu.be).
 *
 * @param {string} url - String to check (any string; non-URLs return false).
 * @returns {boolean}
 */
function isYouTubeUrl(url) {
	if (!url || typeof url !== "string") return false;
	try {
		const u = new URL(url);
		return u.hostname === "youtube.com" || u.hostname === "www.youtube.com" || u.hostname === "youtu.be";
	} catch {
		return false;
	}
}

/**
 * Extract video ID from a YouTube URL (youtube.com?v=ID or youtu.be/ID).
 *
 * @param {string} url - Full URL or any string.
 * @returns {string|null} Video ID or null if not YouTube or no ID.
 */
function getYouTubeVideoId(url) {
	if (!url || typeof url !== "string") return null;
	try {
		const u = new URL(url);
		if (u.hostname === "youtu.be") {
			const id = u.pathname.slice(1);
			return id && id.length > 0 ? id : null;
		}
		if (u.hostname === "youtube.com" || u.hostname === "www.youtube.com") {
			const id = u.searchParams.get("v");
			return id && id.length > 0 ? id : null;
		}
	} catch {
		// invalid URL
	}
	return null;
}

/**
 * Build YouTube maxresdefault thumbnail URL from a video URL or video ID.
 *
 * @param {string} videoUrlOrId - Full YouTube URL or raw video ID.
 * @returns {string|null} Thumbnail URL or null if no valid ID.
 */
function getYouTubeThumbnailUrl(videoUrlOrId) {
	const id = getYouTubeVideoId(videoUrlOrId) ?? (typeof videoUrlOrId === "string" && videoUrlOrId.trim() || null);
	if (!id) return null;
	return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

module.exports = {
	isYouTubeUrl,
	getYouTubeVideoId,
	getYouTubeThumbnailUrl,
};
