"use client";

import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

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
      <h1 className="text-xl font-bold mb-6">Connected Repositories</h1>

      {loading ? (
        <div className="text-gray-500">Loading repositories…</div>
      ) : repos.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-700 p-4 rounded">
          No repositories connected yet.
          <br />
          <span className="text-sm">Connect a repo from Organization → Repos.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.map((r) => (
            <div
              key={r._id}
              className="bg-white border rounded-xl p-4 shadow-sm hover:shadow transition"
            >
              <div className="font-semibold text-gray-800">{r.name}</div>
              <div className="text-xs text-gray-500 mt-1">{r.provider}</div>

              <a
                href={r.url}
                target="_blank"
                className="text-blue-600 text-sm mt-2 inline-block"
              >
                View on GitHub →
              </a>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
