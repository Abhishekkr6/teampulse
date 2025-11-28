import { Request, Response } from "express";
import { CommitModel } from "../models/commit.model";
import { PRModel } from "../models/pr.model";
import { AlertModel } from "../models/alert.model";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId;

    // Recent 7 days window
    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);

    // Total commits
    const commitsCount = await CommitModel.countDocuments({
      timestamp: { $gte: last7 }
    });

    // Active developers (unique commit authors)
    const activeDevs = await CommitModel.distinct("authorGithubId", {
      timestamp: { $gte: last7 }
    });

    // Open PRs
    const openPRs = await PRModel.countDocuments({ state: "open" });

    // Avg PR merge time (merged PRs only)
    const merged = await PRModel.aggregate([
      { $match: { mergedAt: { $ne: null } } },
      {
        $project: {
          diffHours: {
            $divide: [
              { $subtract: ["$mergedAt", "$createdAt"] },
              1000 * 60 * 60,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: "$diffHours" },
        },
      },
    ]);

    const avgPRTime = merged.length ? merged[0].avgHours.toFixed(2) : 0;

    return res.json({
      success: true,
      data: {
        kpis: {
          commits: commitsCount,
          activeDevs: activeDevs.length,
          openPRs,
          avgPRTimeHours: avgPRTime,
        },
      },
    });
  } catch (err) {
    console.log("Dashboard error", err);
    return res.status(500).json({ success: false });
  }
};
