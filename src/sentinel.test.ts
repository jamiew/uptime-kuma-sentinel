import { describe, it, expect, vi, beforeEach } from "vitest";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

vi.mock("socket.io-client", () => ({
	io: vi.fn(),
}));

vi.mock("./config.js", () => ({
	loadConfig: vi.fn(() => ({
		kumaUrl: "http://localhost:3001",
		kumaUser: "admin",
		kumaPass: "changeme",
		sentinelName: "INTERNET-SENTINEL",
		tagToSuppress: "internet-dependent",
		intervalMs: 5000,
	})),
	displayConfig: vi.fn(),
}));

describe("UptimeKumaSentinel", () => {
	let mockSocket: Partial<Socket>;
	let listeners: Record<string, Function>;

	beforeEach(() => {
		vi.clearAllMocks();
		listeners = {};

		mockSocket = {
			on: vi.fn((event: string, handler: Function) => {
				listeners[event] = handler;
			}),
			emit: vi.fn(),
			disconnect: vi.fn(),
		};

		(io as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSocket);
	});

	it("should create a socket connection with correct options", async () => {
		const { UptimeKumaSentinel } = await import("./sentinel.js");
		const sentinel = new UptimeKumaSentinel({
			kumaUrl: "http://localhost:3001",
			kumaUser: "admin",
			kumaPass: "changeme",
			sentinelName: "INTERNET-SENTINEL",
			tagToSuppress: "internet-dependent",
			intervalMs: 5000,
		});

		const connectPromise = sentinel.connect();
		listeners["connect"]?.();
		(mockSocket.emit as ReturnType<typeof vi.fn>).mockImplementation(
			(event, data, callback) => {
				if (event === "login") {
					callback({ ok: true });
				}
			},
		);

		await connectPromise;

		expect(io).toHaveBeenCalledWith("http://localhost:3001", {
			transports: ["websocket", "polling"],
			timeout: 10000,
		});
	});

	it("should handle login success", async () => {
		const { UptimeKumaSentinel } = await import("./sentinel.js");
		const sentinel = new UptimeKumaSentinel({
			kumaUrl: "http://localhost:3001",
			kumaUser: "admin",
			kumaPass: "changeme",
			sentinelName: "INTERNET-SENTINEL",
			tagToSuppress: "internet-dependent",
			intervalMs: 5000,
		});

		const connectPromise = sentinel.connect();
		listeners["connect"]?.();

		(mockSocket.emit as ReturnType<typeof vi.fn>).mockImplementation(
			(event, data, callback) => {
				if (event === "login") {
					callback({ ok: true });
				}
			},
		);

		await expect(connectPromise).resolves.toBeUndefined();
		expect(mockSocket.emit).toHaveBeenCalledWith(
			"login",
			{ username: "admin", password: "changeme" },
			expect.any(Function),
		);
	});

	it("should handle login failure", async () => {
		const { UptimeKumaSentinel } = await import("./sentinel.js");
		const sentinel = new UptimeKumaSentinel({
			kumaUrl: "http://localhost:3001",
			kumaUser: "admin",
			kumaPass: "changeme",
			sentinelName: "INTERNET-SENTINEL",
			tagToSuppress: "internet-dependent",
			intervalMs: 5000,
		});

		const connectPromise = sentinel.connect();
		listeners["connect"]?.();

		(mockSocket.emit as ReturnType<typeof vi.fn>).mockImplementation(
			(event, data, callback) => {
				if (event === "login") {
					callback({ ok: false, msg: "Invalid credentials" });
				}
			},
		);

		await expect(connectPromise).rejects.toThrow("Invalid credentials");
	});

	it("should handle connection error", async () => {
		const { UptimeKumaSentinel } = await import("./sentinel.js");
		const sentinel = new UptimeKumaSentinel({
			kumaUrl: "http://localhost:3001",
			kumaUser: "admin",
			kumaPass: "changeme",
			sentinelName: "INTERNET-SENTINEL",
			tagToSuppress: "internet-dependent",
			intervalMs: 5000,
		});

		const connectPromise = sentinel.connect();
		const error = new Error("Connection failed");
		listeners["connect_error"]?.(error);

		await expect(connectPromise).rejects.toThrow("Connection failed");
	});

	it("should disconnect properly", async () => {
		const { UptimeKumaSentinel } = await import("./sentinel.js");
		const sentinel = new UptimeKumaSentinel({
			kumaUrl: "http://localhost:3001",
			kumaUser: "admin",
			kumaPass: "changeme",
			sentinelName: "INTERNET-SENTINEL",
			tagToSuppress: "internet-dependent",
			intervalMs: 5000,
		});

		const connectPromise = sentinel.connect();
		listeners["connect"]?.();
		(mockSocket.emit as ReturnType<typeof vi.fn>).mockImplementation(
			(event, data, callback) => {
				if (event === "login") {
					callback({ ok: true });
				}
			},
		);

		await connectPromise;
		sentinel.disconnect();

		expect(mockSocket.disconnect).toHaveBeenCalled();
	});
});