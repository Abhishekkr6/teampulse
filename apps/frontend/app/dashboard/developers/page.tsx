"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  GitCommit,
  GitPullRequest,
  MessageSquare,
  Search,
  TrendingUp,
} from "lucide-react";
import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { Card } from "../../../components/Ui/Card";
import { api } from "../../../lib/api";

interface Developer {
  githubId: string;
  name: string;
  avatarUrl?: string | null;
  role?: string | null;
  weeklyActivity: number;
  commits: number;
  prs: number;
  reviews: number;
}

type ActivityLevel = "high" | "medium" | "low" | "inactive";

const ACTIVITY_FILTER_LABELS: Record<ActivityLevel, string> = {
  high: "High Activity",
  medium: "Moderate Activity",
  low: "Developing Activity",
  inactive: "Needs Attention",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  lead: "Engineering Lead",
  dev: "Software Engineer",
  viewer: "Viewer",
};

const formatRole = (role?: string | null) => {
  if (!role) return "Software Engineer";
  const key = role.toLowerCase();
  if (ROLE_LABELS[key]) return ROLE_LABELS[key];
  return role
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getActivityLevel = (weeklyActivity: number): ActivityLevel => {
  if (weeklyActivity >= 80) return "high";
  if (weeklyActivity >= 50) return "medium";
  if (weeklyActivity >= 25) return "low";
  return "inactive";
};

const getActivityColor = (weeklyActivity: number) => {
  if (weeklyActivity >= 80) return "text-emerald-600";
  if (weeklyActivity >= 50) return "text-blue-600";
  if (weeklyActivity >= 25) return "text-amber-600";
  return "text-slate-500";
};

const getProgressColor = (weeklyActivity: number) => {
  if (weeklyActivity >= 80) return "bg-emerald-500";
  if (weeklyActivity >= 50) return "bg-blue-500";
  if (weeklyActivity >= 25) return "bg-amber-500";
  return "bg-slate-400";
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "?";
};

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await api.get("/developers");
        const payload: Developer[] = Array.isArray(response.data?.data) ? response.data.data : [];
        setDevelopers(payload);
      } catch (error) {
        console.warn("Failed to load developers", error);
        setDevelopers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDevelopers();
  }, []);

  const roleOptions = useMemo(() => {
    const uniqueRoles = new Set<string>();
    developers.forEach((dev) => {
      if (dev.role) {
        uniqueRoles.add(dev.role.toLowerCase());
      }
    });
    return Array.from(uniqueRoles).sort();
  }, [developers]);

  const filteredDevelopers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return developers.filter((dev) => {
      const matchesSearch =
        keyword.length === 0 ||
        dev.name.toLowerCase().includes(keyword) ||
        dev.githubId.toLowerCase().includes(keyword);

      const level = getActivityLevel(dev.weeklyActivity);
      const matchesActivity = activityFilter === "all" || activityFilter === level;

      const devRoleValue = dev.role ? dev.role.toLowerCase() : "";
      const matchesRole = roleFilter === "all" || roleFilter === devRoleValue;

      return matchesSearch && matchesActivity && matchesRole;
    });
  }, [developers, searchTerm, activityFilter, roleFilter]);

  const emptyState = (
    <Card className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 shadow-none">
      No developers found. Adjust your filters or try a different search.
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold text-slate-900">Developers</h1>
          <p className="text-base text-slate-500">Team member activity and performance metrics</p>
        </header>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search developers"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search..."
              type="search"
              value={searchTerm}
            />
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-48">
              <label className="sr-only" htmlFor="developer-activity-filter">
                Filter by activity level
              </label>
              <select
                className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                id="developer-activity-filter"
                onChange={(event) => setActivityFilter(event.target.value)}
                value={activityFilter}
              >
                <option value="all">Activity Level</option>
                {(Object.keys(ACTIVITY_FILTER_LABELS) as ActivityLevel[]).map((option) => (
                  <option key={option} value={option}>
                    {ACTIVITY_FILTER_LABELS[option]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative w-full sm:w-44">
              <label className="sr-only" htmlFor="developer-role-filter">
                Filter by role
              </label>
              <select
                className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                id="developer-role-filter"
                onChange={(event) => setRoleFilter(event.target.value)}
                value={roleFilter}
              >
                <option value="all">Role</option>
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatRole(option)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex animate-pulse flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-slate-200" />
                      <div className="h-3 w-1/3 rounded bg-slate-100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-2 w-3/4 rounded bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 3 }).map((__, idx) => (
                      <div key={idx} className="space-y-2 rounded-lg bg-slate-50 p-3">
                        <div className="h-3 w-6 rounded bg-slate-200" />
                        <div className="h-4 w-1/2 rounded bg-slate-200" />
                        <div className="h-2 w-3/4 rounded bg-slate-100" />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredDevelopers.length === 0 ? (
          emptyState
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredDevelopers.map((developer) => (
              <DeveloperCard key={developer.githubId} developer={developer} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function DeveloperCard({ developer }: { developer: Developer }) {
  const activityColor = getActivityColor(developer.weeklyActivity);
  const progressColor = getProgressColor(developer.weeklyActivity);
  const levelLabel = ACTIVITY_FILTER_LABELS[getActivityLevel(developer.weeklyActivity)];

  return (
    <Link href={`/dashboard/developers/${developer.githubId}`} className="block" prefetch={false}>
      <Card className="group h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-indigo-500 to-indigo-400 text-white">
              {developer.avatarUrl ? (
                <Image
                  alt={developer.name}
                  className="h-full w-full object-cover"
                  height={48}
                  src={developer.avatarUrl}
                  width={48}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-semibold">
                  {getInitials(developer.name)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{developer.name}</p>
              <p className="truncate text-xs text-slate-500">{formatRole(developer.role)}</p>
            </div>
          </div>
          <TrendingUp className="h-4 w-4 text-slate-300 transition group-hover:text-indigo-400" />
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Weekly Activity</span>
            <span className={`${activityColor} text-sm font-semibold`}>
              {developer.weeklyActivity}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className={`${progressColor} h-full transition-all`} style={{ width: `${developer.weeklyActivity}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">{levelLabel}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatBlock icon={GitCommit} label="Commits" value={developer.commits} />
          <StatBlock icon={GitPullRequest} label="PRs" value={developer.prs} />
          <StatBlock icon={MessageSquare} label="Reviews" value={developer.reviews} />
        </div>
      </Card>
    </Link>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GitCommit;
  label: string;
  value?: number | null;
}) {
  const displayValue = Number.isFinite(value as number) ? (value as number) : 0;

  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center transition group-hover:bg-slate-100">
      <div className="flex items-center justify-center">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-2 text-lg font-semibold text-slate-900">{displayValue.toLocaleString()}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
