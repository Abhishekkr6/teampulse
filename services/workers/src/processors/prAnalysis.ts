import { Job } from "bullmq";
import mongoose from "mongoose";
import "dotenv/config";
import Redis from "ioredis";

import { PRModel } from "../models/pr.model";
import { AlertModel } from "../models/alert.model";
import logger from "../utils/logger";

const MONGO_URL =
  process.env.MONGO_URL || "mongodb://localhost:27017/teampulse";

// Connect Mongo only once
if (!mongoose.connection.readyState) {
  mongoose
    .connect(MONGO_URL)
    .then(() => logger.info("[worker] Mongo connected for PRs"))
    .catch((err) => logger.error({ err }, "[worker] Mongo error"));
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

// ⭐ LOWERED threshold for testing (so alerts WILL trigger)
const HIGH_RISK_THRESHOLD = 0.4; // earlier was 0.6 — too high

export const prAnalysisHandler = async (job: Job) => {
  try {
    logger.info({ jobData: job.data }, "[pr-analysis] job received");

    const { prId } = job.data as { prId: string };

    const pr = await PRModel.findById(prId);

    if (!pr) {
      logger.warn({ prId }, "[pr-analysis] PR not found");
      return;
    }

    /* -----------------------------------------------------
       1. RAW VALUES
    ------------------------------------------------------*/
    const files = pr.filesChanged || 0;
    const adds = pr.additions || 0;
    const dels = pr.deletions || 0;

    /* -----------------------------------------------------
       2. NORMALIZED VALUES
    ------------------------------------------------------*/
    const fScore = clamp(files / 20, 0, 1);
    const aScore = clamp(adds / 1000, 0, 1);
    const dScore = clamp(dels / 1000, 0, 1);

    const now = new Date();
    const created = pr.createdAt || now;
    const hoursOpen = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    const timeScore = clamp(hoursOpen / 72, 0, 1);

    /* -----------------------------------------------------
       3. WEIGHT COMBINATION
    ------------------------------------------------------*/
    const risk =
      0.35 * fScore + 0.25 * aScore + 0.15 * dScore + 0.25 * timeScore;

    pr.riskScore = +risk.toFixed(2);
    pr.processed = true;
    await pr.save();

    const redis = new Redis(process.env.REDIS_URL!, {
      tls: { rejectUnauthorized: false },
      maxRetriesPerRequest: null,
    });

    redis.publish(
      "events",
      JSON.stringify({
        type: "PR_UPDATED",
        prId: pr._id,
        repoId: pr.repoId,
        number: pr.number,
        title: pr.title,
        riskScore: pr.riskScore,
        timestamp: Date.now(),
      })
    );

    logger.info({ prNumber: pr.number, riskScore: pr.riskScore }, "[pr-analysis] risk calculated");

    /* -----------------------------------------------------
       4. ALERT CREATION (IMPORTANT PART)
    ------------------------------------------------------*/
    if (pr.riskScore >= HIGH_RISK_THRESHOLD) {
      logger.warn({ prNumber: pr.number, riskScore: pr.riskScore }, "[alert] HIGH RISK DETECTED");

      await AlertModel.create({
        orgId: null, // TODO: map repo.orgId later
        repoId: pr.repoId,
        type: "HIGH_RISK_PR",
        severity: "high",
        metadata: {
          prId: pr._id,
          number: pr.number,
          title: pr.title,
          riskScore: pr.riskScore,
          additions: pr.additions,
          deletions: pr.deletions,
          filesChanged: pr.filesChanged,
          createdAt: pr.createdAt,
        },
      });

      redis.publish(
        "events",
        JSON.stringify({
          type: "NEW_ALERT",
          alertType: "HIGH_RISK_PR",
          prNumber: pr.number,
          prTitle: pr.title,
          riskScore: pr.riskScore,
          repoId: pr.repoId,
          timestamp: Date.now(),
        })
      );

      logger.info({ prNumber: pr.number }, "[alert] ALERT CREATED SUCCESSFULLY");
    } else {
      logger.info({ prNumber: pr.number, riskScore: pr.riskScore }, "[alert] risk below threshold, alert not created");
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, "[pr-analysis] Error");
  }
};
