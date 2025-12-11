import { Request, Response } from "express";
import { Types } from "mongoose";
import { RepoModel } from "../models/repo.model";
import { CommitModel } from "../models/commit.model";
import { PRModel } from "../models/pr.model";
import { AlertModel } from "../models/alert.model";
import { UserModel } from "../models/user.model";

export const getRepos = async (req: Request, res: Response) => {
  try {
    const orgIdParam = req.params.orgId;
    if (!orgIdParam || !Types.ObjectId.isValid(orgIdParam)) {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: "Invalid organization identifier" },
        });
    }

    const orgObjectId = new Types.ObjectId(orgIdParam);

    const rawRepos = await RepoModel.find({
      orgId: orgObjectId,
    }).lean();

    if (!rawRepos.length) {
      return res.json({ success: true, data: [] });
    }

    const reposMap = new Map<string, any>();
    const legacyRepoIds: Types.ObjectId[] = [];

    for (const repo of rawRepos) {
      const repoId = String(repo._id);
      reposMap.set(repoId, repo);

      if (typeof (repo as any)?.orgId === "string") {
        legacyRepoIds.push(new Types.ObjectId(String(repo._id)));
        (repo as any).orgId = orgObjectId;
      }
    }

    if (legacyRepoIds.length > 0) {
      await RepoModel.updateMany(
        { _id: { $in: legacyRepoIds } },
        { orgId: orgObjectId }
      );
    }

    const repos = Array.from(reposMap.values());

    const repoIds = repos.map((repo: any) => repo._id);

    const [commitAgg, prAgg, alertsAgg] = await Promise.all([
      CommitModel.aggregate([
        { $match: { repoId: { $in: repoIds } } },
        {
          $group: {
            _id: "$repoId",
            commits: { $sum: 1 },
            contributors: { $addToSet: "$authorGithubId" },
            latestCommit: { $max: "$timestamp" },
          },
        },
      ]),
      PRModel.aggregate([
        { $match: { repoId: { $in: repoIds } } },
        {
          $group: {
            _id: "$repoId",
            prs: { $sum: 1 },
            openPRs: {
              $sum: {
                $cond: [{ $eq: ["$state", "open"] }, 1, 0],
              },
            },
            highRiskPRs: {
              $sum: {
                $cond: [{ $gt: ["$riskScore", 0.6] }, 1, 0],
              },
            },
          },
        },
      ]),
      AlertModel.aggregate([
        { $match: { repoId: { $in: repoIds } } },
        {
          $group: {
            _id: "$repoId",
            alerts: { $sum: 1 },
            criticalAlerts: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$severity", "high"] },
                      { $eq: ["$severity", "critical"] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const commitMap = new Map(
      commitAgg.map((entry: any) => [String(entry._id), entry])
    );
    const prMap = new Map(
      prAgg.map((entry: any) => [String(entry._id), entry])
    );
    const alertMap = new Map(
      alertsAgg.map((entry: any) => [String(entry._id), entry])
    );

    const response = repos.map((repo: any) => {
      const repoId = String(repo._id);
      const commitStats = commitMap.get(repoId);
      const prStats = prMap.get(repoId);
      const alertStats = alertMap.get(repoId);

      const totalCommits = commitStats?.commits ?? 0;
      const totalPRs = prStats?.prs ?? 0;
      const contributors = Array.isArray(commitStats?.contributors)
        ? commitStats.contributors.filter((value: any) => Boolean(value)).length
        : 0;
      const openPRs = prStats?.openPRs ?? 0;
      const highRiskPRs = prStats?.highRiskPRs ?? 0;
      const totalAlerts = alertStats?.alerts ?? 0;
      const criticalAlerts = alertStats?.criticalAlerts ?? 0;

      const health = (() => {
        if (criticalAlerts > 0 || highRiskPRs > 3) return "warning";
        if (openPRs > 10) return "attention";
        return "healthy";
      })();

      return {
        id: repoId,
        name: repo.name,
        provider: repo.provider,
        url: repo.url,
        language:
          typeof (repo as any)?.language === "string"
            ? (repo as any).language
            : typeof (repo as any)?.metadata?.primaryLanguage === "string"
            ? (repo as any).metadata.primaryLanguage
            : undefined,
        description:
          typeof (repo as any)?.description === "string"
            ? (repo as any).description
            : typeof (repo as any)?.metadata?.description === "string"
            ? (repo as any).metadata.description
            : "",
        health,
        stats: {
          commits: totalCommits,
          prs: totalPRs,
          contributors,
          openPRs,
          highRiskPRs,
        },
        alerts: {
          total: totalAlerts,
          critical: criticalAlerts,
        },
        updatedAt: commitStats?.latestCommit ?? repo.updatedAt,
      };
    });

    return res.json({ success: true, data: response });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

export const getRepoDetail = async (req: Request, res: Response) => {
  try {
    const { orgId, repoId } = req.params;

    if (!repoId || !Types.ObjectId.isValid(repoId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid repository identifier" });
    }

    if (!orgId || !Types.ObjectId.isValid(orgId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid organization identifier" });
    }

    const repoObjectId = new Types.ObjectId(repoId);
    const orgObjectId = new Types.ObjectId(orgId);

    const repoDoc = await RepoModel.findOne({
      _id: repoObjectId,
      orgId: orgObjectId,
    }).lean();
    if (!repoDoc) {
      return res
        .status(404)
        .json({ success: false, error: "Repository not found" });
    }

    const now = new Date();
    const last7 = new Date(now);
    last7.setDate(last7.getDate() - 7);

    const prev14 = new Date(now);
    prev14.setDate(prev14.getDate() - 14);

    const computeChange = (
      current: number | null | undefined,
      previous: number | null | undefined
    ) => {
      const currentValue = typeof current === "number" ? current : 0;
      const previousValue = typeof previous === "number" ? previous : 0;

      if (!previousValue && !currentValue) {
        return 0;
      }

      if (!previousValue) {
        return currentValue > 0 ? 100 : 0;
      }

      return Number(
        (((currentValue - previousValue) / previousValue) * 100).toFixed(1)
      );
    };

    const [
      totalCommits,
      commitsLast7,
      commitsPrev7,
      openPRs,
      prsCreatedLast7,
      prsCreatedPrev7,
      contributorIds,
      contributorLast7Ids,
      contributorPrev7Ids,
      churnCurrentAgg,
      churnPrevAgg,
      topCommitters,
      prCounts,
      recentPRDocs,
      alertAgg,
      highRiskOpenPRs,
    ] = await Promise.all([
      CommitModel.countDocuments({ repoId: repoObjectId }),
      CommitModel.countDocuments({
        repoId: repoObjectId,
        timestamp: { $gte: last7 },
      }),
      CommitModel.countDocuments({
        repoId: repoObjectId,
        timestamp: { $gte: prev14, $lt: last7 },
      }),
      PRModel.countDocuments({ repoId: repoObjectId, state: "open" }),
      PRModel.countDocuments({
        repoId: repoObjectId,
        createdAt: { $gte: last7 },
      }),
      PRModel.countDocuments({
        repoId: repoObjectId,
        createdAt: { $gte: prev14, $lt: last7 },
      }),
      CommitModel.distinct("authorGithubId", {
        repoId: repoObjectId,
        authorGithubId: { $ne: null },
      }),
      CommitModel.distinct("authorGithubId", {
        repoId: repoObjectId,
        authorGithubId: { $ne: null },
        timestamp: { $gte: last7 },
      }),
      CommitModel.distinct("authorGithubId", {
        repoId: repoObjectId,
        authorGithubId: { $ne: null },
        timestamp: { $gte: prev14, $lt: last7 },
      }),
      CommitModel.aggregate([
        {
          $match: {
            repoId: repoObjectId,
            timestamp: { $gte: last7 },
          },
        },
        {
          $group: {
            _id: null,
            additions: { $sum: { $ifNull: ["$additions", 0] } },
            deletions: { $sum: { $ifNull: ["$deletions", 0] } },
          },
        },
      ]),
      CommitModel.aggregate([
        {
          $match: {
            repoId: repoObjectId,
            timestamp: { $gte: prev14, $lt: last7 },
          },
        },
        {
          $group: {
            _id: null,
            additions: { $sum: { $ifNull: ["$additions", 0] } },
            deletions: { $sum: { $ifNull: ["$deletions", 0] } },
          },
        },
      ]),
      CommitModel.aggregate([
        {
          $match: {
            repoId: repoObjectId,
            authorGithubId: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$authorGithubId",
            commits: { $sum: 1 },
          },
        },
        { $sort: { commits: -1 } },
        { $limit: 5 },
      ]),
      PRModel.aggregate([
        {
          $match: {
            repoId: repoObjectId,
            authorGithubId: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$authorGithubId",
            prs: { $sum: 1 },
          },
        },
      ]),
      PRModel.find({ repoId: repoObjectId })
        .sort({ updatedAt: -1 })
        .limit(15)
        .select(
          "title number state authorGithubId reviewers updatedAt createdAt mergedAt closedAt riskScore"
        )
        .lean(),
      AlertModel.aggregate([
        {
          $match: {
            repoId: repoObjectId,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            open: {
              $sum: {
                $cond: [
                  { $eq: [{ $ifNull: ["$resolvedAt", null] }, null] },
                  1,
                  0,
                ],
              },
            },
            criticalOpen: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: [{ $ifNull: ["$resolvedAt", null] }, null] },
                      {
                        $or: [
                          { $eq: ["$severity", "high"] },
                          { $eq: ["$severity", "critical"] },
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      PRModel.countDocuments({
        repoId: repoObjectId,
        state: "open",
        riskScore: { $gt: 0.6 },
      }),
    ]);

    const churnCurrentTotals =
      Array.isArray(churnCurrentAgg) && churnCurrentAgg[0]
        ? churnCurrentAgg[0]
        : { additions: 0, deletions: 0 };
    const churnPrevTotals =
      Array.isArray(churnPrevAgg) && churnPrevAgg[0]
        ? churnPrevAgg[0]
        : { additions: 0, deletions: 0 };

    const churnRateCurrent = (() => {
      const additions = Number(churnCurrentTotals.additions ?? 0);
      const deletions = Number(churnCurrentTotals.deletions ?? 0);
      const total = additions + deletions;
      if (!total) return 0;
      return Number(((deletions / total) * 100).toFixed(1));
    })();

    const churnRatePrev = (() => {
      const additions = Number(churnPrevTotals.additions ?? 0);
      const deletions = Number(churnPrevTotals.deletions ?? 0);
      const total = additions + deletions;
      if (!total) return 0;
      return Number(((deletions / total) * 100).toFixed(1));
    })();

    const contributorCount = Array.isArray(contributorIds)
      ? contributorIds.filter((value) => Boolean(value)).length
      : 0;
    const contributorLast7Count = Array.isArray(contributorLast7Ids)
      ? contributorLast7Ids.filter((value) => Boolean(value)).length
      : 0;
    const contributorPrev7Count = Array.isArray(contributorPrev7Ids)
      ? contributorPrev7Ids.filter((value) => Boolean(value)).length
      : 0;

    const prCountMap = new Map<string, number>();
    prCounts.forEach((entry: any) => {
      if (!entry?._id) return;
      prCountMap.set(String(entry._id), entry.prs ?? 0);
    });

    const userIds = new Set<string>();
    topCommitters.forEach((entry: any) => {
      if (entry?._id) {
        userIds.add(String(entry._id));
      }
    });
    prCounts.forEach((entry: any) => {
      if (entry?._id) {
        userIds.add(String(entry._id));
      }
    });
    recentPRDocs.forEach((pr: any) => {
      if (pr?.authorGithubId) {
        userIds.add(String(pr.authorGithubId));
      }
    });

    const users = userIds.size
      ? await UserModel.find({ githubId: { $in: Array.from(userIds) } })
          .select("githubId name login avatarUrl")
          .lean()
      : [];

    const userMap = new Map(
      users.map((user: any) => [String(user.githubId), user])
    );

    const topContributors = topCommitters.map((entry: any) => {
      const githubId = entry?._id ? String(entry._id) : undefined;
      const user = githubId ? userMap.get(githubId) : null;

      const displayName = user?.name || user?.login || githubId || "Unknown";

      return {
        githubId,
        name: displayName,
        commits: entry?.commits ?? 0,
        prs: githubId ? prCountMap.get(githubId) ?? 0 : 0,
      };
    });

    const alertsSummary =
      Array.isArray(alertAgg) && alertAgg[0]
        ? {
            total: alertAgg[0].total ?? 0,
            open: alertAgg[0].open ?? 0,
            criticalOpen: alertAgg[0].criticalOpen ?? 0,
          }
        : { total: 0, open: 0, criticalOpen: 0 };

    const health = (() => {
      if (alertsSummary.criticalOpen > 0 || highRiskOpenPRs > 3)
        return "warning" as const;
      if (openPRs > 10 || alertsSummary.open > 5) return "attention" as const;
      return "healthy" as const;
    })();

    const resolveLanguage = () => {
      if (typeof (repoDoc as any)?.language === "string")
        return (repoDoc as any).language;
      if (typeof (repoDoc as any)?.metadata?.primaryLanguage === "string") {
        return (repoDoc as any).metadata.primaryLanguage;
      }
      return undefined;
    };

    const resolveDescription = () => {
      if (typeof (repoDoc as any)?.metadata?.description === "string") {
        return (repoDoc as any).metadata.description;
      }
      if (typeof (repoDoc as any)?.description === "string") {
        return (repoDoc as any).description;
      }
      return "";
    };

    const metrics = {
      totalCommits: {
        value: totalCommits ?? 0,
        change: computeChange(commitsLast7, commitsPrev7),
      },
      openPRs: {
        value: openPRs ?? 0,
        change: computeChange(prsCreatedLast7, prsCreatedPrev7),
      },
      contributors: {
        value: contributorCount,
        change: computeChange(contributorLast7Count, contributorPrev7Count),
      },
      churnRate: {
        value: churnRateCurrent,
        change: computeChange(churnRateCurrent, churnRatePrev),
      },
    };

    const pullRequests = recentPRDocs.map((pr: any) => {
      const githubId = pr?.authorGithubId
        ? String(pr.authorGithubId)
        : undefined;
      const user = githubId ? userMap.get(githubId) : null;

      return {
        id: String(pr?._id ?? pr?.number ?? Math.random()),
        number: pr?.number ?? null,
        title: pr?.title || "Pull request",
        authorName: user?.name || user?.login || githubId || "Unknown",
        authorId: githubId,
        risk:
          typeof pr?.riskScore === "number"
            ? Number((pr.riskScore * 100).toFixed(0))
            : 0,
        state: pr?.state || "open",
        reviewers: Array.isArray(pr?.reviewers) ? pr.reviewers.length : 0,
        updatedAt: pr?.updatedAt || pr?.createdAt || null,
      };
    });

    return res.json({
      success: true,
      data: {
        repo: {
          id: String(repoDoc._id),
          name: repoDoc.name,
          description: resolveDescription(),
          url: repoDoc.url,
          language: resolveLanguage(),
          provider: repoDoc.provider,
          health,
          alerts: alertsSummary,
          updatedAt: (repoDoc as any)?.updatedAt ?? null,
        },
        metrics,
        topContributors,
        pullRequests,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to load repository" });
  }
};
