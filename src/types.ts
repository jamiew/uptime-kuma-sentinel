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

export interface Tag {
  readonly id: number;
  readonly name: string;
  readonly color: string;
}

export interface Monitor {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly url?: string;
  readonly active: boolean;
  readonly tags?: Tag[];
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

export interface HeartbeatData {
  readonly monitorID: number;
  readonly status: MonitorStatus;
  readonly time: string;
  readonly msg?: string;
  readonly ping?: number | null;
  readonly important: boolean;
  readonly duration?: number;
  readonly retries?: number;
  readonly downCount?: number;
  readonly localDateTime?: string;
  readonly timezone?: string;
}

export interface ApiResponse {
  readonly ok: boolean;
  readonly msg?: string;
}

export interface LoginResponse extends ApiResponse {
  readonly token?: string;
  readonly user?: {
    id: number;
    username: string;
    email?: string;
  };
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
