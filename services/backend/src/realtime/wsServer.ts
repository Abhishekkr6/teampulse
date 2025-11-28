import type { Server as HTTPServer } from "http";
import { WebSocketServer } from "ws";
import Redis from "ioredis";

export const startWSServer = (server: HTTPServer) => {
  const wss = new WebSocketServer({ server });
  const redis = new Redis(process.env.REDIS_URL!, {
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
  });

  console.log("[WS] WebSocket server listening on shared HTTP port");

  redis.subscribe("events", () => {
    console.log("[WS] Subscribed to Redis channel: events");
  });

  redis.on("message", (_, message) => {
    const event = JSON.parse(message);

    wss.clients.forEach((client) => {
      try {
        client.send(JSON.stringify(event));
      } catch (e) {
        console.log("[WS] Error sending event", e);
      }
    });
  });
};
