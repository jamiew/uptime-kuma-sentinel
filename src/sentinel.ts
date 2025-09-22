import { type Socket, io } from "socket.io-client";
import { displayConfig, loadConfig } from "./config.js";
import {
	type ApiResponse,
	type HeartbeatData,
	type Monitor,
	MonitorStatus,
	type SentinelConfig,
} from "./types.js";

class UptimeKumaSentinel {
	private config: SentinelConfig;
	private socket: Socket | null = null;
	private authenticated = false;
	private suppressed = false;
	private sentinelId: number | null = null;
	private targetIds: number[] = [];
	private monitors: Record<string, Monitor> = {};

	constructor(config: SentinelConfig) {
		this.config = config;
	}

	// Utility to promisify socket.emit calls
	private emitAsync(event: string, ...args: unknown[]): Promise<ApiResponse> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error("Socket not connected"));
				return;
			}
			this.socket.emit(event, ...args, (res: ApiResponse) => {
				if (res.ok) {
					resolve(res);
				} else {
					reject(new Error(res.msg || `Failed to ${event}`));
				}
			});
		});
	}

	// Utility to wait for socket connection
	private waitForConnection(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error("Socket not initialized"));
				return;
			}

			const timeout = setTimeout(() => {
				if (!this.authenticated) {
					reject(new Error("Connection timeout"));
				}
			}, 15000);

			this.socket.on("connect", async () => {
				console.log("[sentinel] socket connected, attempting login");
				try {
					await this.login();
					clearTimeout(timeout);
					resolve();
				} catch (error) {
					clearTimeout(timeout);
					reject(error);
				}
			});

			this.socket.on("connect_error", (error: Error) => {
				console.error("[sentinel] connection error:", error.message);
				clearTimeout(timeout);
				reject(error);
			});
		});
	}

	async connect(): Promise<void> {
		console.log(`[sentinel] connecting to ${this.config.kumaUrl}`);

		this.socket = io(this.config.kumaUrl, {
			transports: ["websocket", "polling"],
			timeout: 10000,
		});

		// Set up persistent event handlers
		this.socket.on("disconnect", () => {
			console.log("[sentinel] socket disconnected");
			this.authenticated = false;
		});

		this.socket.on("monitorList", (monitorList: Record<string, Monitor>) => {
			console.log("[sentinel] received monitor list");
			this.monitors = monitorList;
			this.refreshTargets();
		});

		this.socket.on("heartbeat", (heartbeat: HeartbeatData) => {
			if (heartbeat.monitorID === this.sentinelId) {
				console.log(
					`[sentinel] heartbeat for sentinel: status=${heartbeat.status}, msg=${heartbeat.msg}`,
				);
				this.handleSentinelStatus(heartbeat.status);
			}
		});

		// Wait for connection and login
		await this.waitForConnection();
	}

	private async login(): Promise<void> {
		try {
			await this.emitAsync("login", {
				username: this.config.kumaUser,
				password: this.config.kumaPass,
			});

			console.log("[sentinel] login successful");
			this.authenticated = true;
		} catch (error) {
			console.error("[sentinel] login failed:", (error as Error).message);
			throw error;
		}
	}

	private refreshTargets(): void {
		const monitorArray = Object.values(this.monitors);
		const sentinel = monitorArray.find(
			(m) => m.name === this.config.sentinelName,
		);

		if (!sentinel) {
			console.error(
				`[sentinel] sentinel monitor "${this.config.sentinelName}" not found`,
			);
			return;
		}

		this.sentinelId = sentinel.id;

		// Find the group monitor by name
		const groupMonitor = monitorArray.find(
			(m) => m.name === this.config.groupToPause && m.type === "group",
		);

		if (!groupMonitor) {
			console.error(`[sentinel] group "${this.config.groupToPause}" not found`);
			return;
		}

		// Get all child monitors of this group
		this.targetIds = monitorArray
			.filter((m) => m.parent === groupMonitor.id)
			.map((m) => m.id);

		console.log(
			`[sentinel] watching "${this.config.sentinelName}" (id=${this.sentinelId}); ` +
				`controlling ${this.targetIds.length} monitors in group "${this.config.groupToPause}"`,
		);
	}

	private async pauseMonitor(monitorId: number): Promise<void> {
		await this.emitAsync("pauseMonitor", monitorId);
	}

	private async resumeMonitor(monitorId: number): Promise<void> {
		await this.emitAsync("resumeMonitor", monitorId);
	}

	private async actPause(): Promise<void> {
		console.log("[sentinel] internet down -> pausing group monitors");

		for (const id of this.targetIds) {
			try {
				await this.pauseMonitor(id);
				console.log(`[sentinel] paused monitor ${id}`);
			} catch (e) {
				const error = e as Error;
				console.error(
					`[sentinel] failed to pause monitor ${id}:`,
					error.message,
				);
			}
		}

		this.suppressed = true;
		console.log("[sentinel] all group monitors paused");
	}

	private async actResume(): Promise<void> {
		console.log("[sentinel] internet restored -> resuming group monitors");

		for (const id of this.targetIds) {
			try {
				await this.resumeMonitor(id);
				console.log(`[sentinel] resumed monitor ${id}`);
			} catch (e) {
				const error = e as Error;
				console.error(
					`[sentinel] failed to resume monitor ${id}:`,
					error.message,
				);
			}
		}

		this.suppressed = false;
		console.log("[sentinel] all group monitors resumed");
	}

	private handleSentinelStatus(status: MonitorStatus): void {
		const isDown = status === MonitorStatus.DOWN;

		if (isDown && !this.suppressed) {
			this.actPause().catch((e) =>
				console.error("[sentinel] pause action failed:", e),
			);
		} else if (!isDown && this.suppressed) {
			this.actResume().catch((e) =>
				console.error("[sentinel] resume action failed:", e),
			);
		}
	}

	disconnect(): void {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
		this.authenticated = false;
	}

	async run(): Promise<void> {
		for (;;) {
			try {
				await this.connect();
				console.log("[sentinel] initialization complete, monitoring...");

				await new Promise(() => {});
			} catch (e) {
				const error = e as Error;
				console.error(
					"[sentinel] bootstrap error, retrying in 5s:",
					error?.message || error,
				);

				this.disconnect();
				await new Promise((r) => setTimeout(r, 5000));
			}
		}
	}
}

async function main(): Promise<void> {
	try {
		const config = loadConfig();
		displayConfig(config);

		const sentinel = new UptimeKumaSentinel(config);
		await sentinel.run();
	} catch (error) {
		console.error("[sentinel] Fatal error:", error);
		process.exit(1);
	}
}

// Export the class for testing
export { UptimeKumaSentinel };

main().catch((error) => {
	console.error("[sentinel] Unhandled error:", error);
	process.exit(1);
});
