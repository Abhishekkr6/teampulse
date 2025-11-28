import { Schema, model } from "mongoose";

const AlertSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org" },
    repoId: { type: Schema.Types.ObjectId, ref: "Repo" },
    type: String,
    severity: String,
    metadata: Schema.Types.Mixed,
    resolvedAt: Date,
    resolvedBy: String,
  },
  { timestamps: true }
);

export const AlertModel = model("Alert", AlertSchema);
