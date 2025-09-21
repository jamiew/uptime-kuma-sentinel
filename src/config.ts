/**
 * Configuration management with environment variable validation
 */

import type { SentinelConfig, EnvironmentVariables } from "./types.js";

/**
 * Validates and parses environment variables with strict type checking
 */
export function loadConfig(): SentinelConfig {
  const env = process.env as Partial<EnvironmentVariables>;

  const kumaUrl = env.KUMA_URL ?? "http://localhost:3001";
  const kumaUser = env.KUMA_USER ?? "admin";
  const kumaPass = env.KUMA_PASS ?? "changeme";
  const sentinelName = env.SENTINEL_NAME ?? "INTERNET-SENTINEL";
  const tagToSuppress = env.TAG_TO_SUPPRESS ?? "internet-dependent";
  const intervalMs = parseInt(env.INTERVAL_MS ?? "5000", 10);

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
  if (!tagToSuppress) {
    throw new Error("TAG_TO_SUPPRESS is required");
  }
  if (isNaN(intervalMs) || intervalMs <= 0) {
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
    tagToSuppress,
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
  console.log(`  TAG_TO_SUPPRESS: ${config.tagToSuppress}`);
  console.log(
    `  INTERVAL_MS: ${config.intervalMs} (currently unused - real-time via WebSocket)`
  );
}
