"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  GitCommit,
  GitPullRequest,
  Users,
} from "lucide-react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { api } from "../../lib/api";
import { useLiveStore } from "../../store/liveStore";
import { Card } from "../../components/Ui/Card";
import CommitLineChart from "../../components/Charts/CommitLineChart";
import PRRiskBarChart from "../../components/Charts/PRRiskBarChart";

type Stats = {
  kpis: {
    commits: number;
    openPRs: number;
    activeDevs: number;
    avgPRTimeHours: number | string;
  };
};

type TimelineEntry = {
  date: string;
  count: number;
};

type RiskBucket = { label: string; count: number };

type PRStatusSummary = {
  open: number;
  review: number;
  merged: number;
};

const emptyStatus: PRStatusSummary = { open: 0, review: 0, merged: 0 };

export default function DashboardPage() {
  const [missingOrg, setMissingOrg] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [riskBuckets, setRiskBuckets] = useState<RiskBucket[]>([]);
  const [prStatusCounts, setPrStatusCounts] = useState<PRStatusSummary>(emptyStatus);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);

  const { lastEvent } = useLiveStore();
  const router = useRouter();

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/");
        setStats(null);
        setTimeline([]);
        setRiskBuckets([]);
        setPrStatusCounts(emptyStatus);
        setMissingOrg(false);
        setLoading(false);
        return;
      }

      const orgId = localStorage.getItem("orgId");
      if (!orgId) {
        setMissingOrg(true);
        setLoading(false);
        return;
      }

      setMissingOrg(false);
      setLoading(true);

      const [dashRes, timelineRes, prsRes] = await Promise.all([
        api.get(`/orgs/${orgId}/dashboard`),
        api.get("/activity/commits"),
        api.get("/prs"),
      ]);

      setStats(dashRes.data.data);
      setTimeline(timelineRes.data.data);

      const prs = prsRes.data?.data?.items || [];
      const buckets: RiskBucket[] = [
        { label: "0–0.3", count: 0 },
        { label: "0.3–0.6", count: 0 },
        { label: "0.6–1.0", count: 0 },
      ];

      type PR = { riskScore?: number; state?: string | null };
      const statusSummary: PRStatusSummary = { ...emptyStatus };

      prs.forEach((p: PR) => {
        const r = p.riskScore ?? 0;
        if (r < 0.3) buckets[0].count += 1;
        else if (r < 0.6) buckets[1].count += 1;
        else buckets[2].count += 1;

        const state = (p.state || "").toLowerCase();
        if (state === "open") statusSummary.open += 1;
        else if (state === "merged") statusSummary.merged += 1;
        else statusSummary.review += 1;
      });

      setRiskBuckets(buckets);
      setPrStatusCounts(statusSummary);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        router.replace("/login");
        setStats(null);
        setTimeline([]);
        setRiskBuckets([]);
        setPrStatusCounts(emptyStatus);
        setMissingOrg(false);
      }

      console.log("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type !== "PR_UPDATED" && lastEvent.type !== "NEW_ALERT") return;

    const now = Date.now();
    if (now - lastRefresh < 5000) return;

    loadData();
    setLastRefresh(now);
  }, [lastEvent]);

  const commitTrend = useMemo(() => {
    if (!timeline.length) return null;
    const recent = [...timeline].sort((a, b) => a.date.localeCompare(b.date));
    const lastFourteen = recent.slice(-14);
    if (lastFourteen.length < 14) return null;

    const previousSeven = lastFourteen.slice(0, 7);
    const latestSeven = lastFourteen.slice(7);

    const previousTotal = previousSeven.reduce((sum, entry) => sum + (entry.count || 0), 0);
    const latestTotal = latestSeven.reduce((sum, entry) => sum + (entry.count || 0), 0);

    if (!previousTotal) return null;

    const change = ((latestTotal - previousTotal) / previousTotal) * 100;
    return Number.isFinite(change) ? change : null;
  }, [timeline]);

  const renderTrendBadge = (trend?: number | null) => {
    if (trend === null || trend === undefined) {
      return <p className="mt-4 text-xs text-slate-500">Last 7 days</p>;
    }

    const isPositive = trend >= 0;
    const value = Math.abs(trend).toFixed(1);

    return (
      <span
        className={`mt-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
          isPositive
            ? "bg-emerald-50 text-emerald-600"
            : "bg-rose-50 text-rose-600"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="h-3.5 w-3.5" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5" />
        )}
        {value}% {isPositive ? "increase" : "decrease"}
      </span>
    );
  };

  if (loading || !stats) {
    if (missingOrg) {
      return (
        <DashboardLayout>
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm">
            <p className="font-medium">No organization selected.</p>
            <p className="mt-2">
              Visit the <a href="/organization" className="text-indigo-600 underline">organization page</a> to create or choose one before viewing the dashboard.
            </p>
          </div>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout>
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">Loading dashboard…</div>
      </DashboardLayout>
    );
  }

  const avgMergeTimeRaw = Number(stats.kpis.avgPRTimeHours);
  const avgMergeTime = Number.isFinite(avgMergeTimeRaw)
    ? avgMergeTimeRaw
    : Number.parseFloat(`${stats.kpis.avgPRTimeHours}`) || 0;

  const statCards = [
    {
      label: "Weekly Commits",
      value: stats.kpis.commits,
      icon: GitCommit,
      trend: commitTrend,
      helper: "Activity captured from the last 7 days",
    },
    {
      label: "Open PRs",
      value: stats.kpis.openPRs,
      icon: GitPullRequest,
      trend: null,
      helper: "Awaiting review or merge",
    },
    {
      label: "Team Members",
      value: stats.kpis.activeDevs,
      icon: Users,
      trend: null,
      helper: "Active contributors this week",
    },
    {
      label: "Active Alerts",
      value: riskBuckets[riskBuckets.length - 1]?.count ?? 0,
      icon: AlertCircle,
      trend: null,
      helper: "High-risk pull requests this week",
    },
  ];

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Real-time team activity and metrics</p>
      </header>

      <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, trend, helper }) => (
          <Card key={label} className="rounded-2xl border-0 bg-white p-6 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Icon className="h-5 w-5" />
              </span>
            </div>
            {trend !== null ? renderTrendBadge(trend) : <p className="mt-4 text-xs text-slate-500">{helper}</p>}
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-0 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Weekly Activity</h2>
              <p className="text-sm text-slate-500">Commit trend for the past month</p>
            </div>
          </div>
          <div className="mt-6 h-64">
            {timeline.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
                No commit activity recorded yet.
              </div>
            ) : (
              <CommitLineChart
                data={timeline.map((entry) => ({
                  _id: entry.date,
                  total: entry.count,
                  ...entry,
                }))}
              />
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border-0 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">PR Status</h2>
              <p className="text-sm text-slate-500">Snapshot of current pipeline</p>
            </div>
          </div>

          <ul className="mt-6 space-y-4 text-sm">
            {[{ label: "Open", value: prStatusCounts.open }, { label: "Review", value: prStatusCounts.review }, { label: "Merged", value: prStatusCounts.merged }].map((item) => (
              <li key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-600">{item.label}</span>
                <span className="text-lg font-semibold text-slate-900">{item.value}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-indigo-700">
            Average merge time is {avgMergeTime ? `${avgMergeTime}h` : "not yet available"}. Keep reviews flowing to reduce backlog.
          </div>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6">
        <Card className="rounded-2xl border-0 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">PR Risk Distribution</h2>
              <p className="text-sm text-slate-500">Breakdown of pull requests by risk score</p>
            </div>
          </div>
          <div className="mt-6">
            <PRRiskBarChart data={riskBuckets} />
          </div>
        </Card>
      </section>
    </DashboardLayout>
  );
}
