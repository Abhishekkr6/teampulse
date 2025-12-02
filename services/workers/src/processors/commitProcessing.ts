import { Job } from "bullmq";
import mongoose from "mongoose";
import { CommitModel } from "../models/commit.model";
import "dotenv/config";
import logger from "../utils/logger";

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/teampulse";

if (!mongoose.connection.readyState) {
  mongoose
    .connect(MONGO_URL)
    .then(() => logger.info("[worker] Mongo connected for commits"))
    .catch((err) => logger.error({ err }, "[worker] Mongo connection error for commits"));
}

export const commitProcessingHandler = async (job: Job) => {
  const { commitIds, repoId } = job.data as { commitIds: string[]; repoId: string };

  const commits = await CommitModel.find({ _id: { $in: commitIds } });

  for (const c of commits) {
    if (!c.message) continue;

    const modulePaths: string[] = []; 
    c.modulePaths = modulePaths;
    c.processed = true;
    await c.save();
  }

  logger.info({ repoId, commitCount: commits.length }, "[commit-processing] commits processed");
};
