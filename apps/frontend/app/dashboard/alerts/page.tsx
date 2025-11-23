"use client";

import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { useState } from "react";

interface Alert {
  _id: string;
  type: string;
  severity: string;
  createdAt: string;
  metadata?: {
    number?: number;
    title?: string;
  };
}

export default function AlertsPage() {
  const [alerts] = useState<Alert[]>([]);

  return (
    <DashboardLayout>
      <div>
        {alerts.map((a: Alert) => (
          <div key={a._id} className="p-4 bg-white border rounded">
            <div className="text-sm font-semibold">{a.type}</div>
            <div className="text-xs text-gray-600">
              Severity: {a.severity} • {new Date(a.createdAt).toLocaleString()}
            </div>
            {a.metadata?.title && (
              <div className="mt-1 text-sm text-gray-800">
                PR: #{a.metadata.number} — {a.metadata.title}
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
