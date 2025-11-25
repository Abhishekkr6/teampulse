"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { api } from "../../../lib/api";

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
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const res = await api.get("/alerts");
        setAlerts(res.data.data ?? []);
      } catch (err) {
        setError("Unable to load alerts");
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  if (loading) {
    return <DashboardLayout>Loading alerts...</DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout>{error}</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div>
        {alerts.length === 0 && (
          <div className="p-4 text-sm text-gray-600">No alerts found.</div>
        )}
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
