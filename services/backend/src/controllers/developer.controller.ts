import { Request, Response } from "express";
import { CommitModel } from "../models/commit.model";
import { UserModel } from "../models/user.model";

export const getDevelopers = async (req: Request, res: Response) => {
  try {
    const commits = await CommitModel.aggregate([
      {
        $group: {
          _id: "$authorGithubId",
          commits: { $sum: 1 },
        },
      },
    ]);

    const devList = await Promise.all(
      commits.map(async (d) => {
        const user = await UserModel.findOne({ login: d._id });

        return {
          githubId: d._id,
          commits: d.commits,
          name: user?.name || d._id,
          avatarUrl: user?.avatarUrl,
        };
      })
    );

    return res.json({ success: true, data: devList });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};
