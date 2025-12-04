"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { api } from "../../../lib/api";
import { useLiveStore } from "../../../store/liveStore";
import { Badge } from "../../../components/Ui/Badge";
import { Card } from "../../../components/Ui/Card";
import { Search } from "lucide-react";

interface Reviewer {
  login?: string;
}

interface PR {
  _id: string;
  title: string;
  number: number;
  state: string;
  riskScore?: number;
  repoName?: string;
  authorName?: string;
  reviewers?: Reviewer[];
}

const STATE_LABELS: Record<string, string> = {
  open: "open",
  review: "review",
  merged: "merged",
};

const RISK_COLOR = (risk?: number) => {
  if (risk === undefined || risk === null || !Number.isFinite(risk)) {
    return "text-slate-500";
  }
  if (risk < 30) return "text-emerald-600";
  if (risk < 60) return "text-amber-600";
  return "text-rose-600";
};

const STATUS_BADGE = (state?: string) => {
  const key = (state || "").toLowerCase();
  switch (key) {
    case "open":
      return { text: "open", className: "bg-sky-50 text-sky-600" };
    case "review":
      return { text: "review", className: "bg-amber-50 text-amber-600" };
    case "merged":
      return { text: "merged", className: "bg-violet-100 text-violet-600" };
    default:
      return { text: state || "unknown", className: "bg-slate-100 text-slate-500" };
  }
};

export default function PRsPage() {
  const [prs, setPrs] = useState<PR[]>([]);
  const { lastEvent } = useLiveStore();

  useEffect(() => {
    api
      .get("/prs")
      .then((res) => setPrs(res.data?.data?.items || []))
      .catch(() => setPrs([]));
  }, []);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "PR_UPDATED") {
      Promise.resolve().then(() => {
        setPrs((prev) =>
          prev.map((p) =>
            p._id === lastEvent.prId
              ? { ...p, riskScore: lastEvent.riskScore as number }
              : p
          )
        );
      });
    }
  }, [lastEvent]);

  const tableRows = useMemo(() => {
    return prs.map((pr) => {
      const status = STATUS_BADGE(pr.state);

      return {
        ...pr,
        statusText: status.text,
        statusClass: status.className,
        repo: pr.repoName || "—",
        author: pr.authorName || "Unknown",
        riskValue:
          pr.riskScore !== undefined && pr.riskScore !== null
            ? Math.round(pr.riskScore)
            : undefined,
        reviewersCount: Array.isArray(pr.reviewers) ? pr.reviewers.length : 0,
      };
    });
  }, [prs]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Pull Requests</h1>
          <p className="text-sm text-slate-500">
            Team pull requests with risk scoring and review metrics
          </p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search..."
              className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              disabled
            />
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
            {[
              { label: "Status" },
              { label: "Risk Level" },
              { label: "Repository" },
            ].map((filter) => (
              <button
                key={filter.label}
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 sm:w-auto"
                disabled
              >
                {filter.label}
                <span className="text-slate-400">▾</span>
              </button>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-md">
          <div className="min-w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Repo</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Risk</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Reviewers</th>
                  <th className="px-6 py-4" aria-label="View" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tableRows.map((pr) => (
                  <tr key={pr._id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{pr.title}</div>
                      <div className="text-xs text-slate-500">PR #{pr.number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge type="info">{pr.repo}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{pr.author}</td>
                    <td className={`px-6 py-4 font-semibold ${RISK_COLOR(pr.riskValue)}`}>
                      {pr.riskValue !== undefined ? pr.riskValue : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${pr.statusClass}`}>
                        {pr.statusText}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{pr.reviewersCount}</td>
                    <td className="px-6 py-4 text-right text-slate-400">›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
