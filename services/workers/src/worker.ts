import { Worker } from "bullmq";
import Redis from "ioredis";
import "dotenv/config";
import { commitProcessingHandler } from "./processors/commitProcessing";
import { prAnalysisHandler } from "./processors/prAnalysis";
import logger from "./utils/logger";

// Redis connection
const connection = new Redis(process.env.REDIS_URL!, {
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
});

// Workers
const commitWorker = new Worker("commit-processing", commitProcessingHandler, {
  connection,
});

const prWorker = new Worker("pr-analysis", prAnalysisHandler, { connection });
 
//-----------------------------------------------
// 🔥 EVENT LOGGING STARTS HERE
//-----------------------------------------------

// On job start (very important for debugging slow jobs)
commitWorker.on("active", (job) => {
  logger.info(
    { jobId: job.id, name: job.name, queue: "commit-processing" },
    "⚙️ [commit-processing] job started"
  );
});

// Job success
commitWorker.on("completed", (job) => {
  logger.info(
    { jobId: job.id, name: job.name, queue: "commit-processing" },
    "✅ [commit-processing] job completed"
  );
});

// Job fail
commitWorker.on("failed", (job, err) => {
  logger.error(
    {
      jobId: job?.id,
      name: job?.name,
      queue: "commit-processing",
      attemptsMade: job?.attemptsMade,
      err,
    },
    "❌ [commit-processing] job failed"
  );
});

// Same logs for PR worker
prWorker.on("active", (job) => {
  logger.info(
    { jobId: job.id, name: job.name, queue: "pr-analysis" },
    "⚙️ [pr-analysis] job started"
  );
});

prWorker.on("completed", (job) => {
  logger.info(
    { jobId: job.id, name: job.name, queue: "pr-analysis" },
    "✅ [pr-analysis] job completed"
  );
});

prWorker.on("failed", (job, err) => {
  logger.error(
    {
      jobId: job?.id,
      name: job?.name,
      queue: "pr-analysis",
      attemptsMade: job?.attemptsMade,
      err,
    },
    "❌ [pr-analysis] job failed"
  );
});

//-----------------------------------------------
// Starting log
//-----------------------------------------------
logger.info("🚀 Worker service started (commit-processing + pr-analysis)");


process.on("uncaughtException", (err) => {
  logger.error({ err }, "💥 Uncaught Exception — worker crashed");
  process.exit(1); // restart container
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "⚠️ Unhandled Promise Rejection — worker");
  process.exit(1);
});
