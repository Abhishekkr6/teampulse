import { Job } from "bullmq";
import mongoose from "mongoose";
import "dotenv/config";
import Redis from "ioredis";

import { PRModel } from "../../src/backendModels/pr.model";
import { AlertModel } from "../../src/backendModels/alert.model";

const MONGO_URL =
  process.env.MONGO_URL || "mongodb://localhost:27017/teampulse";

// Connect Mongo only once
if (!mongoose.connection.readyState) {
  mongoose
    .connect(MONGO_URL)
    .then(() => console.log("[worker] Mongo connected for PRs"))
    .catch((err) => console.log("[worker] Mongo error", err));
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

// ⭐ LOWERED threshold for testing (so alerts WILL trigger)
const HIGH_RISK_THRESHOLD = 0.4; // earlier was 0.6 — too high

export const prAnalysisHandler = async (job: Job) => {
  try {
    console.log("[pr-analysis] job received:", job.data);

    const { prId } = job.data as { prId: string };

    const pr = await PRModel.findById(prId);

    if (!pr) {
      console.log("[pr-analysis] PR not found:", prId);
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

    console.log(
      `[pr-analysis] PR #${pr.number} risk calculated = ${pr.riskScore}`
    );

    /* -----------------------------------------------------
       4. ALERT CREATION (IMPORTANT PART)
    ------------------------------------------------------*/
    if (pr.riskScore >= HIGH_RISK_THRESHOLD) {
      console.log(
        `[alert] HIGH RISK DETECTED for PR #${pr.number} (score=${pr.riskScore})`
      );

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

      console.log(`[alert] ALERT CREATED SUCCESSFULLY for PR #${pr.number}`);
    } else {
      console.log(
        `[alert] PR #${pr.number} risk too low (${pr.riskScore}) — alert not created`
      );
    }
  } catch (err) {
    console.log("[pr-analysis] Error:", err);
  }
};
