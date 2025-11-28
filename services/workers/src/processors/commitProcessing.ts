import { Job } from "bullmq";
import mongoose from "mongoose";
import { CommitModel } from "../models/commit.model";
import "dotenv/config";

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/teampulse";

if (!mongoose.connection.readyState) {
  mongoose.connect(MONGO_URL).then(() => console.log("[worker] Mongo connected for commits"));
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

  console.log(`[commit-processing] processed ${commits.length} commits for repo ${repoId}`);
};
