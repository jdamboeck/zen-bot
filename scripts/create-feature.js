#!/usr/bin/env node
/**
 * Scaffold a new zen-bot feature directory.
 * Creates zen-bot/<name>/ with optional commands/, events/, config.js, and index.js.
 * Feature is discovered and enabled by default; disable via DISABLED_FEATURES in env.
 *
 * Usage: node scripts/create-feature.js <feature-name>
 */

const fs = require("fs");
const path = require("path");

const name = process.argv[2];
if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
	console.error("Usage: node scripts/create-feature.js <feature-name>");
	console.error("  feature-name: lowercase, letters, numbers, hyphens (e.g. my-feature)");
	process.exit(1);
}

const root = path.join(__dirname, "..");
const zenBotDir = path.join(root, "zen-bot");
const featureDir = path.join(zenBotDir, name);

if (fs.existsSync(featureDir)) {
	console.error(`Feature directory already exists: zen-bot/${name}`);
	process.exit(1);
}

fs.mkdirSync(featureDir, { recursive: true });
fs.mkdirSync(path.join(featureDir, "commands"), { recursive: true });
fs.mkdirSync(path.join(featureDir, "events"), { recursive: true });

const indexContent = `/**
 * ${name} feature.
 *
 * @module zen-bot/${name}
 */

module.exports = {
	dependsOn: ["core"],

	/**
	 * @param {object} ctx - Shared context
	 */
	async init(ctx) {
		const log = ctx.log;
		if (log) log.info("Initializing ${name}...");
		if (log) log.info("${name} initialized");
	},
};
`;

const configContent = `/**
 * ${name} feature configuration.
 * Uses core config get() for env/env.json. Keys: ${name.toUpperCase().replace(/-/g, "_")}_*
 *
 * @module zen-bot/${name}/config
 */

const { get } = require("../core/config");

module.exports = {
	enabled: get("${name.toUpperCase().replace(/-/g, "_")}_ENABLED", true, { type: "bool" }),
};
`;

fs.writeFileSync(path.join(featureDir, "index.js"), indexContent);
fs.writeFileSync(path.join(featureDir, "config.js"), configContent);

console.log(`Created zen-bot/${name}/ with index.js, config.js, commands/, events/.`);
console.log("Feature is enabled by default. To disable: set DISABLED_FEATURES in env.json (e.g. \"" + name + "\").");
