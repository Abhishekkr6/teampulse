import { Worker } from "bullmq";
import Redis from "ioredis";
import "dotenv/config";

const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

const commitWorker = new Worker(
  "commit-processing",
  async (job) => {
    console.log("🔧 Processing commit job:", job.data);

    // Simulate heavy logic
    await new Promise((res) => setTimeout(res, 1000));

    return { status: "commit-processed" };
  },
  { connection }
);

const prWorker = new Worker(
  "pr-analysis",
  async (job) => {
    console.log("📝 Processing PR job:", job.data);

    // Simulate PR risk score logic
    await new Promise((res) => setTimeout(res, 1000));

    return { status: "pr-analyzed" };
  },
  { connection }
);

const metricsWorker = new Worker(
  "metrics",
  async (job) => {
    console.log("📊 Processing metrics job:", job.name, job.data);

    await new Promise((res) => setTimeout(res, 1000));

    return { status: "metrics-done" };
  },
  { connection }
);

console.log("🚀 Worker service started (commit + PR + metrics)...");
