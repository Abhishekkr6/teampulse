"use client";

let socket: WebSocket | null = null;
const listeners: ((event: unknown) => void)[] = [];

const resolveWsUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl) return envUrl;

  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
      parsed.pathname = parsed.pathname.replace(/\/?api\/?v1?$/i, "");
      return parsed.toString().replace(/\/$/, "");
    } catch {
      // fall through to default
    }
  }

  return "ws://localhost:4001";
};

export const connectWS = () => {
  if (socket) return socket;

  socket = new WebSocket(resolveWsUrl());

  socket.onopen = () => console.log("[WS] Connected");
  socket.onclose = () => {
    console.log("[WS] Disconnected. Reconnecting...");
    setTimeout(() => {
      socket = null;
      connectWS();
    }, 2000);
  };

  socket.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      listeners.forEach((cb) => cb(data));
    } catch {}
  };

  return socket;
};

export const subscribeWS = (cb: (event: unknown) => void) => {
  listeners.push(cb);
};
