import { Schema, model, Document } from "mongoose";

export interface IOrg extends Document {
  name: string;
  slug: string;
  settings: any;
  createdAt: Date;
  updatedAt: Date;
}

const OrgSchema = new Schema<IOrg>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  settings: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export const OrgModel = model<IOrg>("Org", OrgSchema);
