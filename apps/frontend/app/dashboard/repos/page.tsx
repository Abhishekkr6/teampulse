"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import {
  AlertTriangle,
  ChevronDown,
  GitCommit,
  GitPullRequest,
  Languages,
  Search,
  Users,
} from "lucide-react";
import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { Card } from "../../../components/Ui/Card";
import { api } from "../../../lib/api";
import { cacheRepoSummary, normalizeRepo, RepoApiRecord, RepoSummary } from "./types";
import { useUserStore } from "../../../store/userStore";

const HEALTH_LABELS: Record<RepoSummary["health"], string> = {
  healthy: "Healthy",
  attention: "Needs Attention",
  warning: "Warning",
};

const HEALTH_STYLES: Record<RepoSummary["health"], string> = {
  healthy: "bg-emerald-100 text-emerald-700",
  attention: "bg-amber-100 text-amber-700",
  warning: "bg-rose-100 text-rose-700",
};

const HEALTH_FILTER_LABELS: Record<HealthFilter | "all", string> = {
  all: "Health",
  healthy: HEALTH_LABELS.healthy,
  attention: HEALTH_LABELS.attention,
  warning: HEALTH_LABELS.warning,
};

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: "bg-amber-100 text-amber-700",
  typescript: "bg-indigo-100 text-indigo-700",
  python: "bg-sky-100 text-sky-700",
  react: "bg-teal-100 text-teal-700",
  "c#": "bg-purple-100 text-purple-700",
  java: "bg-orange-100 text-orange-700",
  ruby: "bg-red-100 text-red-700",
  go: "bg-lime-100 text-lime-700",
  rust: "bg-stone-100 text-stone-700",
};

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  go: "Go",
  rust: "Rust",
  "c#": "C#",
  ruby: "Ruby",
  react: "React",
};

type HealthFilter = "all" | RepoSummary["health"];

