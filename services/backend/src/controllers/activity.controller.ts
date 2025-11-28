import { Request, Response } from "express";
import { CommitModel } from "../models/commit.model";

export const getCommitTimeline = async (req: Request, res: Response) => {
  try {
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);

    const timeline = await CommitModel.aggregate([
      { $match: { timestamp: { $gte: last30 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.json({ success: true, data: timeline });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};
