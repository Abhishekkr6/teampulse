import { Request, Response } from "express";
import { CommitModel } from "../models/commit.model";
import { PRModel } from "../models/pr.model";
import { UserModel } from "../models/user.model";

export const getDevelopers = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const last30 = new Date(now);
    last30.setDate(last30.getDate() - 30);

    const last7 = new Date(now);
    last7.setDate(last7.getDate() - 7);

    const [commits30Agg, commits7Agg, prAgg, reviewDocs] = await Promise.all([
      CommitModel.aggregate([
        {
          $match: {
            timestamp: { $gte: last30 },
            authorGithubId: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$authorGithubId",
            commits: { $sum: 1 },
          },
        },
      ]),
      CommitModel.aggregate([
        {
          $match: {
            timestamp: { $gte: last7 },
            authorGithubId: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$authorGithubId",
            commits: { $sum: 1 },
          },
        },
      ]),
      PRModel.aggregate([
        {
          $match: {
            authorGithubId: { $ne: null },
            createdAt: { $gte: last30 },
          },
        },
        {
          $group: {
            _id: "$authorGithubId",
            prs: { $sum: 1 },
          },
        },
      ]),
      PRModel.find({
        reviewers: { $exists: true, $ne: [] },
        updatedAt: { $gte: last30 },
      })
        .select("reviewers")
        .lean(),
    ]);

    const commit30Map = new Map<string, number>();
    commits30Agg.forEach((entry) => {
      if (!entry?._id) return;
      commit30Map.set(String(entry._id), entry.commits ?? 0);
    });

    const commit7Map = new Map<string, number>();
    commits7Agg.forEach((entry) => {
      if (!entry?._id) return;
      commit7Map.set(String(entry._id), entry.commits ?? 0);
    });

    const prMap = new Map<string, number>();
    prAgg.forEach((entry) => {
      if (!entry?._id) return;
      prMap.set(String(entry._id), entry.prs ?? 0);
    });

    const reviewMap = new Map<string, number>();
    reviewDocs.forEach((doc) => {
      const reviewers = Array.isArray(doc?.reviewers) ? doc.reviewers : [];
      reviewers.forEach((reviewer: any) => {
        const candidate =
          typeof reviewer === "string"
            ? reviewer
            : typeof reviewer?.login === "string"
            ? reviewer.login
            : typeof reviewer?.githubId === "string"
            ? reviewer.githubId
            : undefined;

        if (!candidate) return;
        const key = String(candidate);
        reviewMap.set(key, (reviewMap.get(key) ?? 0) + 1);
      });
    });

    const allIds = new Set<string>();
    [commit30Map, commit7Map, prMap, reviewMap].forEach((map) => {
      Array.from(map.keys()).forEach((id) => {
        if (id) allIds.add(id);
      });
    });

    const developerIds = Array.from(allIds);

    const users = developerIds.length
      ? await UserModel.find({ githubId: { $in: developerIds } })
          .select("githubId name login avatarUrl role")
          .lean()
      : [];

    const userMap = new Map(users.map((u: any) => [String(u.githubId), u]));

    const maxWeeklyCommits = developerIds.reduce((max, id) => {
      const count = commit7Map.get(id) ?? 0;
      return count > max ? count : max;
    }, 0);

    const resolveFallbackAvatar = (githubId: string | undefined) => {
      if (!githubId) return undefined;
      const isNumeric = !Number.isNaN(Number(githubId));
      return isNumeric
        ? `https://avatars.githubusercontent.com/u/${githubId}`
        : `https://github.com/${githubId}.png`;
    };

    const devList = developerIds
      .map((githubId) => {
        const user = userMap.get(githubId);
        const commits = commit30Map.get(githubId) ?? 0;
        const weeklyCommits = commit7Map.get(githubId) ?? 0;
        const prs = prMap.get(githubId) ?? 0;
        const reviews = reviewMap.get(githubId) ?? 0;

        const weeklyActivity = maxWeeklyCommits
          ? Math.min(Math.round((weeklyCommits / maxWeeklyCommits) * 100), 100)
          : 0;

        return {
          githubId,
          name: user?.name || user?.login || githubId,
          avatarUrl: user?.avatarUrl || resolveFallbackAvatar(githubId),
          role: user?.role || "dev",
          weeklyActivity,
          commits,
          prs,
          reviews,
        };
      })
      .sort((a, b) => b.weeklyActivity - a.weeklyActivity || b.commits - a.commits);

    return res.json({ success: true, data: devList });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};
