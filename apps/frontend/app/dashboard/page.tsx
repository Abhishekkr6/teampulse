"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { api } from "../../lib/api";
import { useLiveStore } from "../../store/liveStore";

// UI components
import { Card, CardTitle, CardValue } from "../../components/Ui/Card";
import CommitLineChart from "../../components/Charts/CommitLineChart";
import PRRiskBarChart from "../../components/Charts/PRRiskBarChart";

type Stats = {
  kpis: {
    commits: number;
    openPRs: number;
    activeDevs: number;
    avgPRTimeHours: number;
  };
};

export default function DashboardPage() {
  const [missingOrg, setMissingOrg] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  type TimelineEntry = {
    date: string;
    count: number;
    // Add more fields here if your timeline data has them
  };
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  type RiskBucket = { label: string; count: number };
  const [riskBuckets, setRiskBuckets] = useState<RiskBucket[]>([]);
  const [loading, setLoading] = useState(true);

  const { lastEvent } = useLiveStore();
  const router = useRouter();

  // -----------------------------
  // Fetch dashboard data
  // -----------------------------
  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        setStats(null);
        setTimeline([]);
        setRiskBuckets([]);
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

      // dashboard KPIs
      setStats(dashRes.data.data);

      // timeline
      setTimeline(timelineRes.data.data);

      // PR risk buckets
      const prs = prsRes.data.data || [];
      const buckets = [
        { label: "0–0.3", count: 0 },
        { label: "0.3–0.6", count: 0 },
        { label: "0.6–1.0", count: 0 },
      ];

      type PR = { riskScore?: number };
      prs.forEach((p: PR) => {
        const r = p.riskScore ?? 0;
        if (r < 0.3) buckets[0].count++;
        else if (r < 0.6) buckets[1].count++;
        else buckets[2].count++;
      });

      setRiskBuckets(buckets);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        router.replace("/login");
        setStats(null);
        setTimeline([]);
        setRiskBuckets([]);
        setMissingOrg(false);
      }

      console.log("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "PR_UPDATED" || lastEvent.type === "NEW_ALERT") {
      loadData(); // refresh instantly
    }
  }, [lastEvent]);

  // -----------------------------
  // Loading skeleton
  // -----------------------------
  if (loading || !stats) {
    if (missingOrg) {
      return (
        <DashboardLayout>
          <div className="p-6 space-y-2 text-sm text-gray-600">
            <p>No organization is selected.</p>
            <p>
              Visit the <a href="/organization" className="text-blue-600 underline">organization page</a> to create or choose one before viewing the dashboard.
            </p>
          </div>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout>
        <div className="p-4 text-gray-500 text-sm">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team Overview</h1>
        <span className="text-xs text-gray-500">Last 7 days summary</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardTitle>Commits (7d)</CardTitle>
          <CardValue>{stats.kpis.commits}</CardValue>
        </Card>

        <Card>
          <CardTitle>Active Developers</CardTitle>
          <CardValue>{stats.kpis.activeDevs}</CardValue>
        </Card>

        <Card>
          <CardTitle>Open PRs</CardTitle>
          <CardValue>{stats.kpis.openPRs}</CardValue>
        </Card>

        <Card>
          <CardTitle>Avg PR Merge Time</CardTitle>
          <CardValue>{stats.kpis.avgPRTimeHours}h</CardValue>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardTitle>Commit Activity (30 days)</CardTitle>
          {timeline.length === 0 ? (
            <div className="text-xs text-gray-500 p-3">No commit activity.</div>
          ) : (
            <CommitLineChart
              data={timeline.map((entry) => ({
                _id: entry.date,
                total: entry.count,
                ...entry,
              }))}
            />
          )}
        </Card>

        <Card>
          <CardTitle>PR Risk Distribution</CardTitle>
          <PRRiskBarChart data={riskBuckets} />
        </Card>
      </div>
    </DashboardLayout>
  );
}
