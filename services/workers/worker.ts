import { Worker } from "bullmq";
import Redis from "ioredis";
import "dotenv/config";
import { commitProcessingHandler } from "./processors/commitProcessing";
import { prAnalysisHandler } from "./processors/prAnalysis";

const connection = new Redis(process.env.REDIS_URL!, {
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
});

const commitWorker = new Worker("commit-processing", commitProcessingHandler, {
  connection,
});

const prWorker = new Worker("pr-analysis", prAnalysisHandler, { connection });

commitWorker.on("completed", (job) => {
  console.log(`✅ [commit-processing] job ${job.id} completed`);
});

commitWorker.on("failed", (job, err) => {
  console.error(`❌ [commit-processing] job ${job?.id} failed:`, err.message);
});

prWorker.on("completed", (job) => {
  console.log(`✅ [pr-analysis] job ${job.id} completed`);
});

prWorker.on("failed", (job, err) => {
  console.error(`❌ [pr-analysis] job ${job?.id} failed:`, err.message);
});

console.log("🚀 Worker service started (commit-processing + pr-analysis)...");
