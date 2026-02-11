/**
 * Music feature configuration — volume, leave timeouts, PO token provider.
 *
 * @module zen-bot/music/config
 */

/** @type {{ volume: number, leaveOnEmptyCooldown: number, leaveOnEndCooldown: number, poTokenUrl: string, poTokenTtlHours: number, poTokenRetries: number, poTokenRetryDelay: number }} */
module.exports = {
	/** Default volume 0–100. Env: MUSIC_VOLUME */
	volume: parseInt(process.env.MUSIC_VOLUME) || 50,
	/** Ms to wait in empty queue before leaving. Env: MUSIC_LEAVE_TIMEOUT */
	leaveOnEmptyCooldown: parseInt(process.env.MUSIC_LEAVE_TIMEOUT) || 60000,
	/** Ms to wait after last track before leaving. Env: MUSIC_LEAVE_TIMEOUT */
	leaveOnEndCooldown: parseInt(process.env.MUSIC_LEAVE_TIMEOUT) || 60000,
	/** PO token HTTP endpoint. Env: PO_TOKEN_URL */
	poTokenUrl: process.env.PO_TOKEN_URL || "http://127.0.0.1:4416",
	/** PO token cache TTL in hours. Env: PO_TOKEN_TTL_HOURS */
	poTokenTtlHours: parseInt(process.env.PO_TOKEN_TTL_HOURS) || 6,
	/** Retry count for fetching PO token. Env: PO_TOKEN_RETRIES */
	poTokenRetries: parseInt(process.env.PO_TOKEN_RETRIES) || 3,
	/** Ms between PO token retries. Env: PO_TOKEN_RETRY_DELAY */
	poTokenRetryDelay: parseInt(process.env.PO_TOKEN_RETRY_DELAY) || 2000,
};
