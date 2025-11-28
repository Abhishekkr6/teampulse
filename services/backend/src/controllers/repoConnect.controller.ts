import { Request, Response } from "express";
import { RepoModel } from "../models/repo.model";
import crypto from "crypto";

export const connectRepo = async (req: any, res: Response) => {
  try {
    console.log("------ DEBUG START ------");
    console.log("REQ BODY:", req.body);
    console.log("ORG ID:", req.params.orgId);
    console.log("WEBHOOK_SECRET:", process.env.WEBHOOK_SECRET);

    const { orgId } = req.params;
    const { repoFullName } = req.body; // "owner/repo"

    if (!repoFullName)
      return res
        .status(400)
        .json({ success: false, error: "repoFullName required" });

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
  } catch (err: any) {
    console.error("CONNECT REPO ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Repo connect failed",
    });
  }
};
