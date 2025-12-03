import { Schema, model, Document } from "mongoose";

import mongoose from "mongoose";

export interface IAlert extends Document {
  orgId: mongoose.Types.ObjectId;
  repoId?: mongoose.Types.ObjectId | null;
  type: string;
  severity: "low" | "medium" | "high";
  metadata?: any;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
}

const AlertSchema = new Schema<IAlert>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org" },
    repoId: { type: Schema.Types.ObjectId, ref: "Repo", default: null },
    type: String,
    severity: { type: String, default: "low" },
    metadata: Schema.Types.Mixed,
    resolvedAt: Date,
    resolvedBy: String,
  },
  { timestamps: true }
);

AlertSchema.index({ orgId: 1, createdAt: -1 });
AlertSchema.index({ resolvedAt: 1 });
AlertSchema.index({ type: 1, severity: 1 });

export const AlertModel = model<IAlert>("Alert", AlertSchema);
