import { Request, Response } from "express";
import { verifyGithubSignature } from "../utils/verifySignature";
import { CommitModel } from "../models/commit.model";
import { PRModel } from "../models/pr.model";
import { RepoModel } from "../models/repo.model";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import logger from "../utils/logger";

/* -------------------------------------------
   FIXED REDIS CONNECTION FOR UPSTASH
-------------------------------------------- */
const redis = new IORedis(process.env.REDIS_URL!, {
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
});

/* -------------------------------------------
   BULLMQ QUEUES (fixed)
-------------------------------------------- */
const commitQueue = new Queue("commit-processing", {
  connection: redis,
});

const prQueue = new Queue("pr-analysis", {
  connection: redis,
});

/* -------------------------------------------
   WEBHOOK HANDLER
-------------------------------------------- */
export const githubWebhookHandler = async (req: Request, res: Response) => {
  try {
    const rawBody = req.body as Buffer;

    if (!rawBody) {
      logger.error("❌ raw body missing");
      return res.status(400).json({ success: false, message: "No raw body" });
    }

    const signature = req.headers["x-hub-signature-256"] as string;
    const event = req.headers["x-github-event"] as string;

    if (!signature) {
      logger.warn({ headers: req.headers }, "❌ Missing signature header");
      return res.status(401).json({ error: "Missing signature" });
    }

    const payload = JSON.parse(rawBody.toString());

    const fullRepoName = payload.repository?.full_name;
    if (!fullRepoName) {
      logger.warn("⚠️ Missing repo name in payload");
      return res.status(200).json({ success: true });
    }

    const repo = await RepoModel.findOne({ name: fullRepoName });
    if (!repo) {
      logger.warn({ repo: fullRepoName }, "⚠️ Unknown repo");
      return res.status(200).send("OK");
    }

    const ok = verifyGithubSignature(
      process.env.WEBHOOK_SECRET!,
      rawBody,
      signature
    );

    if (!ok) {
      logger.warn({ repo: fullRepoName }, "❌ Invalid signature");
      return res.status(403).json({ error: "Invalid signature" });
    }

    if (event === "push") {
      const commits = payload.commits || [];

      const commitDocs = await Promise.all(
        commits.map(async (c: any) =>
          CommitModel.findOneAndUpdate(
            { sha: c.id },
            {
              sha: c.id,
              repoId: repo._id,
              authorGithubId: c.author.username,
              authorName: c.author.name,
              message: c.message,
              timestamp: c.timestamp,
              filesChangedCount: c.modified.length,
              additions: c.added.length,
              deletions: c.removed.length,
            },
            { upsert: true, new: true }
          )
        )
      );

      await commitQueue.add(
        "commit-batch",
        {
          repoId: repo._id,
          commitIds: commitDocs.map((d) => d._id),
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: 20,
        }
      );

      logger.info({ repoId: repo._id, commits: commits.length }, "✅ Push event processed");
    }

    if (event === "pull_request") {
      const pr = payload.pull_request;

      const savedPR = await PRModel.findOneAndUpdate(
        { providerPrId: pr.id },
        {
          providerPrId: pr.id,
          repoId: repo._id,
          number: pr.number,
          title: pr.title,
          authorGithubId: pr.user.login,
          state: pr.state,
          createdAt: pr.created_at,
          mergedAt: pr.merged_at,
          closedAt: pr.closed_at,
          filesChanged: pr.changed_files,
          additions: pr.additions,
          deletions: pr.deletions,
        },
        { upsert: true, new: true }
      );

      await prQueue.add("pr-analysis", {
        prId: savedPR._id,
        repoId: repo._id,
        trigger: "webhook",
      });

      logger.info({ repoId: repo._id, prNumber: pr.number }, "✅ PR event processed");
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error({ err }, "❌ Webhook Error");
    return res.status(500).json({ success: false });
  }
};
