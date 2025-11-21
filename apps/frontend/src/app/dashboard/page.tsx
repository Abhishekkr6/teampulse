"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { api } from "../../../lib/api";

type Stats = {
  kpis?: {
    commits?: number;
    openPRs?: number;
    activeDevs?: number;
    avgPRTimeHours?: number;
  };
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api
      .get("/orgs/<your-org-id>/dashboard") // we replace after org creation
      .then((res) => setStats(res.data.data))
      .catch(() => {});
  }, []);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded">Commits: {stats?.kpis?.commits}</div>
        <div className="p-4 bg-white border rounded">PRs: {stats?.kpis?.openPRs}</div>
        <div className="p-4 bg-white border rounded">Dev Active: {stats?.kpis?.activeDevs}</div>
        <div className="p-4 bg-white border rounded">Avg PR Time: {stats?.kpis?.avgPRTimeHours}h</div>
      </div>
    </DashboardLayout>
  );
}
