/**
 * Example Feature Configuration
 *
 * Uses core/config get() (env vars and env.json, keys = ENV names). See env.example.json.
 *
 * PATTERN:
 * - Define sensible defaults
 * - Use get(envKey, default, { type }) for env + env.json with coercion
 *
 * NAMING: Env and env.json keys are SCREAMING_SNAKE_CASE (e.g. EXAMPLE_GREETING).
 *
 * @module zen-bot/example/config
 */

const { get } = require("../core/config");

const DEFAULT_SPECIAL_GREETINGS = ["Howdy", "Hey there", "Greetings"];

module.exports = {
	/**
	 * Greeting message used by the greet command.
	 * @type {string}
	 * @env EXAMPLE_GREETING
	 * @default "Hello"
	 */
	greeting: get("EXAMPLE_GREETING", "Hello"),

	/**
	 * Maximum greetings before the bot gets tired.
	 * @type {number}
	 * @env EXAMPLE_MAX_GREETINGS
	 * @default 100
	 */
	maxGreetings: get("EXAMPLE_MAX_GREETINGS", 100, { type: "int" }),

	/**
	 * Cooldown between greetings in milliseconds.
	 * @type {number}
	 * @env EXAMPLE_COOLDOWN_MS
	 * @default 5000
	 */
	cooldownMs: get("EXAMPLE_COOLDOWN_MS", 5000, { type: "int" }),

	/**
	 * Whether the feature is enabled. Set to "false" to disable.
	 * @type {boolean}
	 * @env EXAMPLE_ENABLED
	 * @default true
	 */
	featureEnabled: get("EXAMPLE_ENABLED", true, { type: "bool" }),

	/**
	 * Whether to log verbose debug information. Must be explicitly set to "true" to enable.
	 * @type {boolean}
	 * @env EXAMPLE_VERBOSE
	 * @default false
	 */
	verbose: get("EXAMPLE_VERBOSE", false, { type: "bool" }),

	/**
	 * List of special greetings to use randomly. Comma-separated in env or env.json.
	 * @type {string[]}
	 * @env EXAMPLE_SPECIAL_GREETINGS
	 * @default ["Howdy", "Hey there", "Greetings"]
	 */
	specialGreetings: get("EXAMPLE_SPECIAL_GREETINGS", DEFAULT_SPECIAL_GREETINGS, { type: "array" }),

	/**
	 * Cooldown in human-readable format. Computed from cooldownMs.
	 * @type {string}
	 */
	get cooldownFormatted() {
		const ms = this.cooldownMs;
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(1)}s`;
	},
};
