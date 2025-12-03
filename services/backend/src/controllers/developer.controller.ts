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

    const githubIds = commits
      .map((c) => (c._id ? String(c._id) : null))
      .filter((id): id is string => Boolean(id));

    const users = await UserModel.find({ githubId: { $in: githubIds } })
      .select("githubId name avatarUrl")
      .lean();

    const userMap = new Map(users.map((u: any) => [String(u.githubId), u]));

    const devList = commits
      .filter((d) => Boolean(d._id))
      .map((d) => {
      const githubId = d._id ? String(d._id) : "";
      const user = userMap.get(githubId);

      const fallbackAvatar = (() => {
        if (!githubId) return undefined;
        const isNumeric = !Number.isNaN(Number(githubId));
        return isNumeric
          ? `https://avatars.githubusercontent.com/u/${githubId}`
          : `https://github.com/${githubId}.png`;
      })();

      return {
        githubId,
        commits: d.commits,
        name: user?.name || githubId,
        avatarUrl: user?.avatarUrl || fallbackAvatar,
      };
      });

    return res.json({ success: true, data: devList });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};
