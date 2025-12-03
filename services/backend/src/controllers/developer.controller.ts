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

    const githubIds = commits.map((c) => c._id);

    const users = await UserModel.find({ githubId: { $in: githubIds } })
      .select("githubId name avatarUrl")
      .lean();

    const userMap = new Map(users.map((u: any) => [u.githubId, u]));

    const devList = commits.map((d) => {
      const user = userMap.get(d._id);

      return {
        githubId: d._id,
        commits: d.commits,
        name: user?.name || d._id,
        avatarUrl: user?.avatarUrl,
      };
    });

    return res.json({ success: true, data: devList });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};
