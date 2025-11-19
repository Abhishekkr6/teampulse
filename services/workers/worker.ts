import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import "dotenv/config";

const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Example queue
const metricsQueue = new Queue("metrics", { connection });

// Example worker
const metricsWorker = new Worker(
  "metrics",
  async (job) => {
    console.log("Processing metrics job:", job.name, job.data);

    await new Promise((res) => setTimeout(res, 1000));

    return { status: "done" };
  },
  { connection }
);

console.log("Worker service started...");
