import { Queue } from "bullmq";
import Redis from "ioredis";
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        }
      : undefined,
});

const connection = new Redis(process.env.REDIS_URL, {
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
});

const commitQueue = new Queue("commit-processing", { connection });
const prQueue = new Queue("pr-analysis", { connection });

async function sendCommitJob() {
  const payload = {
    repoId: "repo_mock_id_1",
    commitIds: ["commit_mock_sha_abc123"],
    receivedAt: new Date().toISOString(),
  };

  const job = await commitQueue.add("process-commits", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });

  logger.info({ jobId: job.id }, "Enqueued commit job");
}

async function sendPrJob() {
  const payload = {
    prId: "pr_mock_1",
    repoId: "repo_mock_id_1",
    trigger: "manual-test",
    payloadMeta: { test: true },
  };

  const job = await prQueue.add("analyze-pr", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });

  logger.info({ jobId: job.id }, "Enqueued PR job");
}

async function run() {
  await sendCommitJob();
  await sendPrJob();

  setTimeout(() => {
    connection.disconnect();
    process.exit(0);
  }, 1000);
}

run();
