import { WebSocketServer } from "ws";
import Redis from "ioredis";

export const startWSServer = () => {
  const wss = new WebSocketServer({ port: 4001 });
  const redis = new Redis(process.env.REDIS_URL!, {
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
  });

  console.log("[WS] WebSocket server running at ws://localhost:4001");

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
