/**
 * TypeScript definitions for Uptime Kuma Sentinel
 * Based on Uptime Kuma's internal API structures
 */

export interface SentinelConfig {
  readonly kumaUrl: string;
  readonly kumaUser: string;
  readonly kumaPass: string;
  readonly sentinelName: string;
  readonly tagToSuppress: string;
  readonly intervalMs: number;
}

export interface Monitor {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly url?: string;
  readonly active: boolean;
  readonly tags?: MonitorTag[];
  readonly status?: MonitorStatus;
  readonly notificationIDList?: Record<string, boolean>;
  readonly interval?: number;
  readonly retryInterval?: number;
  readonly maxretries?: number;
  readonly method?: string;
  readonly hostname?: string | null;
  readonly port?: number | null;
  readonly accepted_statuscodes_json?: string;
  readonly conditions?: string;
}

export interface MonitorTag {
  readonly tag_id: number;
  readonly monitor_id: number;
  readonly value?: string | null;
  readonly name: string;
  readonly color: string;
}

export interface Heartbeat {
  readonly monitorID: number;
  readonly status: MonitorStatus;
  readonly time: string; // ISO 8601 UTC timestamp
  readonly msg: string;
  readonly ping?: number | null; // Response time in ms
  readonly important: boolean; // Was this heartbeat a status change?
  readonly duration: number; // Seconds since last heartbeat
  readonly localDateTime: string; // Formatted time in server timezone
  readonly timezone: string; // Server timezone name
  readonly retries: number; // Number of retries attempted
  readonly downCount: number; // Consecutive down count
}

export interface SocketResponse<T = unknown> {
  readonly ok: boolean;
  readonly msg?: string;
  readonly msgi18n?: boolean;
  readonly data?: T;
  readonly monitorID?: number;
  readonly token?: string;
  readonly tokenRequired?: boolean;
}

export interface LoginRequest {
  readonly username: string;
  readonly password: string;
  readonly token?: string; // 2FA token if required
}

export interface MonitorList {
  readonly [monitorId: string]: Monitor;
}

export interface SentinelState {
  authenticated: boolean;
  suppressed: boolean;
  sentinelId: number | null;
  targetIds: readonly number[];
  monitors: MonitorList;
}

export interface ConnectionConfig {
  readonly url: string;
  readonly transports: readonly ["websocket", "polling"];
  readonly timeout: number;
}

// Uptime Kuma monitor status codes
export enum MonitorStatus {
  DOWN = 0,
  UP = 1,
  PENDING = 2,
  MAINTENANCE = 3,
  PAUSED = 3, // Alternative name for PAUSED status
}

export interface EnvironmentVariables {
  readonly KUMA_URL: string;
  readonly KUMA_USER: string;
  readonly KUMA_PASS: string;
  readonly SENTINEL_NAME: string;
  readonly TAG_TO_SUPPRESS: string;
  readonly INTERVAL_MS: string;
}

// Socket.io event types
export interface ServerToClientEvents {
  monitorList: (monitors: MonitorList) => void;
  updateMonitorIntoList: (updates: Partial<MonitorList>) => void;
  deleteMonitorFromList: (monitorID: number) => void;
  heartbeat: (heartbeat: Heartbeat) => void;
  avgPing: (data: { monitorID: number; avgPing: number | null }) => void;
  uptime: (data: {
    monitorID: number;
    periodKey: string;
    percentage: number;
  }) => void;
  certInfo: (data: { monitorID: number; tlsInfoJSON: string }) => void;
  refresh: () => void;
  info: (data: {
    version: string;
    latestVersion: string;
    primaryBaseURL: string;
    serverTimezone: string;
  }) => void;
}

export interface ClientToServerEvents {
  login: (
    credentials: LoginRequest,
    callback: (response: SocketResponse) => void
  ) => void;
  loginByToken: (
    token: string,
    callback: (response: SocketResponse) => void
  ) => void;
  logout: (callback?: (response: SocketResponse) => void) => void;
  pauseMonitor: (
    monitorId: number,
    callback: (response: SocketResponse) => void
  ) => void;
  resumeMonitor: (
    monitorId: number,
    callback: (response: SocketResponse) => void
  ) => void;
  getMonitor: (
    monitorId: number,
    callback: (response: SocketResponse<Monitor>) => void
  ) => void;
}

export type SentinelSocket = import("socket.io-client").Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}
