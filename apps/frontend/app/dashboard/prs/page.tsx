"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { api } from "../../../lib/api";
import { useLiveStore } from "../../../store/liveStore";
import { Button } from "../../../components/Ui/Button";
import { Card } from "../../../components/Ui/Card";

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
  repoId?: string;
  authorName?: string;
  authorGithubId?: string;
  reviewers?: Reviewer[];
  createdAt?: string;
}

type StatusKey = "open" | "review" | "merged" | "draft" | "other";
type RiskLevel = "low" | "medium" | "high" | "unknown";

const UNKNOWN_LABEL = "N/A";

const getRiskAccent = (value?: number) => {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "text-slate-400";
  }
  if (value >= 70) return "text-rose-600 font-semibold";
  if (value >= 40) return "text-amber-600 font-medium";
  return "text-emerald-600 font-medium";
};

const toRiskLevel = (value?: number): RiskLevel => {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "unknown";
  }
  if (value >= 70) return "high";
  if (value >= 40) return "medium";
  return "low";
};

const STATUS_BADGE = (state?: string): { text: string; className: string; key: StatusKey } => {
  const key = (state || "").toLowerCase();

  switch (key) {
    case "open":
      return { text: "open", className: "bg-blue-500/10 text-blue-700", key: "open" };
    case "review":
      return { text: "review", className: "bg-orange-500/10 text-orange-700", key: "review" };
    case "merged":
      return { text: "merged", className: "bg-purple-500/10 text-purple-700", key: "merged" };
    case "draft":
      return { text: "draft", className: "bg-slate-200/80 text-slate-600", key: "draft" };
    default:
      return {
        text: state || "unknown",
        className: "bg-slate-200/80 text-slate-600",
        key: "other",
      };
  }
};

const formatRelativeTime = (value?: string | Date | null) => {
  if (!value) return UNKNOWN_LABEL;

  const date = typeof value === "string" ? new Date(value) : value;
  if (!date || Number.isNaN(date.getTime())) return UNKNOWN_LABEL;

  const reference = new Date();
  const now = reference.getTime();
  const elapsed = now - date.getTime();
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (elapsed < 60_000) {
    return "just now";
  }

  if (elapsed < 3_600_000) {
    const minutes = Math.round(elapsed / 60_000);
    return formatter.format(-minutes, "minute");
  }

  if (elapsed < 86_400_000) {
    const hours = Math.round(elapsed / 3_600_000);
    return formatter.format(-hours, "hour");
  }

  if (elapsed < 604_800_000) {
    const days = Math.round(elapsed / 86_400_000);
    return formatter.format(-days, "day");
  }

  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (date.getFullYear() !== reference.getFullYear()) {
    options.year = "numeric";
  }

  return date.toLocaleDateString(undefined, options);
};

type StatusFilter = "all" | StatusKey;
type RiskFilter = "all" | RiskLevel;

type FilterOption = {
  label: string;
  value: string;
};

interface FilterSelectProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

const FilterSelect = ({ label, value, options, onChange }: FilterSelectProps) => (
  <div className="relative">
    <select
      aria-label={label}
      className="h-10 appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-600 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
      <ChevronDown className="h-4 w-4" />
    </span>
  </div>
);

type TableRow = {
  id: string;
  title: string;
  number: number;
  repo: string;
  author: string;
  statusText: string;
  statusClass: string;
  statusKey: StatusKey;
  riskValue?: number;
  riskLevel: RiskLevel;
  reviewersCount: number;
  createdAtLabel: string;
};

