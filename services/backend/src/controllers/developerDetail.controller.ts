import { Request, Response } from "express";
import { CommitModel } from "../models/commit.model";
import { PRModel } from "../models/pr.model";
import { UserModel } from "../models/user.model";

export const getDeveloperDetail = async (req: Request, res: Response) => {
  try {
    const { githubId } = req.params;

    const user = await UserModel.findOne({ githubId }).lean();

    const [commitAgg, prAgg, highRiskPRs, recentCommits] = await Promise.all([
      CommitModel.countDocuments({ authorGithubId: githubId }),
      PRModel.countDocuments({ authorGithubId: githubId }),
      PRModel.countDocuments({ authorGithubId: githubId, riskScore: { $gt: 0.6 } }),
      CommitModel.find({ authorGithubId: githubId })
        .sort({ timestamp: -1 })
        .limit(20)
        .lean(),
    ]);

    return res.json({
      success: true,
      data: {
        profile: user,
        stats: {
          totalCommits: commitAgg,
          totalPRs: prAgg,
          highRiskPRs,
        },
        recentCommits,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to load developer" });
  }
};