export default function ReposPage() {
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");

  const activeOrgId = useUserStore((state) => state.activeOrgId);
  const userLoading = useUserStore((state) => state.loading);
  const missingOrg = !userLoading && !activeOrgId;

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!activeOrgId) {
      setRepos([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadRepos = async () => {
      setLoading(true);

      try {
        const response = await api.get(`/orgs/${activeOrgId}/repos`);

        if (response.status === 304) {
          return;
        }

        const rawData = response.data?.data;
        const payload: RepoApiRecord[] = Array.isArray(rawData)
          ? rawData
          : rawData && typeof rawData === "object"
          ? Object.values(rawData as Record<string, RepoApiRecord>)
          : [];

        const normalized = payload
          .map((item) => normalizeRepo(item))
          .filter((value): value is RepoSummary => value !== null);

        if (!cancelled) {
          setRepos(normalized);
          localStorage.setItem(
            "teampulse:lastRepos",
            JSON.stringify({ orgId: activeOrgId, repos: normalized })
          );
        }
      } catch (error) {
        console.warn("Failed to load repos", error);
        if (!cancelled) {
          setRepos([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    try {
      const cached = localStorage.getItem("teampulse:lastRepos");
      if (cached) {
        const parsed = JSON.parse(cached) as { orgId?: string; repos?: RepoApiRecord[] };
        if (parsed?.orgId === activeOrgId && Array.isArray(parsed?.repos)) {
          const normalized = parsed.repos
            .map((item) => normalizeRepo(item))
            .filter((value): value is RepoSummary => value !== null);
          setRepos(normalized);
        }
      }
    } catch (error) {
      console.warn("Failed to read cached repos", error);
    }

    loadRepos();

    return () => {
      cancelled = true;
    };
  }, [activeOrgId, userLoading]);

  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    repos.forEach((repo) => {
      if (repo.language) {
        set.add(repo.language.toLowerCase());
      }
    });
    return Array.from(set).sort();
  }, [repos]);

  const filteredRepos = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return repos.filter((repo) => {
      const matchesSearch =
        keyword.length === 0 ||
        repo.name.toLowerCase().includes(keyword) ||
        (repo.description ?? "").toLowerCase().includes(keyword);

      const language = repo.language ? repo.language.toLowerCase() : "";
      const matchesLanguage = languageFilter === "all" || language === languageFilter;

      const matchesHealth = healthFilter === "all" || repo.health === healthFilter;

      return matchesSearch && matchesLanguage && matchesHealth;
    });
  }, [repos, search, languageFilter, healthFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-4xl font-semibold text-slate-900">Repositories</h1>
          <p className="text-base text-slate-500">Team repositories and project health metrics</p>
        </header>

        {missingOrg ? (
          <Card className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 shadow-none">
            Select or create an organization to view its repositories.
          </Card>
        ) : (
          <FilterBar
            availableLanguages={availableLanguages}
            healthFilter={healthFilter}
            languageFilter={languageFilter}
            onHealthChange={setHealthFilter}
            onLanguageChange={setLanguageFilter}
            onSearchChange={setSearch}
            searchValue={search}
          />
        )}

        {missingOrg ? null : loading ? (
          <RepositorySkeleton />
        ) : filteredRepos.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 shadow-none">
            No repositories match your filters right now.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredRepos.map((repo) => (
              <RepositoryCard key={repo.id} repo={repo} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function FilterBar({
  availableLanguages,
  searchValue,
  onSearchChange,
  languageFilter,
  onLanguageChange,
  healthFilter,
  onHealthChange,
}: {
  availableLanguages: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  languageFilter: string;
  onLanguageChange: (value: string) => void;
  healthFilter: HealthFilter;
  onHealthChange: (value: HealthFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          aria-label="Search repositories"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search..."
          type="search"
          value={searchValue}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          id="repo-language-filter"
          label="Language"
          onChange={onLanguageChange}
          options={["all", ...availableLanguages]}
          value={languageFilter}
        />

        <Select
          id="repo-health-filter"
          label="Health"
          onChange={(value) => onHealthChange(value as HealthFilter)}
          options={["all", "healthy", "attention", "warning"]}
          formatOption={(option) => HEALTH_FILTER_LABELS[option as HealthFilter | "all"] ?? option}
          value={healthFilter}
        />
      </div>
    </div>
  );
}

function Select({
  id,
  label,
  value,
  options,
  formatOption,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[] | string[];
  formatOption?: (value: string) => string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative min-w-40">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select
        className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {(options as string[]).map((option) => (
          <option key={option} value={option}>
            {formatOption
              ? formatOption(option)
              : option === "all"
              ? label
              : option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function RepositoryCard({ repo }: { repo: RepoSummary }) {
  const languageKey = repo.language ? repo.language.toLowerCase() : "";
  const languageStyle = LANGUAGE_COLORS[languageKey] ?? "bg-slate-100 text-slate-600";
  const displayLanguage = repo.language ?? (languageKey ? LANGUAGE_DISPLAY_NAMES[languageKey] ?? capitalize(languageKey) : null);
  const languageLabel = displayLanguage ?? "Unknown language";
  const healthLabel = HEALTH_LABELS[repo.health];
  const healthStyle = HEALTH_STYLES[repo.health];
  const stats = (repo.stats ?? { commits: 0, prs: 0, contributors: 0, openPRs: 0, highRiskPRs: 0 }) as RepoSummary["stats"];
  const alerts = (repo.alerts ?? { total: 0, critical: 0 }) as RepoSummary["alerts"];
  const href = `/dashboard/repos/${encodeURIComponent(repo.id)}`;

  const handleCardClick = () => cacheRepoSummary(repo);

  const handleExternalView = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!repo.url || typeof window === "undefined") {
      return;
    }

    window.open(repo.url, "_blank", "noopener,noreferrer");
  };

  return (
    <Link className="block" href={href} onClick={handleCardClick} prefetch={false}>
      <Card className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">{repo.name}</h2>
          <p className="text-sm text-slate-500">{repo.description || "No description provided"}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${healthStyle}`}>
          {healthLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {displayLanguage ? (
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${languageStyle}`}>
            {displayLanguage}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric icon={GitCommit} label="Commits" value={stats.commits} />
        <Metric icon={GitPullRequest} label="PRs" value={stats.prs} />
        <Metric icon={Users} label="Contributors" value={stats.contributors} />
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
          <Languages className="h-3.5 w-3.5" /> {languageLabel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-600">
          <AlertTriangle className="h-3.5 w-3.5" /> High Risk {stats.highRiskPRs}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          Alerts: <strong>{alerts.total}</strong>
          {alerts.critical > 0 ? (
            <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600">
              {alerts.critical} critical
            </span>
          ) : null}
        </span>
        {repo.url ? (
          <button
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            onClick={handleExternalView}
            type="button"
          >
            View
          </button>
        ) : null}
      </div>
      </Card>
    </Link>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GitCommit;
  label: string;
  value: number;
}) {
  const displayValue = Number.isFinite(value) ? value : 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center transition hover:bg-slate-100">
      <div className="flex items-center justify-center">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{displayValue.toLocaleString()}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function RepositorySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-full bg-slate-100" />
              <div className="h-6 w-20 rounded-full bg-slate-100" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((__, idx) => (
                <div key={idx} className="space-y-2 rounded-2xl bg-slate-50 p-4">
                  <div className="h-3 w-6 rounded bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-2 w-3/4 rounded bg-slate-100" />
                </div>
              ))}
            </div>
            <div className="h-4 w-full rounded bg-slate-100" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function capitalize(value: string) {
  if (!value) {
    return "";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
