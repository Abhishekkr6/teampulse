"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "../../../../components/Layout/DashboardLayout";
import { Card, CardBody, CardHeader, CardTitle } from "../../../../components/Ui/Card";
import { Badge } from "../../../../components/Ui/Badge";
import { Skeleton } from "../../../../components/Ui/Skeleton";
import { api } from "../../../../lib/api";

type PullRequest = {
  _id: string;
  number: number;
  title: string;
  authorGithubId?: string;
  state: string;
  createdAt: string;
  mergedAt?: string | null;
  closedAt?: string | null;
  filesChanged?: number;
  additions?: number;
  deletions?: number;
  riskScore?: number | null;
};

type Commit = {
  _id: string;
  sha: string;
  message?: string;
  timestamp?: string;
};

type Alert = {
  _id: string;
  type: string;
  severity: "low" | "medium" | "high";
  metadata?: {
    reason?: string;
    [key: string]: unknown;
  };
  createdAt: string;
};

type PRDetailResponse = {
  pr: PullRequest;
  commits: Commit[];
  alerts: Alert[];
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export default function PRDetailPage() {
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [data, setData] = useState<PRDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<ApiResponse<PRDetailResponse>>(`/prs/${id}`);
        if (!cancelled) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("PR detail failed", err);
        if (!cancelled) {
          setError("We couldn't load this pull request. Try refreshing or revisit later.");
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-40 w-full mb-4" />
        <Skeleton className="h-40 w-full" />
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-gray-500 text-sm">
          {error ? error : "PR not found."}
        </div>
      </DashboardLayout>
    );
  }

  const { pr, commits, alerts } = data;

  const statusType: "info" | "success" | "warning" =
    pr.state === "open" ? "info" : pr.mergedAt ? "success" : "warning";

  const commitList = Array.isArray(commits) ? commits : [];
  const alertList = Array.isArray(alerts) ? alerts : [];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold mb-1">
            #{pr.number} — {pr.title}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Author: {pr.authorGithubId}</span>
            <span>•</span>
            <span>
              Created: {new Date(pr.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        <Badge type={statusType}>{pr.state.toUpperCase()}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Risk Score</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="text-3xl font-bold">
              {pr.riskScore != null ? pr.riskScore.toFixed(2) : "N/A"}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Based on size, lifetime and change volume.
            </p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Meta</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500 text-xs">Files changed</div>
                <div className="font-medium">{pr.filesChanged}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Additions</div>
                <div className="font-medium">{pr.additions}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Deletions</div>
                <div className="font-medium">{pr.deletions}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Merged at</div>
                <div className="font-medium">
                  {pr.mergedAt ? new Date(pr.mergedAt).toLocaleString() : "—"}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Related commits</CardTitle>
          </CardHeader>
          <CardBody>
            {commitList.length === 0 ? (
              <div className="text-xs text-gray-500">No commits found in this window.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {commitList.map((commit) => (
                  <li key={commit._id} className="border-b border-gray-100 pb-1">
                    <div className="font-mono text-xs text-gray-500">{commit.sha.slice(0, 8)}</div>
                    <div>{commit.message}</div>
                    <div className="text-xs text-gray-400">
                      {commit.timestamp ? new Date(commit.timestamp).toLocaleString() : "Timestamp unavailable"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardBody>
            {alertList.length === 0 ? (
              <div className="text-xs text-gray-500">No alerts fired for this PR.</div>
            ) : (
              <ul className="space-y-2 text-xs">
                {alertList.map((alert) => (
                  <li key={alert._id}>
                    <Badge type={alert.severity === "high" ? "danger" : alert.severity === "low" ? "info" : "warning"}>
                      {alert.type}
                    </Badge>
                    <div className="mt-1 text-gray-600">
                      {alert.metadata?.reason || "High risk PR"}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(alert.createdAt).toLocaleString()}
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
