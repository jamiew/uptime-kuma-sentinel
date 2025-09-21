// Minimal sentinel for Uptime Kuma
// Pauses/resumes monitors with TAG_TO_SUPPRESS depending on SENTINEL_NAME status.
import { io } from "socket.io-client";

const env = (k, d) => process.env[k] ?? d;

const KUMA_URL = env("KUMA_URL", "http://localhost:3001");
const KUMA_USER = env("KUMA_USER", "admin");
const KUMA_PASS = env("KUMA_PASS", "changeme");
const SENTINEL_NAME = env("SENTINEL_NAME", "INTERNET-SENTINEL");
const TAG_TO_SUPPRESS = env("TAG_TO_SUPPRESS", "internet-dependent");
const INTERVAL_MS = Number(env("INTERVAL_MS", "5000"));

let socket = null;
let authenticated = false;
let suppressed = false;
let sentinelId = null;
let targetIds = [];
let monitors = {};

function connect() {
  return new Promise((resolve, reject) => {
    console.log(`[sentinel] connecting to ${KUMA_URL}`);

    socket = io(KUMA_URL, {
      transports: ["websocket", "polling"],
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("[sentinel] socket connected, attempting login");

      socket.emit(
        "login",
        {
          username: KUMA_USER,
          password: KUMA_PASS,
        },
        (res) => {
          if (res.ok) {
            console.log("[sentinel] login successful");
            authenticated = true;
            resolve();
          } else {
            console.error("[sentinel] login failed:", res.msg);
            reject(new Error(res.msg || "Login failed"));
          }
        }
      );
    });

    socket.on("connect_error", (error) => {
      console.error("[sentinel] connection error:", error.message);
      reject(error);
    });

    socket.on("disconnect", () => {
      console.log("[sentinel] socket disconnected");
      authenticated = false;
    });

    socket.on("monitorList", (monitorList) => {
      console.log("[sentinel] received monitor list");
      monitors = monitorList;
      refreshTargets();
    });

    socket.on("heartbeat", (heartbeat) => {
      if (heartbeat.monitorID === sentinelId) {
        console.log(
          `[sentinel] heartbeat for sentinel: status=${heartbeat.status}, msg=${heartbeat.msg}`
        );
        handleSentinelStatus(heartbeat.status);
      }
    });

    // Set timeout
    setTimeout(() => {
      if (!authenticated) {
        reject(new Error("Connection timeout"));
      }
    }, 15000);
  });
}

function refreshTargets() {
  const monitorArray = Object.values(monitors);
  const sentinel = monitorArray.find((m) => m.name === SENTINEL_NAME);

  if (!sentinel) {
    console.error(`[sentinel] sentinel monitor "${SENTINEL_NAME}" not found`);
    return;
  }

  sentinelId = sentinel.id;

  targetIds = monitorArray
    .filter((m) => (m.tags || []).some((t) => t.name === TAG_TO_SUPPRESS))
    .map((m) => m.id);

  console.log(
    `[sentinel] watching "${SENTINEL_NAME}" (id=${sentinelId}); controlling ${targetIds.length} tagged monitors (${TAG_TO_SUPPRESS})`
  );
}

function pauseMonitor(monitorId) {
  return new Promise((resolve, reject) => {
    socket.emit("pauseMonitor", monitorId, (res) => {
      if (res.ok) {
        resolve();
      } else {
        reject(new Error(res.msg || "Failed to pause monitor"));
      }
    });
  });
}

function resumeMonitor(monitorId) {
  return new Promise((resolve, reject) => {
    socket.emit("resumeMonitor", monitorId, (res) => {
      if (res.ok) {
        resolve();
      } else {
        reject(new Error(res.msg || "Failed to resume monitor"));
      }
    });
  });
}

async function actPause() {
  console.log("[sentinel] internet down -> pausing tagged monitors");

  for (const id of targetIds) {
    try {
      await pauseMonitor(id);
      console.log(`[sentinel] paused monitor ${id}`);
    } catch (e) {
      console.error(`[sentinel] failed to pause monitor ${id}:`, e.message);
    }
  }

  suppressed = true;
  console.log("[sentinel] all tagged monitors paused");
}

async function actResume() {
  console.log("[sentinel] internet restored -> resuming tagged monitors");

  for (const id of targetIds) {
    try {
      await resumeMonitor(id);
      console.log(`[sentinel] resumed monitor ${id}`);
    } catch (e) {
      console.error(`[sentinel] failed to resume monitor ${id}:`, e.message);
    }
  }

  suppressed = false;
  console.log("[sentinel] all tagged monitors resumed");
}

function handleSentinelStatus(status) {
  // Kuma status: 1 = UP, 0 = DOWN, 2 = PENDING/MAINT, 3 = PAUSED
  const isDown = status === 0;

  if (isDown && !suppressed) {
    actPause();
  } else if (!isDown && suppressed) {
    actResume();
  }
}

(async () => {
  for (;;) {
    try {
      await connect();
      console.log("[sentinel] initialization complete, monitoring...");

      // Keep alive - the socket will handle real-time updates
      await new Promise(() => {}); // Never resolves, keeps process running
    } catch (e) {
      console.error(
        "[sentinel] bootstrap error, retrying in 5s:",
        e?.message || e
      );

      if (socket) {
        socket.disconnect();
        socket = null;
      }

      authenticated = false;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
})();
