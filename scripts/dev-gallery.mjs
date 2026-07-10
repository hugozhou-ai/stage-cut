import { spawn } from "node:child_process";
import net from "node:net";

const LOG_PREFIX = "[stagecut:gallery-dev]";
const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 5173;
const MAX_PORT_ATTEMPTS = 100;
const CONNECT_TIMEOUT_MS = 200;

function log(event, details) {
  console.log(`${LOG_PREFIX} ${JSON.stringify({ event, ...details })}`);
}

function parsePort(value) {
  if (!value) return DEFAULT_PORT;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid dev server port: ${value}`);
  return port;
}

function canBindPort(host, port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") return resolve(false);
      reject(error);
    });
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen({ host, port, exclusive: true });
  });
}

function canConnectPort(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (connected) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(connected);
    };
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.setTimeout(CONNECT_TIMEOUT_MS, () => done(false));
  });
}

async function getPortAvailability(host, port) {
  if (!(await canBindPort(host, port))) return { available: false, reason: "bind-unavailable" };
  if (host === "0.0.0.0" || host === "::") {
    for (const loopbackHost of ["127.0.0.1", "::1"]) {
      if (await canConnectPort(loopbackHost, port)) {
        return { available: false, loopbackHost, reason: "loopback-listener" };
      }
    }
  }
  return { available: true };
}

async function findAvailablePort(host, preferredPort) {
  for (let port = preferredPort; port < preferredPort + MAX_PORT_ATTEMPTS && port <= 65535; port += 1) {
    const availability = await getPortAvailability(host, port);
    if (availability.available) return port;
    log("port-unavailable", { host, loopbackHost: availability.loopbackHost, port, reason: availability.reason });
  }
  throw new Error(`No available port found from ${preferredPort}.`);
}

const host = process.env.STAGECUT_GALLERY_HOST || process.env.STAGECUT_STUDIO_HOST || process.env.HOST || DEFAULT_HOST;
const preferredPort = parsePort(
  process.env.STAGECUT_GALLERY_PORT || process.env.STAGECUT_STUDIO_PORT || process.env.VITE_PORT || process.env.PORT,
);
const port = await findAvailablePort(host, preferredPort);
log("starting-vite", { host, port, preferredPort });

const vite = spawn("vite", ["--host", host, "--port", String(port), "--strictPort"], {
  shell: process.platform === "win32",
  stdio: "inherit",
});

vite.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

vite.on("error", (error) => {
  console.error(`${LOG_PREFIX} ${JSON.stringify({ event: "vite-spawn-error", message: error.message })}`);
  process.exit(1);
});
