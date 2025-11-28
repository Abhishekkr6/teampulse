import { Schema, model } from "mongoose";

const PRSchema = new Schema(
  {
    providerPrId: { type: String, unique: true, required: true },
    repoId: { type: Schema.Types.ObjectId, ref: "Repo" },
    number: Number,
    title: String,
    authorGithubId: String,
    state: String,
    createdAt: Date,
    mergedAt: Date,
    closedAt: Date,
    filesChanged: Number,
    additions: Number,
    deletions: Number,
    reviewers: [Schema.Types.Mixed],
    commentsCount: Number,
    lastReviewAt: Date,
    riskScore: Number,
    processed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PRModel = model("PullRequest", PRSchema);
