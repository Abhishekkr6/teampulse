import { Job } from "bullmq";
import mongoose from "mongoose";
import { PRModel } from "../backendModels/pr.model.js";
import { AlertModel } from "../backendModels/alert.model.js";
import "dotenv/config";

const MONGO_URL =
  process.env.MONGO_URL || "mongodb://localhost:27017/teampulse";

if (!mongoose.connection.readyState) {
  mongoose
    .connect(MONGO_URL)
    .then(() => console.log("[worker] Mongo connected for PRs"))
    .catch((err) => console.log("Mongo error", err));
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export const prAnalysisHandler = async (job: Job) => {
  try {
    const { prId } = job.data as { prId: string };

    const pr = await PRModel.findById(prId);
    if (!pr) {
      console.log("[pr-analysis] PR not found", prId);
      return;
    }

    /* -----------------------------------------------------
       1. RAW VALUES
    ------------------------------------------------------*/
    const files = pr.filesChanged || 0;
    const adds = pr.additions || 0;
    const dels = pr.deletions || 0;

    /* -----------------------------------------------------
       2. NORMALIZED SCORES
    ------------------------------------------------------*/
    const fScore = clamp(files / 20, 0, 1);
    const aScore = clamp(adds / 1000, 0, 1);
    const dScore = clamp(dels / 1000, 0, 1);

    const now = new Date();
    const created = pr.createdAt || now;
    const hoursOpen =
      (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    const timeScore = clamp(hoursOpen / 72, 0, 1);

    /* -----------------------------------------------------
       3. WEIGHTED RISK SCORE
    ------------------------------------------------------*/
    const risk =
      0.35 * fScore +
      0.25 * aScore +
      0.15 * dScore +
      0.25 * timeScore;

    pr.riskScore = +risk.toFixed(2);
    pr.processed = true;
    await pr.save();

    console.log(
      `[pr-analysis] PR #${pr.number} risk=${pr.riskScore}`
    );

    /* -----------------------------------------------------
       4. ALERT: HIGH RISK PR
    ------------------------------------------------------*/
    if (pr.riskScore > 0.6) {
      await AlertModel.create({
        orgId: null, // TODO: link via repo.orgId when repo model is extended
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

      console.log(
        `[alert] HIGH_RISK_PR created for PR #${pr.number} (${pr.riskScore})`
      );
    }
  } catch (err) {
    console.log("[pr-analysis] Error:", err);
  }
};
