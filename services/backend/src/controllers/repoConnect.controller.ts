import { Request, Response } from "express";
import { RepoModel } from "../models/repo.model.js";
import crypto from "crypto";

export const connectRepo = async (req: any, res: Response) => {
  try {
    const { orgId } = req.params;
    const { repoFullName } = req.body; // "owner/repo"

    if (!repoFullName)
      return res.status(400).json({ success: false, error: "repoFullName required" });

    const secret = process.env.WEBHOOK_SECRET!;
    const hashed = crypto.createHash("sha256").update(secret).digest("hex");

    const repo = await RepoModel.create({
      provider: "github",
      providerRepoId: repoFullName,
      orgId,
      name: repoFullName,
      webhookSecretHash: hashed,
      connectedAt: new Date(),
    });

    return res.json({ success: true, data: repo });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Repo connect failed" });
  }
};
