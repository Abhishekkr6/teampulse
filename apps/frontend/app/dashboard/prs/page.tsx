"use client";

import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { useLiveStore } from "../../../store/liveStore";
import { Card } from "../../../components/Ui/Card";

interface PR {
  _id: string;
  title: string;
  number: number;
  state: string;
  riskScore?: number;
}

const STATE_STYLES: Record<string, string> = {
  open: "bg-indigo-50 text-indigo-600",
  review: "bg-amber-50 text-amber-600",
  merged: "bg-emerald-50 text-emerald-600",
  closed: "bg-slate-100 text-slate-600",
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">Pull Requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Latest pull requests across your connected repositories.
          </p>
        </header>

        {prs.length === 0 ? (
          <Card className="rounded-2xl border-0 bg-white p-6 text-sm text-slate-500 shadow-md">
            No pull requests found yet. Connect repositories or create a new PR to see it here.
          </Card>
        ) : (
          <div className="space-y-4">
            {prs.map((p: PR) => {
              const stateKey = (p.state || "").toLowerCase();
              const badgeClass = STATE_STYLES[stateKey] || STATE_STYLES.closed;
              return (
                <Card
                  key={p._id}
                  className="rounded-2xl border-0 bg-white p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-900">{p.title}</div>
                      <div className="mt-1 text-xs text-slate-500">PR #{p.number}</div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                      {p.state}
                    </span>
                  </div>

                  {p.riskScore !== undefined && (
                    <div className="mt-4 inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                      Risk Score: {p.riskScore}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
