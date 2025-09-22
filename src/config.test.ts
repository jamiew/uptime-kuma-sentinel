import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { displayConfig, loadConfig } from "./config.js";

describe("Config", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("loadConfig", () => {
		it("should load default configuration", () => {
			const config = loadConfig();
			expect(config).toEqual({
				kumaUrl: "http://dubtron.local:3001",
				kumaUser: "admin",
				kumaPass: "changeme",
				sentinelName: "INTERNET-SENTINEL",
				groupToPause: "Sentinel",
				intervalMs: 5000,
			});
		});

		it("should load configuration from environment variables", () => {
			process.env.KUMA_URL = "http://test.com";
			process.env.KUMA_USER = "testuser";
			process.env.KUMA_PASS = "testpass";
			process.env.SENTINEL_NAME = "TEST-SENTINEL";
			process.env.GROUP_TO_PAUSE = "test-group";
			process.env.INTERVAL_MS = "10000";

			const config = loadConfig();
			expect(config).toEqual({
				kumaUrl: "http://test.com",
				kumaUser: "testuser",
				kumaPass: "testpass",
				sentinelName: "TEST-SENTINEL",
				groupToPause: "test-group",
				intervalMs: 10000,
			});
		});

		it("should validate URL format", () => {
			process.env.KUMA_URL = "not-a-valid-url";
			expect(() => loadConfig()).toThrow("Invalid KUMA_URL format");
		});

		it("should validate interval is a positive number", () => {
			process.env.INTERVAL_MS = "-1000";
			expect(() => loadConfig()).toThrow(
				"INTERVAL_MS must be a positive number",
			);
		});

		it("should validate interval is a number", () => {
			process.env.INTERVAL_MS = "not-a-number";
			expect(() => loadConfig()).toThrow(
				"INTERVAL_MS must be a positive number",
			);
		});
	});

	describe("displayConfig", () => {
		it("should log configuration with masked password", () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			const config = {
				kumaUrl: "http://localhost:3001",
				kumaUser: "admin",
				kumaPass: "secretpass",
				sentinelName: "INTERNET-SENTINEL",
				groupToPause: "Sentinel",
				intervalMs: 5000,
			};

			displayConfig(config);

			expect(consoleSpy).toHaveBeenCalledWith("[sentinel] Configuration:");
			expect(consoleSpy).toHaveBeenCalledWith(
				"  KUMA_URL: http://localhost:3001",
			);
			expect(consoleSpy).toHaveBeenCalledWith("  KUMA_USER: admin");
			expect(consoleSpy).toHaveBeenCalledWith("  KUMA_PASS: **********");
			expect(consoleSpy).toHaveBeenCalledWith(
				"  SENTINEL_NAME: INTERNET-SENTINEL",
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				"  GROUP_TO_PAUSE: Sentinel",
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				"  INTERVAL_MS: 5000 (currently unused - real-time via WebSocket)",
			);

			consoleSpy.mockRestore();
		});
	});
});
