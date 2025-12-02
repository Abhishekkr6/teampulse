"use client";

import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import CommitLineChart from "../../../components/Charts/CommitLineChart";

type Commit = {
  date: string;
  count: number;
};

export default function ActivityPage() {
  const [timeline, setTimeline] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/activity/commits").then((res) => {
      setTimeline(res.data.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout>
      <h1 className="text-xl font-bold mb-6">Team Activity</h1>

      {loading ? (
        <div className="text-gray-500">Loading timeline…</div>
      ) : timeline.length === 0 ? (
        <div className="text-gray-500 text-sm">
          No commit activity found in the last 30 days.
        </div>
      ) : (
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Commits Timeline (30 days)</h2>
          <CommitLineChart
            data={timeline.map((commit) => ({
              _id: commit.date,
              total: commit.count,
              ...commit,
            }))}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
