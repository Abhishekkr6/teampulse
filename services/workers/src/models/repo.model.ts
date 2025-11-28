import { Schema, model } from "mongoose";

const RepoSchema = new Schema(
  {
    provider: String, // e.g. "github"
    providerRepoId: String, // owner/repo
    orgId: { type: Schema.Types.ObjectId, ref: "Org" },
    name: String,
    webhookSecretHash: String,
    connectedAt: Date,
  },
  { timestamps: true }
);

export const RepoModel = model("Repo", RepoSchema);
