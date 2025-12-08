"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  GitPullRequest,
  Repeat,
  Search,
  UserX,
} from "lucide-react";
import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { Card } from "../../../components/Ui/Card";
import { Button } from "../../../components/Ui/Button";
import { api } from "../../../lib/api";
import { useLiveStore } from "../../../store/liveStore";

interface Alert {
  _id?: string;
  type: string;
  severity?: string;
  createdAt: string | Date;
  metadata?: Record<string, unknown> & {
    number?: number;
    title?: string;
    resourceName?: string;
    message?: string;
  };
}

interface EnrichedAlert extends Alert {
  clientId: string;
}

const SEVERITY_STYLES: Record<string, { card: string; pill: string; label: string }> = {
  low: {
    card: "border-sky-200 bg-sky-50 text-sky-900",
    pill: "bg-sky-100 text-sky-700",
    label: "low",
  },
  medium: {
    card: "border-amber-200 bg-amber-50 text-amber-900",
    pill: "bg-amber-100 text-amber-700",
    label: "medium",
  },
  high: {
    card: "border-rose-200 bg-rose-50 text-rose-900",
    pill: "bg-rose-100 text-rose-700",
    label: "critical",
  },
  critical: {
    card: "border-rose-200 bg-rose-50 text-rose-900",
    pill: "bg-rose-100 text-rose-700",
    label: "critical",
  },
};

const TYPE_LABELS: Record<string, string> = {
  HIGH_RISK_PR: "High Risk PR Detected",
  HIGH_RISK_PR_DETECTED: "High Risk PR Detected",
  DEVELOPER_INACTIVITY: "Developer Inactivity Alert",
  HIGH_CODE_CHURN: "High Code Churn",
  STUCK_PULL_REQUEST: "Stuck Pull Request",
};

const normaliseType = (value?: string) => (value ? value.toLowerCase() : "");

