import { Request, Response } from "express";
import mongoose from "mongoose";
import Redis from "ioredis";

let redis: Redis | null = null;

export const healthCheck = async (req: Request, res: Response) => {
  try {
    const dbOk = mongoose.connection.readyState === 1;

    if (!redis) {
      redis = new Redis(process.env.REDIS_URL || "");
    }

    let redisOk = false;
    try {
      const pong = await redis.ping();
      redisOk = pong === "PONG";
    } catch {
      redisOk = false;
    }

    const healthy = dbOk && redisOk;

    return res.status(healthy ? 200 : 500).json({
      success: healthy,
      data: {
        db: dbOk ? "up" : "down",
        redis: redisOk ? "up" : "down",
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: { db: "unknown", redis: "unknown" },
    });
  }
};
