import { Schema, model, Document } from "mongoose";

import { Types } from "mongoose";

export interface ICommit extends Document {
  sha: string;
  repoId: Types.ObjectId;
  authorGithubId?: string;
  authorName?: string;
  message?: string;
  timestamp?: Date;
  filesChangedCount?: number;
  additions?: number;
  deletions?: number;
  modulePaths?: string[];
  processed?: boolean;
}

const CommitSchema = new Schema<ICommit>(
  {
    sha: { type: String, required: true, unique: true },
    repoId: { type: Schema.Types.ObjectId, ref: "Repo" },
    authorGithubId: String,
    authorName: String,
    message: String,
    timestamp: Date,
    filesChangedCount: Number,
    additions: Number,
    deletions: Number,
    modulePaths: [String],
    processed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CommitSchema.index({ repoId: 1, timestamp: -1 });
CommitSchema.index({ authorGithubId: 1, timestamp: -1 });
CommitSchema.index({ sha: 1 }, { unique: true });

export const CommitModel = model<ICommit>("Commit", CommitSchema);
