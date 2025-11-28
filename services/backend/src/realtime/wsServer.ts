import { WebSocketServer } from "ws";
import Redis from "ioredis";

export const attachWebSocket = (server: any) => {
  const wss = new WebSocketServer({ server });

  console.log("[WS] WebSocket attached to Express server");

  const redis = new Redis(process.env.REDIS_URL || "");

  redis.subscribe("events", () => {
    console.log("[WS] Subscribed to Redis events");
  });

  redis.on("message", (_, message) => {
    const event = JSON.parse(message);

    wss.clients.forEach((client) => {
      try {
        client.send(JSON.stringify(event));
      } catch {}
    });
  });
};
