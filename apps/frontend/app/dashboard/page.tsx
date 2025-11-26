"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { api } from "../../lib/api";
import { useLiveStore } from "../../store/liveStore"; 

export default function DashboardPage() {
  type Stats = {
    kpis: {
      commits: number;
      openPRs: number;
      activeDevs: number;
      avgPRTimeHours: number;
    };
  };

  const [stats, setStats] = useState<Stats | null>(null);

  const { lastEvent } = useLiveStore();

  const loadStats = () => {
    const orgId = localStorage.getItem("orgId");
    if (!orgId) return;

    api.get(`/orgs/${orgId}/dashboard`)
      .then((res) => setStats(res.data.data))
      .catch(() => {});
  };

  // initial load
  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "PR_UPDATED" || lastEvent.type === "NEW_ALERT") {
      loadStats();
    }
  }, [lastEvent]);

  if (!stats) return <DashboardLayout>Loading...</DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded">
          Commits: {stats.kpis.commits}
        </div>
        <div className="p-4 bg-white border rounded">
          PRs: {stats.kpis.openPRs}
        </div>
        <div className="p-4 bg-white border rounded">
          Active Devs: {stats.kpis.activeDevs}
        </div>
        <div className="p-4 bg-white border rounded">
          Avg PR Time: {stats.kpis.avgPRTimeHours}h
        </div>
      </div>
    </DashboardLayout>
  );
}