const formatTypeLabel = (value?: string) => {
  if (!value) return "Alert";
  if (TYPE_LABELS[value]) return TYPE_LABELS[value];
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatRelativeTime = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const deltaMs = Date.now() - date.getTime();

  if (!Number.isFinite(deltaMs)) return "Unknown";

  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const getClientId = (alert: Alert) => {
  if (alert._id) return alert._id;

  const resource = typeof alert.metadata?.resourceName === "string" ? alert.metadata.resourceName : "";
  const number = typeof alert.metadata?.number === "number" ? `${alert.metadata.number}` : "";
  return [alert.type, resource, number, alert.createdAt].filter(Boolean).join("-");
};

const resolveDescription = (alert: Alert) => {
  if (typeof alert.metadata?.title === "string" && alert.metadata.title.trim()) {
    return alert.metadata.title.trim();
  }
  if (typeof alert.metadata?.message === "string" && alert.metadata.message.trim()) {
    return alert.metadata.message.trim();
  }
  if (normaliseType(alert.type).includes("inactivity")) {
    return `${alert.metadata?.resourceName ?? "A developer"} has had no recent commits or pull requests.`;
  }
  if (normaliseType(alert.type).includes("stuck")) {
    return "This pull request has been waiting on review for several days.";
  }
  if (normaliseType(alert.type).includes("churn")) {
    return "Repository activity shows higher than normal code churn this week.";
  }

  return "This pull request requires attention to mitigate risk.";
};

const resolveResource = (alert: Alert) => {
  if (typeof alert.metadata?.resourceName === "string" && alert.metadata.resourceName.trim()) {
    return alert.metadata.resourceName.trim();
  }
  if (typeof alert.metadata?.number === "number") {
    return `dashboard-ui#${alert.metadata.number}`;
  }
  return "global";
};

const getAlertIcon = (type: string) => {
  const key = normaliseType(type);

  if (key.includes("inactivity")) {
    return <UserX className="h-5 w-5" />;
  }
  if (key.includes("churn")) {
    return <Repeat className="h-5 w-5" />;
  }
  if (key.includes("stuck")) {
    return <GitPullRequest className="h-5 w-5" />;
  }
  if (key.includes("risk")) {
    return <AlertTriangle className="h-5 w-5" />;
  }

  return <AlertCircle className="h-5 w-5" />;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const lastEvent = useLiveStore((state) => state.lastEvent);
  const init = useLiveStore((state) => state.init);

  useEffect(() => {
    init();

    const loadAlerts = async () => {
      try {
        const response = await api.get("/alerts");
        const payload: Alert[] = Array.isArray(response.data?.data) ? response.data.data : [];
        setAlerts(payload);
      } catch (error) {
        console.warn("Failed to load alerts", error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [init]);

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== "NEW_ALERT") return;

    const nextAlert: Alert = {
      type: typeof lastEvent.alertType === "string" ? lastEvent.alertType : "HIGH_RISK_PR",
      severity: typeof lastEvent.severity === "string" ? lastEvent.severity : "high",
      createdAt: new Date().toISOString(),
      metadata: {
        number: typeof lastEvent.prNumber === "number" ? lastEvent.prNumber : undefined,
        title: typeof lastEvent.prTitle === "string" ? lastEvent.prTitle : undefined,
        resourceName: typeof lastEvent.resource === "string" ? lastEvent.resource : undefined,
        message: typeof lastEvent.message === "string" ? lastEvent.message : undefined,
      },
    };

    Promise.resolve().then(() => {
      setAlerts((previous) => [nextAlert, ...previous]);
    });
  }, [lastEvent]);

  const alertsWithIds: EnrichedAlert[] = useMemo(
    () => alerts.map((alert) => ({ ...alert, clientId: getClientId(alert) })),
    [alerts]
  );

  const activeAlerts = useMemo(
    () => alertsWithIds.filter((alert) => !resolvedIds.has(alert.clientId)),
    [alertsWithIds, resolvedIds]
  );

  const resolvedAlerts = useMemo(
    () => alertsWithIds.filter((alert) => resolvedIds.has(alert.clientId)),
    [alertsWithIds, resolvedIds]
  );

  const availableSeverities = useMemo(() => {
    const bucket = new Set<string>();
    alertsWithIds.forEach((alert) => {
      if (typeof alert.severity === "string") {
        bucket.add(normaliseType(alert.severity));
      }
    });
    return ["all", ...Array.from(bucket)];
  }, [alertsWithIds]);

  const availableTypes = useMemo(() => {
    const bucket = new Set<string>();
    alertsWithIds.forEach((alert) => {
      if (typeof alert.type === "string") {
        bucket.add(normaliseType(alert.type));
      }
    });
    return ["all", ...Array.from(bucket)];
  }, [alertsWithIds]);

  const filteredActiveAlerts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return activeAlerts.filter((alert) => {
      const severityKey = normaliseType(alert.severity);
      const typeKey = normaliseType(alert.type);

      const matchesSeverity = severityFilter === "all" || severityKey === severityFilter;
      const matchesType = typeFilter === "all" || typeKey === typeFilter;
      const matchesSearch =
        keyword.length === 0 ||
        formatTypeLabel(alert.type).toLowerCase().includes(keyword) ||
        resolveDescription(alert).toLowerCase().includes(keyword) ||
        resolveResource(alert).toLowerCase().includes(keyword);

      return matchesSeverity && matchesType && matchesSearch;
    });
  }, [activeAlerts, searchTerm, severityFilter, typeFilter]);

  const unresolvedCount = activeAlerts.length;

  const handleResolve = (id: string) => {
    setResolvedIds((previous) => {
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  };

  const renderSeverityPill = (alert: Alert) => {
    const key = normaliseType(alert.severity);
    const palette = SEVERITY_STYLES[key] ?? {
      card: "border-slate-200 bg-slate-50 text-slate-900",
      pill: "bg-slate-200 text-slate-700",
      label: key || "unknown",
    };

    return {
      classes: palette.card,
      pill: (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${palette.pill}`}>
          {palette.label}
        </span>
      ),
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
      <div className="flex h-full flex-col gap-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">Alerts</h1>
            <p className="mt-1 text-base text-slate-500">Team alerts, risks, and notifications</p>
          </div>
          <div className="relative w-full max-w-xs lg:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search alerts"
              className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search..."
              type="search"
              value={searchTerm}
            />
          </div>
        </header>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[160px]">
              <label className="sr-only" htmlFor="alerts-severity-filter">
                Filter by severity
              </label>
              <select
                className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                id="alerts-severity-filter"
                onChange={(event) => setSeverityFilter(event.target.value)}
                value={severityFilter}
              >
                {availableSeverities.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "Severity" : formatTypeLabel(option)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative min-w-[160px]">
              <label className="sr-only" htmlFor="alerts-type-filter">
                Filter by type
              </label>
              <select
                className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                id="alerts-type-filter"
                onChange={(event) => setTypeFilter(event.target.value)}
                value={typeFilter}
              >
                {availableTypes.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "Type" : formatTypeLabel(option)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="inline-flex h-11 items-center rounded-full bg-rose-100 px-4 text-sm font-semibold text-rose-700">
            {unresolvedCount} Unresolved
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Active Alerts</h2>

          {filteredActiveAlerts.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 shadow-none">
              No alerts match your filters yet.
            </Card>
          ) : (
            filteredActiveAlerts.map((alert) => {
              const { classes, pill } = renderSeverityPill(alert);
              const icon = getAlertIcon(alert.type);
              const headline = formatTypeLabel(alert.type);
              const description = resolveDescription(alert);
              const resource = resolveResource(alert);
              const timestamp = formatRelativeTime(alert.createdAt);

              return (
                <div
                  key={alert.clientId}
                  className={`flex flex-col gap-4 rounded-2xl border px-6 py-5 shadow-sm transition hover:shadow-md ${classes}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-1 gap-3">
                      <div className="mt-1 text-current">{icon}</div>
                      <div className="space-y-2">
                        <div className="text-base font-semibold">{headline}</div>
                        <p className="text-sm text-current/90">{description}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      {pill}
                      <Button
                        className="h-8 rounded-full px-4 text-xs font-semibold text-rose-700 hover:text-rose-800"
                        onClick={() => handleResolve(alert.clientId)}
                        type="button"
                        variant="ghost"
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-xs font-medium text-current sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      Resource: <span className="font-semibold">{resource}</span>
                    </div>
                    <div>{timestamp}</div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {resolvedAlerts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <h2 className="font-semibold text-slate-600">Resolved ({resolvedAlerts.length})</h2>
              <span>Most recent first</span>
            </div>

            {resolvedAlerts.map((alert) => {
              const { classes, pill } = renderSeverityPill(alert);
              return (
                <div
                  key={alert.clientId}
                  className={`flex flex-col gap-4 rounded-2xl border px-6 py-5 opacity-60 ${classes}`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      {getAlertIcon(alert.type)}
                      {formatTypeLabel(alert.type)}
                    </div>
                    <p className="text-sm text-current/90">{resolveDescription(alert)}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-current">
                    <span className="flex items-center gap-2">{pill}</span>
                    <span>{formatRelativeTime(alert.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
