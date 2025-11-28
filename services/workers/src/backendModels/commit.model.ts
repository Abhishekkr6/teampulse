import { Schema, model } from "mongoose";

const CommitSchema = new Schema(
  {
    sha: { type: String, unique: true, required: true },
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

export const CommitModel = model("Commit", CommitSchema);
