import { Request, Response } from "express";
import { CommitModel } from "../models/commit.model";
import { PRModel } from "../models/pr.model";
import { RepoModel } from "../models/repo.model";
import { UserModel } from "../models/user.model";

export const getDeveloperDetail = async (req: Request, res: Response) => {
  try {
    const { githubId } = req.params;

    const user = await UserModel.findOne({ githubId }).lean();

    const now = new Date();
    const last30 = new Date(now);
    last30.setDate(last30.getDate() - 30);

    const last7 = new Date(now);
    last7.setDate(last7.getDate() - 7);

    const prev14 = new Date(now);
    prev14.setDate(prev14.getDate() - 14);

    const last180 = new Date(now);
    last180.setDate(last180.getDate() - 180);

    const [
      totalCommits,
      totalPRs,
      highRiskPRs,
      commitsLast7,
      commitsPrev7,
      prsLast7,
      prsPrev7,
      recentCommits,
      prDocs,
      repoAgg,
      commitHeatmap,
      globalWeeklyMax,
    ] = await Promise.all([
      CommitModel.countDocuments({ authorGithubId: githubId }),
      PRModel.countDocuments({ authorGithubId: githubId }),
      PRModel.countDocuments({ authorGithubId: githubId, riskScore: { $gt: 0.6 } }),
      CommitModel.countDocuments({ authorGithubId: githubId, timestamp: { $gte: last7 } }),
      CommitModel.countDocuments({ authorGithubId: githubId, timestamp: { $gte: prev14, $lt: last7 } }),
      PRModel.countDocuments({ authorGithubId: githubId, createdAt: { $gte: last7 } }),
      PRModel.countDocuments({ authorGithubId: githubId, createdAt: { $gte: prev14, $lt: last7 } }),
      CommitModel.find({ authorGithubId: githubId })
        .sort({ timestamp: -1 })
        .limit(25)
        .lean(),
      PRModel.find({
        $or: [
          { authorGithubId: githubId },
          { "reviewers": { $exists: true, $ne: [] } },
        ],
        updatedAt: { $gte: last30 },
      })
        .sort({ updatedAt: -1 })
        .limit(100)
        .select("authorGithubId reviewers createdAt mergedAt updatedAt number title repoId state")
        .lean(),
      CommitModel.aggregate([
        {
          $match: {
            authorGithubId: githubId,
            timestamp: { $gte: last90Date() },
          },
        },
        {
          $group: {
            _id: "$repoId",
            commits: { $sum: 1 },
          },
        },
        { $sort: { commits: -1 } },
        { $limit: 5 },
      ]),
      CommitModel.aggregate([
        {
          $match: {
            authorGithubId: githubId,
            timestamp: { $gte: last180 },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
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
        { $sort: { commits: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const maxWeeklyCommits = Array.isArray(globalWeeklyMax) && globalWeeklyMax[0]?.commits
      ? globalWeeklyMax[0].commits
      : commitsLast7 || 0;

    const weeklyActivity = maxWeeklyCommits
      ? Math.min(Math.round((commitsLast7 / maxWeeklyCommits) * 100), 100)
      : 0;

    const computeChange = (current: number, previous: number) => {
      if (!previous) {
        return current > 0 ? 100 : 0;
      }
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const reviewerMatches = (reviewer: any) => {
      if (!reviewer) return false;
      if (typeof reviewer === "string") return reviewer.toLowerCase() === githubId.toLowerCase();
      if (typeof reviewer?.login === "string") return reviewer.login.toLowerCase() === githubId.toLowerCase();
      if (typeof reviewer?.githubId === "string") return reviewer.githubId.toLowerCase() === githubId.toLowerCase();
      return false;
    };

    const reviewEvents = prDocs.filter((pr) => Array.isArray(pr.reviewers) && pr.reviewers.some(reviewerMatches));

    const reviewsLast7 = reviewEvents.filter((pr) => pr.updatedAt && pr.updatedAt >= last7).length;
    const reviewsPrev7 = reviewEvents.filter((pr) => pr.updatedAt && pr.updatedAt >= prev14 && pr.updatedAt < last7).length;
    const totalReviews = reviewEvents.length;

    const authoredMergedPRs = prDocs.filter((pr) => pr.authorGithubId === githubId && pr.mergedAt);
    const avgReviewTimeHours = authoredMergedPRs.length
      ? Number(
          (
            authoredMergedPRs
              .map((pr) => {
                const end = pr.mergedAt ? new Date(pr.mergedAt).getTime() : new Date(pr.updatedAt ?? pr.createdAt ?? now).getTime();
                const start = pr.createdAt ? new Date(pr.createdAt).getTime() : end;
                return Math.max((end - start) / (1000 * 60 * 60), 0);
              })
              .reduce((sum, val) => sum + val, 0) / authoredMergedPRs.length
          ).toFixed(1)
        )
      : null;

    const avgReviewPrev = (() => {
      const prevWindow = authoredMergedPRs.filter((pr) => pr.mergedAt && pr.mergedAt >= prev14 && pr.mergedAt < last7);
      if (!prevWindow.length) return null;
      const totalHours = prevWindow.reduce((sum, pr) => {
        const end = pr.mergedAt ? new Date(pr.mergedAt).getTime() : new Date(pr.updatedAt ?? pr.createdAt ?? now).getTime();
        const start = pr.createdAt ? new Date(pr.createdAt).getTime() : end;
        return sum + Math.max((end - start) / (1000 * 60 * 60), 0);
      }, 0);
      return totalHours / prevWindow.length;
    })();

    const avgReviewTrend = avgReviewTimeHours !== null && avgReviewPrev
      ? Number((((avgReviewTimeHours - avgReviewPrev) / avgReviewPrev) * 100).toFixed(1))
      : null;

    const repoIds = repoAgg
      .map((entry) => entry?._id)
      .filter((id): id is any => Boolean(id));

    const repoDocs = repoIds.length
      ? await RepoModel.find({ _id: { $in: repoIds } })
          .select("name url")
          .lean()
      : [];

    const repoMap = new Map(repoDocs.map((repo) => [String(repo._id), repo]));

    const activeRepos = repoAgg.map((entry) => {
      const repoId = entry?._id ? String(entry._id) : null;
      const repo = repoId ? repoMap.get(repoId) : null;
      return {
        repoId,
        name: repo?.name || "Unknown repo",
        url: repo?.url,
        commits: entry?.commits ?? 0,
      };
    });

    const contributionActivity = commitHeatmap.map((point) => ({
      date: point?._id,
      total: point?.total ?? 0,
    }));

    const buildCommitEvent = (commit: any) => ({
      id: commit?._id || commit?.sha,
      type: "commit" as const,
      title: commit?.message || "Commit update",
      repoId: commit?.repoId ? String(commit.repoId) : null,
      timestamp: commit?.timestamp || commit?.createdAt,
      metadata: {
        sha: commit?.sha,
      },
    });

    const buildPrEvent = (pr: any) => ({
      id: String(pr?._id ?? pr?.number ?? Math.random()),
      type: pr?.authorGithubId === githubId ? "pr" : "review",
      title: pr?.title || (pr?.authorGithubId === githubId ? "Pull request update" : "Review completed"),
      repoId: pr?.repoId ? String(pr.repoId) : null,
      timestamp: pr?.updatedAt ?? pr?.createdAt,
      metadata: {
        number: pr?.number,
        state: pr?.state,
      },
    });

    const recentActivity = [
      ...recentCommits.slice(0, 10).map(buildCommitEvent),
      ...prDocs.slice(0, 10).map(buildPrEvent),
    ]
      .filter((event) => event.timestamp)
      .sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime())
      .slice(0, 15);

    return res.json({
      success: true,
      data: {
        profile: user,
        stats: {
          totalCommits,
          totalPRs,
          highRiskPRs,
          reviews: totalReviews,
          avgReviewTimeHours,
          weeklyActivity,
          trends: {
            commits: computeChange(commitsLast7, commitsPrev7),
            prs: computeChange(prsLast7, prsPrev7),
            reviews: computeChange(reviewsLast7, reviewsPrev7),
            avgReviewTime: avgReviewTrend,
          },
        },
        activeRepos,
        contributionActivity,
        recentActivity,
        recentCommits,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to load developer" });
  }
};

function last90Date() {
  const date = new Date();
  date.setDate(date.getDate() - 90);
  return date;
}
