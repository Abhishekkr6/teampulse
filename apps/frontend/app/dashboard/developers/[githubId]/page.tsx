"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "../../../../components/Layout/DashboardLayout";
import { Card, CardBody, CardHeader, CardTitle } from "../../../../components/Ui/Card";
import { Skeleton } from "../../../../components/Ui/Skeleton";
import { api } from "../../../../lib/api";

type DeveloperProfile = {
  name?: string;
  avatarUrl?: string;
};

type DeveloperStats = {
  totalCommits: number;
  totalPRs: number;
  highRiskPRs: number;
};

type DeveloperCommit = {
  _id: string;
  sha: string;
  message?: string;
  timestamp?: string;
};

type DeveloperDetail = {
  profile?: DeveloperProfile | null;
  stats: DeveloperStats;
  recentCommits: DeveloperCommit[];
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export default function DeveloperDetailPage() {
  const params = useParams();
  const githubIdParam = params?.githubId;
  const githubId = Array.isArray(githubIdParam) ? githubIdParam[0] : githubIdParam;

  const [data, setData] = useState<DeveloperDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!githubId) {
      setData(null);
      setError("Developer identifier missing in URL.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDeveloper = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<ApiResponse<DeveloperDetail>>(`/developers/${githubId}`);
        if (!cancelled) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Dev detail failed", err);
        if (!cancelled) {
          setError("We couldn't load this developer right now. Try refreshing in a bit.");
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDeveloper();

    return () => {
      cancelled = true;
    };
  }, [githubId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <Card className="rounded-2xl border-0 bg-white p-6 text-sm text-slate-500 shadow-md">
          {error ? error : "Developer not found."}
        </Card>
      </DashboardLayout>
    );
  }

  const { profile, stats, recentCommits } = data;
  const commits = Array.isArray(recentCommits) ? recentCommits : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {profile?.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile?.name || githubId}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xl font-semibold text-slate-600">
                {githubId?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">{profile?.name || githubId}</h1>
              <p className="text-sm text-slate-500">{githubId}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="rounded-2xl border-0 bg-white shadow-md">
            <CardHeader className="border-none">
              <CardTitle>Total commits</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-semibold text-slate-900">{stats.totalCommits}</p>
            </CardBody>
          </Card>

          <Card className="rounded-2xl border-0 bg-white shadow-md">
            <CardHeader className="border-none">
              <CardTitle>PRs opened</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-semibold text-slate-900">{stats.totalPRs}</p>
            </CardBody>
          </Card>

          <Card className="rounded-2xl border-0 bg-white shadow-md">
            <CardHeader className="border-none">
              <CardTitle>High-risk PRs</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-semibold text-slate-900">{stats.highRiskPRs}</p>
            </CardBody>
          </Card>
        </div>

        <Card className="rounded-2xl border-0 bg-white shadow-md">
          <CardHeader className="border-none">
            <CardTitle>Recent commits</CardTitle>
          </CardHeader>
          <CardBody>
            {commits.length === 0 ? (
              <div className="text-sm text-slate-500">No commits yet.</div>
            ) : (
              <ul className="space-y-3 text-sm">
                {commits.map((commit) => (
                  <li key={commit._id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="font-mono text-xs text-slate-500">
                      {commit.sha?.slice(0, 8)}
                    </div>
                    <div className="mt-1 font-medium text-slate-900">{commit.message}</div>
                    <div className="text-[11px] text-slate-500">
                      {commit.timestamp
                        ? new Date(commit.timestamp).toLocaleString()
                        : "Timestamp unavailable"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
