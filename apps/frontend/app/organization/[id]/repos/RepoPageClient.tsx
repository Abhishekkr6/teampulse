"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../../lib/api";
import { Card } from "../../../../components/Ui/Card";
import { useUserStore } from "../../../../store/userStore";

type Repo = {
  _id: string;
  name: string;
};

export default function RepoPageClient({ orgId }: { orgId?: string }) {
  const [repoFullName, setRepoFullName] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);

  const setActiveOrgId = useUserStore((state) => state.setActiveOrgId);

  // ⭐ NEVER use localStorage for orgId
  const currentOrgId = orgId;

  useEffect(() => {
    if (currentOrgId) {
      setActiveOrgId(currentOrgId, { refetch: true });
    }
  }, [currentOrgId, setActiveOrgId]);

  const fetchRepos = useCallback(async () => {
    if (!currentOrgId) return;

    try {
      setLoading(true);
      const res = await api.get(`/orgs/${currentOrgId}/repos`);
      setRepos(res.data.data);
    } catch (err) {
      console.error("Repo load failed", err);
    } finally {
      setLoading(false);
    }
  }, [currentOrgId]);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const connectRepo = async () => {
    const trimmed = repoFullName.trim();

    if (!currentOrgId) {
      console.warn("Missing orgId while attempting to connect repo");
      return;
    }

    if (!trimmed.includes("/")) {
      alert("Invalid repo format. Use owner/repo");
      return;
    }

    await api.post(`/orgs/${currentOrgId}/repos/connect`, {
      repoFullName: trimmed,
    });

    await fetchRepos();
    setRepoFullName("");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Connect Repository
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Link GitHub repositories to unlock dashboards and live insights.
          </p>
        </div>

        <Card className="rounded-2xl border-0 bg-white p-6 shadow-md">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="repo-full-name"
                className="text-sm font-medium text-slate-700"
              >
                Repository full name
              </label>
              <input
                id="repo-full-name"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="owner/repo"
                value={repoFullName}
                onChange={(e) => setRepoFullName(e.target.value)}
              />
            </div>

            <button
              onClick={connectRepo}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Connect repository
            </button>
          </div>
        </Card>

        <Card className="rounded-2xl border-0 bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold text-slate-900">
            Connected repositories
          </h2>
          {loading ? (
            <p className="mt-3 text-sm text-slate-500">
              Refreshing repositories…
            </p>
          ) : repos.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No repositories connected yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {repos.map((r) => (
                <li
                  key={r._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  {r.name}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
