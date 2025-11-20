import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

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

  console.log("Enqueued commit job id=", job.id);
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

  console.log("Enqueued PR job id=", job.id);
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
