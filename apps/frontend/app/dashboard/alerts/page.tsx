"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { api } from "../../../lib/api";
import { useLiveStore } from "../../../store/liveStore";
import {
  ChevronDown,
  AlertTriangle,
  GitPullRequest,
  Search,
  Bell,
  X,
} from "lucide-react";
import { Card } from "../../../components/Ui/Card";

interface Alert {
  _id?: string;
  type: string;
  severity: "low" | "medium" | "high" | string;
  createdAt: string | Date;
  metadata?: {
    number?: number;
    title?: string;
  };
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  interface Toast {
    severity: string;
    text: string;
  }
  
    const [toast, setToast] = useState<Toast | null>(null);

  const [loading, setLoading] = useState(true);

  const { lastEvent, init } = useLiveStore();

  // Fetch alerts on load
  useEffect(() => {
    init();

    const loadAlerts = async () => {
      const res = await api.get("/alerts");
      setAlerts(res.data.data ?? []);
      setLoading(false);
    };

    loadAlerts();
  }, []);

  // Handle real-time
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "NEW_ALERT") {
      const newAlert: Alert = {
        type: typeof lastEvent.alertType === "string" ? lastEvent.alertType : "HIGH_RISK_PR",
        severity: typeof lastEvent.severity === "string" ? lastEvent.severity : "high",
        createdAt: new Date(),
        metadata: {
          number: typeof lastEvent.prNumber === "number" ? lastEvent.prNumber : undefined,
          title: typeof lastEvent.prTitle,
        },
      };

      // Use a microtask to avoid cascading renders in the effect
      Promise.resolve().then(() => {
        setAlerts((prev) => [newAlert, ...prev]);

        // Real-time toast
        setToast({
          severity: newAlert.severity,
          text: `New ${newAlert.severity.toUpperCase()} Alert: ${newAlert.metadata?.title}`,
        });

        setTimeout(() => setToast(null), 4000);
      });
    }
  }, [lastEvent]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAlerts = alerts.filter((a) => {
    const severityMatch = filter === "all" || a.severity === filter;
    const searchMatch =
      a.metadata?.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.type?.toLowerCase().includes(search.toLowerCase());
    return severityMatch && searchMatch;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <Card className="rounded-2xl border-0 bg-white p-6 text-sm text-slate-500 shadow-md">
          Loading alerts...
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* REAL-TIME TOAST */}
      {toast && (
        <div
          className={`fixed right-6 top-6 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 border text-sm
          className={`fixed inset-x-4 top-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg sm:left-auto sm:right-6 sm:w-auto sm:translate-x-0
        ${SEVERITY_COLORS[toast.severity] || "bg-gray-100"}`}
        >
          <Bell className="w-4 h-4" />
          <span>{toast.text}</span>
          <X
            className="w-4 h-4 cursor-pointer"
            onClick={() => setToast(null)}
          />
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">⚡ Alerts Center</h1>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              className="pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {["all", "low", "medium", "high"].map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3 py-1 rounded-lg text-xs border transition ${
                  filter === level
                    ? "bg-gray-900 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* NO ALERTS */}
      {filteredAlerts.length === 0 && (
        <div className="p-4 text-gray-600 text-sm">
          No matching alerts found.
        </div>
      )}

      {/* ALERT TIMELINE LIST */}
      <div className="flex flex-col gap-5">
            {filteredAlerts.map((a, i) => {
              const id = a._id || `alert-${i}`;
              const isOpen = expanded[id];

          return (
            <div key={id} className="relative pl-6">
              {/* TIMELINE DOT */}
              <div className="absolute left-0 top-3 w-3 h-3 rounded-full bg-gray-300"></div>

              {/* ALERT CARD */}
              <div
                className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => toggleExpand(id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div className="font-semibold">{a.type.replace(/_/g, " ")}</div>

                    <span
                      className={`px-2 py-1 rounded text-xs border ${
                        SEVERITY_COLORS[a.severity] ||
                        "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {a.severity.toUpperCase()}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-5 h-5 transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  {new Date(a.createdAt).toLocaleString()}
                </div>

                {/* EXPANDED DETAIL */}
                <div className="space-y-6">
                  <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h1 className="text-3xl font-semibold text-slate-900">⚡ Alerts Center</h1>
                      <p className="mt-1 text-sm text-slate-500">
                        Stay ahead of risky pull requests with real-time notifications.
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search alerts..."
                          className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {["all", "low", "medium", "high"].map((level) => (
                          <button
                            key={level}
                            onClick={() => setFilter(level)}
                            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                              filter === level
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                            }`}
                          >
                            {level.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </header>

                  {/* NO ALERTS */}
                  {filteredAlerts.length === 0 ? (
                    <Card className="rounded-2xl border-0 bg-white p-6 text-sm text-slate-500 shadow-md">
                      No matching alerts found.
                    </Card>
                  ) : (
                    <div className="space-y-5">
                      {filteredAlerts.map((a, i) => {
                        const id = a._id || `alert-${i}`;
                        const isOpen = expanded[id];
                        const time = new Date(a.createdAt).toLocaleTimeString();

                        return (
                          <div key={id} className="relative pl-5 sm:pl-6">
                            {/* TIMELINE DOT */}
                            <div className="absolute left-2 top-5 h-3 w-3 -translate-x-1/2 rounded-full bg-slate-300"></div>

                            {/* ALERT CARD */}
                            <div
                              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                              onClick={() => toggleExpand(id)}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex flex-1 items-center gap-3 text-sm">
                                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                                  <div className="font-semibold text-slate-900">
                                    {a.type.replace(/_/g, " ")}
                                  </div>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      SEVERITY_COLORS[a.severity] ||
                                      "bg-gray-100 text-gray-700 border-gray-200"
                                    }`}
                                  >
                                    {a.severity.toUpperCase()}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <span>{new Date(a.createdAt).toLocaleString()}</span>
                                  <ChevronDown
                                    className={`h-5 w-5 shrink-0 transition ${
                                      isOpen ? "rotate-180 text-indigo-600" : ""
                                    }`}
                                  />
                                </div>
                              </div>

                              {isOpen && (
                                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                  {a.metadata?.title ? (
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                      <GitPullRequest className="h-5 w-5 shrink-0 text-slate-500" />
                                      <div>
                                        <div className="font-medium text-slate-900">
                                          PR #{a.metadata.number} — {a.metadata.title}
                                        </div>
                                        <button
                                          className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            alert("PR detail page coming soon!");
                                          }}
                                        >
                                          View PR →
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>No additional metadata available.</div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* TIMELINE CONNECTOR */}
                            {i < filteredAlerts.length - 1 && (
                              <div className="absolute left-2 top-8 h-full w-px bg-slate-300" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
