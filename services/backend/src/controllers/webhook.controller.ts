import { Request, Response } from "express";
import { verifyGithubSignature } from "../utils/verifySignature.js";
import { CommitModel } from "../models/commit.model.js";
import { PRModel } from "../models/pr.model.js";
import { RepoModel } from "../models/repo.model.js";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

const commitQueue = new Queue("commit-processing", { connection: redis });
const prQueue = new Queue("pr-analysis", { connection: redis });

export const githubWebhookHandler = async (req: Request, res: Response) => {
  try {
    /* -------------------------------------------
       RAW BODY CHECK
    -------------------------------------------- */
    const rawBody = req.body as Buffer;

    if (!rawBody) {
      console.log("❌ raw body missing");
      return res.status(400).json({ success: false, message: "No raw body" });
    }

    const signature = req.headers["x-hub-signature-256"] as string;
    const event = req.headers["x-github-event"] as string;

    /* -------------------------------------------
       PARSE PAYLOAD
    -------------------------------------------- */
    const payload = JSON.parse(rawBody.toString());

    const fullRepoName = payload.repository?.full_name;
    if (!fullRepoName) {
      console.log("⚠️ Missing repo name in payload");
      return res.status(200).json({ success: true });
    }

    /* -------------------------------------------
       FIND REPO IN DB
    -------------------------------------------- */
    const repo = await RepoModel.findOne({ name: fullRepoName });
    if (!repo) {
      console.log("⚠️ Unknown repo:", fullRepoName);
      return res.status(200).send("OK");
    }

    /* -------------------------------------------
       SIGNATURE VERIFY
    -------------------------------------------- */
    const valid = verifyGithubSignature(
      process.env.WEBHOOK_SECRET!,
      rawBody,
      signature
    );

    if (!valid) {
      console.log("❌ Invalid signature");
      return res.status(401).json({ success: false, message: "Bad signature" });
    }

    /* -------------------------------------------
       PUSH EVENT → COMMITS
    -------------------------------------------- */
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

      await commitQueue.add("commit-batch", {
        repoId: repo._id,
        commitIds: commitDocs.map((d) => d._id),
      });

      console.log("✅ Push event processed");
    }

    /* -------------------------------------------
       PR EVENT → pull_request
    -------------------------------------------- */
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

      console.log("✅ PR event processed");
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.log("❌ Webhook Error:", err);
    return res.status(500).json({ success: false });
  }
};
