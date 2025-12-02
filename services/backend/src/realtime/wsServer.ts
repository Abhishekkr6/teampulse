import { WebSocketServer } from "ws";
import Redis from "ioredis";
import logger from "../utils/logger";

export const attachWebSocket = (server: any) => {
  const wss = new WebSocketServer({ server });

  logger.info("[WS] WebSocket attached to Express server");

  const redis = new Redis(process.env.REDIS_URL || "");

  redis.subscribe("events", () => {
    logger.info("[WS] Subscribed to Redis events");
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
