"use client";

import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

interface PR {
  _id: string;
  title: string;
  number: number;
  state: string;
}

export default function PRsPage() {
  const [prs, setPrs] = useState<PR[]>([]);

  useEffect(() => {
    api.get("/prs").then((res) => setPrs(res.data.data));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {prs.map((p: PR) => (
          <div key={p._id} className="p-4 bg-white border rounded">
            <div className="font-bold">{p.title}</div>
            <div className="text-sm text-gray-700">
              #{p.number} — {p.state}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
