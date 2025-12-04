"use client";

import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import CommitLineChart from "../../../components/Charts/CommitLineChart";
import { Card } from "../../../components/Ui/Card";

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
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">Team Activity</h1>
          <p className="mt-1 text-sm text-slate-500">
            Trends and cadence from recent commits.
          </p>
        </header>

        {loading ? (
          <Card className="rounded-2xl border-0 bg-white p-6 text-sm text-slate-500 shadow-md">
            Loading timeline…
          </Card>
        ) : timeline.length === 0 ? (
          <Card className="rounded-2xl border-0 bg-white p-6 text-sm text-slate-500 shadow-md">
            No commit activity recorded in the last 30 days.
          </Card>
        ) : (
          <Card className="rounded-2xl border-0 bg-white p-6 shadow-md">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Commits Timeline</h2>
                <p className="text-sm text-slate-500">Past 30 days of activity</p>
              </div>
            </div>
            <div className="mt-6 h-64">
              <CommitLineChart
                data={timeline.map((commit) => ({
                  _id: commit.date,
                  total: commit.count,
                  ...commit,
                }))}
              />
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
