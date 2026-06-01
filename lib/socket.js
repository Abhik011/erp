import { io } from "socket.io-client";

/** Strip `/api` suffix — Socket.IO attaches to the HTTP server root. */
function socketBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5500";
  return String(raw).replace(/\/api\/?$/i, "");
}

let socket = null;

/**
 * @param {string} clerkSessionJwt - Clerk session token from getToken()
 */
export function initSocket(clerkSessionJwt) {
  if (!clerkSessionJwt) return null;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const url = socketBaseUrl();
  socket = io(url, {
    auth: { token: clerkSessionJwt },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 12,
    reconnectionDelay: 800,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
