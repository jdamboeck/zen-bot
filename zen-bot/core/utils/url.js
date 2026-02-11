/**
 * URL utilities — YouTube detection, video ID extraction, thumbnail URL.
 */

/**
 * Check if a URL is a YouTube URL.
 * @param {string} url - Any string (URL or not).
 * @returns {boolean} True only if url parses as a URL whose hostname is youtube.com, www.youtube.com, or youtu.be.
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
 * Get video ID from a YouTube URL.
 * @param {string} url - YouTube (or any) URL.
 * @returns {string|null} Video ID or null if not YouTube, invalid URL, or missing/empty ID.
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
 * Get YouTube thumbnail URL (maxresdefault) from a video URL or raw video ID.
 * @param {string} videoUrlOrId - Full YouTube video URL or a raw video ID.
 * @returns {string|null} Thumbnail URL or null if no valid video ID.
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
