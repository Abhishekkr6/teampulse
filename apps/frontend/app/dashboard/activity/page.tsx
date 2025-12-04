"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { api } from "../../../lib/api";
import { Card } from "../../../components/Ui/Card";
import { Badge } from "../../../components/Ui/Badge";
import {
  GitCommit,
  GitPullRequest,
  MessageSquare,
  Search,
} from "lucide-react";

type Commit = {
  date: string;
  count: number;
};

type PR = {
  _id?: string;
  number?: number;
  title?: string;
  state?: string;
  repoId?: string;
  createdAt?: string;
};

type ActivityEvent = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  timestamp: string;
  kind: "commit" | "pr" | "review";
};

export default function ActivityPage() {
  const [timeline, setTimeline] = useState<Commit[]>([]);
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const [timelineRes, prsRes] = await Promise.all([
          api.get("/activity/commits"),
          api.get("/prs"),
        ]);

        setTimeline(timelineRes.data?.data || []);
        setPrs(prsRes.data?.data?.items || []);
      } catch (err) {
        console.error("Activity load failed", err);
        setTimeline([]);
        setPrs([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, []);

  const formatTimeAgo = (input?: string) => {
    if (!input) return "Just now";
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return "Just now";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
  };

  const summary = useMemo(() => {
    const totalCommits = timeline.reduce((sum, commit) => sum + (commit.count ?? 0), 0);
    const openPrs = prs.filter((pr) => pr.state?.toLowerCase() === "open").length;
    const reviewPrs = prs.filter((pr) => pr.state?.toLowerCase() === "review").length;
    const mergedPrs = prs.filter((pr) => pr.state?.toLowerCase() === "merged").length;

    return {
      commits: totalCommits,
      prsOpened: openPrs || prs.length,
      reviews: reviewPrs || mergedPrs,
    };
  }, [timeline, prs]);

  const recentEvents = useMemo(() => {
    const commitEvents: ActivityEvent[] = timeline.slice(0, 5).map((commit) => ({
      id: `commit-${commit.date}`,
      title: `${commit.count} commit${commit.count === 1 ? "" : "s"} pushed`,
      subtitle: "Activity captured",
      tag: "commits",
      timestamp: commit.date,
      kind: "commit",
    }));

    const prEvents: ActivityEvent[] = prs.slice(0, 5).map((pr) => ({
      id: pr._id ?? `pr-${pr.number}`,
      title: pr.title || `Pull request #${pr.number ?? ""}`,
      subtitle:
        pr.state?.toLowerCase() === "merged"
          ? "Merged to main branch"
          : pr.state?.toLowerCase() === "open"
            ? "Opened for review"
            : `PR ${pr.state ?? "updated"}`,
      tag: pr.repoId ? `repo:${pr.repoId}` : "pull-requests",
      timestamp: pr.createdAt || new Date().toISOString(),
      kind: pr.state?.toLowerCase() === "review" ? "review" : "pr",
    }));

    return [...prEvents, ...commitEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, [timeline, prs]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Activity</h1>
          <p className="text-sm text-slate-500">
            Recent commits, pull requests, and reviews.
          </p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search activity..."
              className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              disabled
            />
          </div>
        </div>

        {loading ? (
          <Card className="rounded-2xl border-0 bg-white p-6 text-sm text-slate-500 shadow-md">
            Loading activity…
          </Card>
        ) : recentEvents.length === 0 ? (
          <Card className="rounded-2xl border-0 bg-white p-6 text-sm text-slate-500 shadow-md">
            No activity recorded yet. Once commits or pull requests are created they will appear here.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card className="rounded-2xl border-0 bg-white p-6 shadow-md">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                  <p className="text-sm text-slate-500">Latest updates from your team</p>
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  disabled
                >
                  View timeline
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {recentEvents.map((event) => {
                  const iconClasses = "h-10 w-10 flex items-center justify-center rounded-xl";
                  const baseIconStyles =
                    event.kind === "commit"
                      ? "bg-indigo-50 text-indigo-600"
                      : event.kind === "review"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600";

                  return (
                    <div
                      key={event.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <span className={`${iconClasses} ${baseIconStyles}`}>
                        {event.kind === "commit" && <GitCommit className="h-5 w-5" />}
                        {event.kind === "pr" && <GitPullRequest className="h-5 w-5" />}
                        {event.kind === "review" && <MessageSquare className="h-5 w-5" />}
                      </span>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm font-semibold text-slate-900">{event.title}</div>
                          <div className="text-xs text-slate-500">{formatTimeAgo(event.timestamp)}</div>
                        </div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">{event.subtitle}</p>
                        <Badge type={event.kind === "review" ? "success" : event.kind === "commit" ? "info" : "warning"}>
                          {event.tag}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="rounded-2xl border-0 bg-white p-6 shadow-md">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Weekly Summary</h2>
                <p className="text-sm text-slate-500">Snapshot of the last 7 days</p>
              </div>

              <div className="mt-6 space-y-5">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Commits</p>
                  <p className="text-3xl font-semibold text-slate-900">{summary.commits}</p>
                  <p className="text-xs text-slate-500">Total pushes captured</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">PRs opened</p>
                  <p className="text-3xl font-semibold text-slate-900">{summary.prsOpened}</p>
                  <p className="text-xs text-slate-500">Awaiting review or merge</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Reviews</p>
                  <p className="text-3xl font-semibold text-slate-900">{summary.reviews}</p>
                  <p className="text-xs text-slate-500">Feedback cycles completed</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
