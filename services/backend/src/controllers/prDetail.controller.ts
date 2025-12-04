import { Request, Response } from "express";
import { PRModel } from "../models/pr.model";
import { CommitModel } from "../models/commit.model";
import { AlertModel } from "../models/alert.model";

export const getPRDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pr = await PRModel.findById(id).lean();
    if (!pr) {
      return res.status(404).json({ success: false, error: "PR not found" });
    }

    // for now: commits filtered by author + timeframe
    const commits = await CommitModel.find({
      authorGithubId: pr.authorGithubId,
      timestamp: { $gte: pr.createdAt, $lte: pr.closedAt || new Date() },
      repoId: pr.repoId,
    })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    const alerts = await AlertModel.find({
      "metadata.prId": pr._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: {
        pr,
        commits,
        alerts,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Error loading PR detail" });
  }
};
