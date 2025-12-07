"use client";

let socket: WebSocket | null = null;
const listeners: ((event: unknown) => void)[] = [];

const DEFAULT_REMOTE_WS = "wss://teampulse-production.up.railway.app";

const resolveWsUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl) return envUrl;

  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL;
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

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (/localhost|127\.0\.0\.1/i.test(origin)) {
      return "ws://localhost:4001";
    }
  }

  return DEFAULT_REMOTE_WS;
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
