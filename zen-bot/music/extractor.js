/**
 * yt-dlp extractor for discord-player — resolves YouTube URLs and search queries,
 * returns track metadata via --dump-json, and streams audio with optional PO token for YouTube.
 *
 * @module zen-bot/music/extractor
 */

const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { BaseExtractor } = require("discord-player");
const { createLogger } = require("../core/logger");
const url = require("../core/utils/url");
const { fetchPoToken, PoTokenCache } = require("./po-token");
const config = require("./config");

const log = createLogger("yt-dlp");

const projectRoot = path.join(__dirname, "..", "..");
const localBinary = path.join(projectRoot, "third_party", "yt-dlp", process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");
const projectPluginDir = path.join(projectRoot, "third_party", "yt-dlp", "yt-dlp-plugins");

/**
 * Resolve yt-dlp binary: prefer system PATH, then project-local binary.
 *
 * @returns {string} Binary name or path
 */
function getYtDlpPath() {
	try {
		const r = spawnSync("yt-dlp", ["--version"], { encoding: "utf8", stdio: "pipe" });
		if (r.status === 0) return "yt-dlp";
	} catch {
		// not in PATH
	}
	try {
		fs.accessSync(localBinary, fs.constants.X_OK);
		return localBinary;
	} catch {
		// not present or not executable
	}
	return "yt-dlp";
}

/**
 * yt-dlp args for JS runtime (required by some extractors).
 *
 * @returns {string[]}
 */
function getJsRuntimeArgs() {
	return ["--js-runtimes", `node:${process.execPath}`];
}

/**
 * yt-dlp args so the project plugin dir is searched (required when using system yt-dlp).
 *
 * @returns {string[]}
 */
function getPluginDirArgs() {
	return ["--plugin-dirs", projectPluginDir];
}

const YTDLP_PATH = getYtDlpPath();
log.info("Using yt-dlp at:", YTDLP_PATH);

// ---- Extractor ----

const poTokenCache = new PoTokenCache(config.poTokenTtlHours);

/**
 * discord-player extractor that uses yt-dlp for metadata and streaming.
 * Handles YouTube URLs and search queries (ytsearch); optional PO token for streaming.
 */
class YtDlpExtractor extends BaseExtractor {
	static identifier = "com.custom.yt-dlp";

	constructor() {
		super();
	}

	/**
	 * Accept YouTube URLs and non-URL search queries.
	 *
	 * @param {string} query - User input (URL or search text)
	 * @returns {Promise<boolean>}
	 */
	async validate(query) {
		const isYouTube = url.isYouTubeUrl(query);
		const isSearchQuery = !query.startsWith("http");
		const shouldHandle = isYouTube || isSearchQuery;
		log.debug(`Validate "${query}": ${shouldHandle ? "YES" : "NO"} (isYT: ${isYouTube}, isSearch: ${isSearchQuery})`);
		return shouldHandle;
	}

	/**
	 * Fetch track metadata via yt-dlp --dump-json (single track, no playlists).
	 *
	 * @param {string} query - URL or ytsearch1: query
	 * @param {object} context - discord-player context
	 * @returns {Promise<{ playlist: null, tracks: object[] }>}
	 */
	async handle(query, context) {
		log.info("Processing:", query);
		return new Promise((resolve) => {
			const isUrl = query.startsWith("http");
			const args = [
				...getPluginDirArgs(),
				...getJsRuntimeArgs(),
				"--dump-json",
				"--flat-playlist",
				"--no-playlist",
				"--default-search",
				"ytsearch",
				isUrl ? query : `ytsearch1:${query}`,
			];

			const child = spawn(YTDLP_PATH, args);

			let data = "";
			child.stdout.on("data", (chunk) => (data += chunk));
			child.stderr.on("data", (chunk) => log.error("stderr:", chunk.toString()));

			child.on("close", (code) => {
				if (code !== 0 || !data) {
					log.debug(`Process exited with code ${code}`);
					return resolve({ tracks: [] });
				}

				try {
					const info = JSON.parse(data);
					const track = {
						title: info.title,
						description: info.description,
						author: info.uploader,
						url: info.webpage_url || info.url,
						thumbnail: info.thumbnail,
						duration: info.duration * 1000,
						views: info.view_count,
						source: "youtube",
						raw: info,
					};

					resolve({ playlist: null, tracks: [track] });
				} catch (err) {
					log.error("Failed to parse JSON:", err);
					resolve({ tracks: [] });
				}
			});
		});
	}

	/**
	 * Stream audio from the track URL. Uses PO token when available for YouTube.
	 *
	 * @param {object} info - Track info (url, title, etc.)
	 * @returns {import("stream").Readable} Readable stream of audio data
	 */
	async stream(info) {
		log.info(`Streaming: ${info.title} (${info.url})`);

		// Try to get PO token from cache or fetch new one
		let poToken = poTokenCache.get("gvs");
		if (!poToken) {
			log.info("Fetching new PO token...");
			poToken = await fetchPoToken();
			if (poToken) {
				poTokenCache.set("gvs", poToken);
			}
		}

		const args = [
			...getPluginDirArgs(),
			...getJsRuntimeArgs(),
			"-o", "-", "-f", "bestaudio", "--no-playlist",
		];

		// Add PO token if available
		if (poToken) {
			args.push("--extractor-args", `youtube:po_token=web.gvs+${poToken}`);
			const tokenPreview = poToken.length > 8 ? `${poToken.slice(0, 4)}...${poToken.slice(-4)}` : "***";
			log.info(`Using PO token (${tokenPreview})`);
		} else {
			log.info("No PO token available, streaming without token");
		}

		args.push(info.url);

		const argsForLog = args.map((a) =>
			a.startsWith("youtube:po_token=web.gvs+") ? "youtube:po_token=web.gvs+***" : a
		);
		log.debug(`Stream spawn: ${YTDLP_PATH} ${argsForLog.join(" ")}`);

		const proc = spawn(YTDLP_PATH, args, { stdio: ["ignore", "pipe", "pipe"] });

		proc.stderr.on("data", (chunk) => {
			const line = chunk.toString().trim();
			if (line) log.debug("stream stderr:", line);
		});

		proc.on("error", (err) => {
			log.error("Stream process spawn error:", err.message);
		});

		proc.on("close", (code, signal) => {
			log.debug(`Stream process exited code=${code} signal=${signal || "none"}`);
		});

		let firstChunk = true;
		proc.stdout.on("data", (chunk) => {
			if (firstChunk) {
				firstChunk = false;
				log.debug(`Stream: first data received (${chunk.length} bytes)`);
			}
		});

		return proc.stdout;
	}
}

module.exports = { YtDlpExtractor, YTDLP_PATH, getJsRuntimeArgs };
