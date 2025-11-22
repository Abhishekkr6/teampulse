import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  githubId: string;
  login?: string;   
  name?: string;
  email?: string;
  avatarUrl?: string;
  role: "admin" | "lead" | "dev" | "viewer";
  orgIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    githubId: { type: String, required: true, unique: true },
    login: { type: String },         
    name: String,
    email: String,
    avatarUrl: String,
    role: { type: String, default: "dev" },
    orgIds: [{ type: Schema.Types.ObjectId, ref: "Org" }],
  },
  { timestamps: true }
);

export const UserModel = model<IUser>("User", UserSchema);
