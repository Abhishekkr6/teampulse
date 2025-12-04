"use client";

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
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 w-full" />
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-gray-500 text-sm">{error ? error : "Developer not found."}</div>
      </DashboardLayout>
    );
  }

  const { profile, stats, recentCommits } = data;
  const commits = Array.isArray(recentCommits) ? recentCommits : [];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {profile?.avatarUrl && (
            <img
              src={profile.avatarUrl}
              className="w-12 h-12 rounded-full"
              alt={profile?.name}
            />
          )}
          <div>
            <h1 className="text-xl font-semibold">{profile?.name || githubId}</h1>
            <div className="text-xs text-gray-500">{githubId}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Total commits</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-bold">{stats.totalCommits}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PRs opened</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-bold">{stats.totalPRs}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>High-risk PRs</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-bold">{stats.highRiskPRs}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent commits</CardTitle>
        </CardHeader>
        <CardBody>
          {commits.length === 0 ? (
            <div className="text-xs text-gray-500">No commits yet.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {commits.map((commit) => (
                <li key={commit._id} className="border-b border-gray-100 pb-1">
                  <div className="font-mono text-xs text-gray-500">
                    {commit.sha?.slice(0, 8)}
                  </div>
                  <div>{commit.message}</div>
                  <div className="text-[11px] text-gray-400">
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
    </DashboardLayout>
  );
}
