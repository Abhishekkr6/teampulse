import { Schema, model, Document, Types } from "mongoose";

export interface IMetric extends Document {
  orgId: Types.ObjectId;
  repoId?: Types.ObjectId | null;
  metricName: string;
  metricValue: number;
  timeframeStart: Date;
  timeframeEnd: Date;
  payload?: any;
}

const MetricSchema = new Schema<IMetric>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org" },
    repoId: { type: Schema.Types.ObjectId, ref: "Repo", default: null },
    metricName: String,
    metricValue: Number,
    timeframeStart: Date,
    timeframeEnd: Date,
    payload: Schema.Types.Mixed,
  },
  { timestamps: true }
);

MetricSchema.index({ orgId: 1, metricName: 1, timeframeStart: -1 });

export const MetricModel = model<IMetric>("MetricSnapshot", MetricSchema);
