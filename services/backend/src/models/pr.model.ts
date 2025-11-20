import { Schema, model, Document } from "mongoose";

export interface IPR extends Document {
  providerPrId: string;
  repoId: Schema.Types.ObjectId | string;
  number: number;
  title: string;
  authorGithubId?: string;
  state: string;
  createdAt?: Date;
  mergedAt?: Date|null;
  closedAt?: Date|null;
  filesChanged?: number;
  additions?: number;
  deletions?: number;
  reviewers?: any[];
  commentsCount?: number;
  lastReviewAt?: Date|null;
  riskScore?: number;
  processed?: boolean;
}

const PRSchema = new Schema<IPR>({
  providerPrId: { type: String, required: true, unique: true },
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
}, { timestamps: true });

export const PRModel = model<IPR>("PullRequest", PRSchema);
