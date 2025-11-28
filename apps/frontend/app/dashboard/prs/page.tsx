"use client";

import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { useLiveStore } from "../../../store/liveStore";

interface PR {
  _id: string;
  title: string;
  number: number;
  state: string;
  riskScore?: number;
}

export default function PRsPage() {
  const [prs, setPrs] = useState<PR[]>([]);
  const { lastEvent } = useLiveStore();

  useEffect(() => {
    api.get("/prs").then((res) => setPrs(res.data.data));
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
      <div className="space-y-4">
        {prs.map((p: PR) => (
          <div key={p._id} className="p-4 bg-white border rounded">
            <div className="font-bold">{p.title}</div>

            <div className="text-sm text-gray-700">
              #{p.number} — {p.state}
            </div>

            {/* Only show riskScore if we receive live update */}
            {p.riskScore !== undefined && (
              <div className="text-sm mt-1 text-red-600 font-semibold">
                Risk Score: {p.riskScore}
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
