import { Request, Response } from "express";
import { RepoModel } from "../models/repo.model";
import crypto from "crypto";
import logger from "../utils/logger";

export const connectRepo = async (req: any, res: Response) => {
  try {
    logger.debug("------ DEBUG START ------");
    logger.debug({ body: req.body }, "REQ BODY");
    logger.debug({ orgId: req.params.orgId }, "ORG ID");
    logger.debug({ hasWebhookSecret: Boolean(process.env.WEBHOOK_SECRET) }, "WEBHOOK_SECRET configured");

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
    logger.error({ err }, "CONNECT REPO ERROR");
    return res.status(500).json({
      success: false,
      error: err?.message || "Repo connect failed",
    });
  }
};
