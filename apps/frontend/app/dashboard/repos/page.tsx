"use client";

import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Card } from "../../../components/Ui/Card";

type Repo = {
  _id: string;
  name: string;
  provider: string;
  url: string;
};

export default function ReposPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orgId = localStorage.getItem("orgId");
    if (!orgId) return;

    api.get(`/orgs/${orgId}/repos`).then((res) => {
      setRepos(res.data.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">Connected Repositories</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the source repos powering your insights.
          </p>
        </header>

        {loading ? (
          <Card className="rounded-2xl border-0 bg-white p-6 text-sm text-slate-500 shadow-md">
            Loading repositories…
          </Card>
        ) : repos.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 shadow-none">
            No repositories connected yet. Navigate to the Organization section to add your first repository.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {repos.map((r) => (
              <Card
                key={r._id}
                className="rounded-2xl border-0 bg-white p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="text-base font-semibold text-slate-900">{r.name}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">{r.provider}</div>
                <a
                  href={r.url}
                  target="_blank"
                  className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 hover:underline"
                >
                  View on GitHub →
                </a>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
