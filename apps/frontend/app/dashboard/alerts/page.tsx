"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { api } from "../../../lib/api";
import { useLiveStore } from "../../../store/liveStore";
import { AlertTriangle, ChevronDown, Search } from "lucide-react";
import { Card } from "../../../components/Ui/Card";

interface Alert {
  _id?: string;
  type: string;
  severity: "low" | "medium" | "high" | string;
  createdAt: string | Date;
  metadata?: {
    number?: number;
    title?: string;
    resourceName?: string;
  };
}

interface SeverityConfig {
  card: string;
  badge: string;
  label: string;
}

const SEVERITY_CONFIG: Record<string, SeverityConfig> = {
  low: {
    card: "border-emerald-200 bg-emerald-50 text-emerald-900",
    badge: "bg-emerald-100 text-emerald-700",
    label: "low",
  },
  medium: {
    card: "border-amber-200 bg-amber-50 text-amber-900",
    badge: "bg-amber-100 text-amber-700",
    label: "medium",
  },
  high: {
    card: "border-red-200 bg-red-50 text-red-900",
    badge: "bg-red-100 text-red-700",
    label: "critical",
  },
  critical: {
    card: "border-red-200 bg-red-50 text-red-900",
    badge: "bg-red-100 text-red-700",
    label: "critical",
  },
};

const TYPE_LABELS: Record<string, string> = {
  HIGH_RISK_PR: "High Risk PR Detected",
  HIGH_RISK_PR_DETECTED: "High Risk PR Detected",
  DEVELOPER_INACTIVITY: "Developer Inactivity Alert",
};

const formatAlertType = (type: string) => {
  if (TYPE_LABELS[type]) return TYPE_LABELS[type];
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (s) => s.toUpperCase());
};

const formatRelativeTime = (dateLike: string | Date) => {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(Math.round(diffMs / 60000), 0);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [search, setSearch] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const { lastEvent, init } = useLiveStore();

  // Fetch alerts on load
  useEffect(() => {
    init();

    const loadAlerts = async () => {
      try {
        const res = await api.get("/alerts");
        setAlerts(res.data.data ?? []);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [init]);

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
          title:
            typeof lastEvent.prTitle === "string"
              ? lastEvent.prTitle
              : typeof lastEvent.message === "string"
              ? lastEvent.message
              : undefined,
        },
      };

      Promise.resolve().then(() => {
        setAlerts((prev) => [newAlert, ...prev]);
      });
    }
  }, [lastEvent]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alertItem) => {
      const severityMatch =
        severityFilter === "all" || alertItem.severity?.toLowerCase() === severityFilter;
      const typeMatch =
        typeFilter === "all" || alertItem.type?.toLowerCase() === typeFilter;
      const keyword = search.trim().toLowerCase();
      const searchMatch =
        keyword.length === 0 ||
        alertItem.metadata?.title?.toLowerCase().includes(keyword) ||
        alertItem.type?.toLowerCase().includes(keyword);

      return severityMatch && typeMatch && searchMatch;
    });
  }, [alerts, search, severityFilter, typeFilter]);

  const unresolvedCount = useMemo(() => alerts.length, [alerts.length]);

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    alerts.forEach((a) => {
      if (a.type) set.add(a.type.toLowerCase());
    });
    return Array.from(set);
  }, [alerts]);

  const severityOptions = ["all", "low", "medium", "high"];
  const typeOptions = ["all", ...uniqueTypes];

  const renderSeverityBadge = (severity: string) => {
    const key = severity?.toLowerCase();
    const cfg = SEVERITY_CONFIG[key] ?? {
      card: "border-slate-200 bg-slate-50 text-slate-900",
      badge: "bg-slate-200 text-slate-700",
      label: severity || "unknown",
    };

    return {
      badge: (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.badge}`}>
          {cfg.label}
        </span>
      ),
      cardClass: cfg.card,
    };
  };

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
      <div className="space-y-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">Alerts</h1>
            <p className="mt-1 text-base text-slate-500">
              Team alerts, risks, and notifications
            </p>
          </div>

        </header>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <label htmlFor="severity-filter" className="sr-only">
                  Filter alerts by severity
                </label>
                <select
                  id="severity-filter"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="h-11 appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  {severityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "Severity" : formatAlertType(option)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="relative">
                <label htmlFor="type-filter" className="sr-only">
                  Filter alerts by type
                </label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-11 appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  {typeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "Type" : formatAlertType(option)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="inline-flex h-11 items-center rounded-full bg-rose-100 px-4 text-sm font-semibold text-rose-700">
            {unresolvedCount} Unresolved
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Active Alerts</h2>

          {filteredAlerts.length === 0 ? (
            <Card className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 shadow-none">
              No alerts match your filters yet.
            </Card>
          ) : (
            <div className="mt-4 space-y-4">
              {filteredAlerts.map((alertItem, index) => {
                const id = alertItem._id || `alert-${index}`;
                const severity = alertItem.severity?.toLowerCase();
                const { badge, cardClass } = renderSeverityBadge(severity);
                const headline = formatAlertType(alertItem.type || "Alert");
                const description =
                  alertItem.metadata?.title ||
                  (alertItem.type?.includes("INACTIVITY")
                    ? `${alertItem.metadata?.resourceName ?? "A developer"} has had no recent commits.`
                    : "This pull request requires attention to mitigate risk.");
                const resource = alertItem.metadata?.resourceName ||
                  (alertItem.metadata?.number ? `dashboard-ui#${alertItem.metadata.number}` : "repo/main");

                return (
                  <div
                    key={id}
                    className={`flex flex-col gap-4 rounded-2xl border p-6 shadow-sm transition hover:shadow-md ${cardClass}`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-base font-semibold">
                          <AlertTriangle className="h-5 w-5" />
                          {headline}
                        </div>
                        <p className="text-sm text-current">
                          {description}
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        {badge}
                        <button className="rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-white">
                          Resolve
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-xs font-medium text-current sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        Resource: <span className="font-semibold">{resource}</span>
                      </div>
                      <div>{formatRelativeTime(alertItem.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