export default function PRsPage() {
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [repoFilter, setRepoFilter] = useState<string>("all");
  const [selectedPrId, setSelectedPrId] = useState<string | null>(null);
  const lastEvent = useLiveStore((state) => state.lastEvent);

  useEffect(() => {
    let isMounted = true;

    api
      .get("/prs")
      .then((res) => {
        if (!isMounted) return;
        setPrs(res.data?.data?.items || []);
      })
      .catch(() => {
        if (!isMounted) return;
        setPrs([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "PR_UPDATED") {
      Promise.resolve().then(() => {
        setPrs((previous) =>
          previous.map((pr) =>
            pr._id === lastEvent.prId
              ? { ...pr, riskScore: lastEvent.riskScore as number }
              : pr
          )
        );
      });
    }
  }, [lastEvent]);

  const tableRows = useMemo<TableRow[]>(() => {
    return prs.map((pr) => {
      const status = STATUS_BADGE(pr.state);
      const rawRisk = pr.riskScore;
      const normalizedRisk =
        rawRisk === undefined || rawRisk === null
          ? undefined
          : rawRisk <= 1
          ? Math.round(rawRisk * 100)
          : Math.round(rawRisk);

      const repo = pr.repoName?.trim() || pr.repoId || UNKNOWN_LABEL;
      const author = pr.authorName?.trim() || pr.authorGithubId || UNKNOWN_LABEL;
      const reviewersCount = Array.isArray(pr.reviewers) ? pr.reviewers.length : 0;

      return {
        id: pr._id,
        title: pr.title || "Untitled PR",
        number: pr.number,
        repo,
        author,
        statusText: status.text,
        statusClass: status.className,
        statusKey: status.key,
        riskValue: normalizedRisk,
        riskLevel: toRiskLevel(normalizedRisk),
        reviewersCount,
        createdAtLabel: formatRelativeTime(pr.createdAt),
      };
    });
  }, [prs]);

  const repoOptions = useMemo(() => {
    const names = new Set<string>();
    tableRows.forEach((row) => {
      if (row.repo && row.repo !== UNKNOWN_LABEL) {
        names.add(row.repo);
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [tableRows]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return tableRows.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        [row.title, row.repo, row.author, `#${row.number}`]
          .map((value) => `${value}`.toLowerCase())
          .some((value) => value.includes(term));

      const matchesStatus = statusFilter === "all" || row.statusKey === statusFilter;
      const matchesRisk = riskFilter === "all" || row.riskLevel === riskFilter;
      const matchesRepo = repoFilter === "all" || row.repo === repoFilter;

      return matchesSearch && matchesStatus && matchesRisk && matchesRepo;
    });
  }, [tableRows, searchTerm, statusFilter, riskFilter, repoFilter]);

  const statusOptions: FilterOption[] = [
    { label: "All statuses", value: "all" },
    { label: "Open", value: "open" },
    { label: "Review", value: "review" },
    { label: "Merged", value: "merged" },
    { label: "Draft", value: "draft" },
  ];

  const riskOptions: FilterOption[] = [
    { label: "All risk levels", value: "all" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
    { label: "Unknown", value: "unknown" },
  ];

  const repoFilterOptions: FilterOption[] = [
    { label: "All repositories", value: "all" },
    ...repoOptions.map((name) => ({ label: name, value: name })),
  ];

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
            Loading pull requests...
          </td>
        </tr>
      );
    }

    if (!filteredRows.length) {
      return (
        <tr>
          <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
            No pull requests match the current filters.
          </td>
        </tr>
      );
    }

    return filteredRows.map((row) => {
      const isSelected = row.id === selectedPrId;

      return (
        <tr
          key={row.id}
          className={`group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 ${
            isSelected ? "bg-slate-50" : ""
          }`}
          onClick={() => setSelectedPrId(row.id)}
        >
          <td className="px-6 py-4 align-middle">
            <div className="text-sm font-semibold text-slate-900">{row.title}</div>
            <div className="mt-1 text-xs text-slate-500">
              #{row.number} - {row.createdAtLabel}
            </div>
          </td>
          <td className="px-6 py-4 align-middle text-sm text-slate-600">{row.repo}</td>
          <td className="px-6 py-4 align-middle text-sm text-slate-600">{row.author}</td>
          <td className={`px-6 py-4 align-middle font-mono text-sm ${getRiskAccent(row.riskValue)}`}>
            {row.riskValue === undefined ? UNKNOWN_LABEL : row.riskValue}
          </td>
          <td className="px-6 py-4 align-middle">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.statusClass}`}>
              {row.statusText}
            </span>
          </td>
          <td className="px-6 py-4 align-middle text-sm font-semibold text-slate-700">{row.reviewersCount}</td>
          <td className="px-6 py-4 align-middle text-right">
            <Button
              aria-label="View pull request"
              className="h-8 w-8 rounded-full px-0 py-0 text-slate-400 transition group-hover:text-slate-600"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedPrId(row.id);
              }}
              variant="ghost"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </td>
        </tr>
      );
    });
  };

  return (
    <DashboardLayout>
      <div className="flex h-full flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Pull Requests</h1>
          <p className="text-sm text-slate-500">
            Team pull requests with risk scoring and review metrics
          </p>
        </header>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search pull requests"
              className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Search pull requests"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              type="search"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap">
            <FilterSelect
              label="Filter by status"
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              options={statusOptions}
              value={statusFilter}
            />
            <FilterSelect
              label="Filter by risk"
              onChange={(value) => setRiskFilter(value as RiskFilter)}
              options={riskOptions}
              value={riskFilter}
            />
            <FilterSelect
              label="Filter by repository"
              onChange={(value) => setRepoFilter(value)}
              options={repoFilterOptions}
              value={repoFilter}
            />
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm text-slate-700">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Repo</th>
                  <th className="px-6 py-4 font-semibold">Author</th>
                  <th className="px-6 py-4 font-semibold">Risk</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Reviewers</th>
                  <th className="px-6 py-4" aria-label="Open" />
                </tr>
              </thead>
              <tbody>{renderTableBody()}</tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
