/**
 * Configuration management with environment variable validation
 */

import type { EnvironmentVariables, SentinelConfig } from "./types.js";

/**
 * Validates and parses environment variables with strict type checking
 */
export function loadConfig(): SentinelConfig {
	const env = process.env as Partial<EnvironmentVariables>;

	const kumaUrl = env.KUMA_URL ?? "http://localhost:3001";
	const kumaUser = env.KUMA_USER ?? "admin";
	const kumaPass = env.KUMA_PASS ?? "changeme";
	const sentinelName = env.SENTINEL_NAME ?? "INTERNET-SENTINEL";
	const groupToPause = env.GROUP_TO_PAUSE ?? "Sentinel";
	const intervalMs = Number.parseInt(env.INTERVAL_MS ?? "5000", 10);

	// Validate required configuration
	if (!kumaUrl) {
		throw new Error("KUMA_URL is required");
	}
	if (!kumaUser) {
		throw new Error("KUMA_USER is required");
	}
	if (!kumaPass) {
		throw new Error("KUMA_PASS is required");
	}
	if (!sentinelName) {
		throw new Error("SENTINEL_NAME is required");
	}
	if (!groupToPause) {
		throw new Error("GROUP_TO_PAUSE is required");
	}
	if (Number.isNaN(intervalMs) || intervalMs <= 0) {
		throw new Error("INTERVAL_MS must be a positive number");
	}

	// Validate URL format
	try {
		new URL(kumaUrl);
	} catch {
		throw new Error(`Invalid KUMA_URL format: ${kumaUrl}`);
	}

	return {
		kumaUrl,
		kumaUser,
		kumaPass,
		sentinelName,
		groupToPause,
		intervalMs,
	} as const;
}

/**
 * Display configuration (without sensitive data)
 */
export function displayConfig(config: SentinelConfig): void {
	console.log("[sentinel] Configuration:");
	console.log(`  KUMA_URL: ${config.kumaUrl}`);
	console.log(`  KUMA_USER: ${config.kumaUser}`);
	console.log(`  KUMA_PASS: ${"*".repeat(config.kumaPass.length)}`);
	console.log(`  SENTINEL_NAME: ${config.sentinelName}`);
	console.log(`  GROUP_TO_PAUSE: ${config.groupToPause}`);
	console.log(
		`  INTERVAL_MS: ${config.intervalMs} (currently unused - real-time via WebSocket)`,
	);
}
