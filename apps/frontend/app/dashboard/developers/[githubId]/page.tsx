"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import DashboardLayout from "../../../../components/Layout/DashboardLayout";
import { Card } from "../../../../components/Ui/Card";
import { Skeleton } from "../../../../components/Ui/Skeleton";
import { api } from "../../../../lib/api";

interface DeveloperProfile {
  githubId?: string;
  login?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: string;
  bio?: string;
}

interface DeveloperStats {
  totalCommits: number;
  totalPRs: number;
  highRiskPRs: number;
  reviews: number;
  avgReviewTimeHours: number | null;
  weeklyActivity: number;
  trends: {
    commits: number;
    prs: number;
    reviews: number;
    avgReviewTime: number | null;
  };
}

interface ActiveRepo {
  repoId: string | null;
  name: string;
  url?: string | null;
  commits: number;
}

interface ContributionPoint {
  date?: string;
  total: number;
}

type ActivityType = "commit" | "pr" | "review";

interface ActivityEvent {
  id?: string;
  type: ActivityType;
  title: string;
  repoId: string | null;
  timestamp?: string | Date;
  metadata?: Record<string, unknown>;
}

interface DeveloperDetailResponse {
  profile?: DeveloperProfile | null;
  stats: DeveloperStats;
  activeRepos: ActiveRepo[];
  contributionActivity: ContributionPoint[];
  recentActivity: ActivityEvent[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  lead: "Engineering Lead",
  dev: "Software Engineer",
  viewer: "Viewer",
};

const emptyDetail: DeveloperDetailResponse = {
  stats: {
    totalCommits: 0,
    totalPRs: 0,
    highRiskPRs: 0,
    reviews: 0,
    avgReviewTimeHours: null,
    weeklyActivity: 0,
    trends: {
      commits: 0,
      prs: 0,
      reviews: 0,
      avgReviewTime: null,
    },
  },
  activeRepos: [],
  contributionActivity: [],
  recentActivity: [],
};

export default function DeveloperDetailPage() {
  const params = useParams();
  const githubIdParam = params?.githubId;
  const githubId = Array.isArray(githubIdParam) ? githubIdParam[0] : githubIdParam;

  const [detail, setDetail] = useState<DeveloperDetailResponse>(emptyDetail);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!githubId) {
      setError("Developer identifier missing in URL.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<ApiResponse<DeveloperDetailResponse>>(`/developers/${githubId}`);
        if (!cancelled) {
          setDetail(response.data.data ?? emptyDetail);
        }
      } catch (err) {
        console.warn("Failed to load developer detail", err);
        if (!cancelled) {
          setError("We couldn't load this developer right now. Try again shortly.");
          setDetail(emptyDetail);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [githubId]);

  const profile = detail.profile;
  const stats = detail.stats ?? emptyDetail.stats;
  const activeRepos = useMemo(
    () => (Array.isArray(detail.activeRepos) ? detail.activeRepos : []),
    [detail.activeRepos]
  );
  const contributionActivity = useMemo(
    () => (Array.isArray(detail.contributionActivity) ? detail.contributionActivity : []),
    [detail.contributionActivity]
  );
  const recentActivity = useMemo(
    () => (Array.isArray(detail.recentActivity) ? detail.recentActivity : []),
    [detail.recentActivity]
  );

  const displayName = profile?.name || profile?.login || githubId || "Unknown Developer";
  const handle = profile?.login || profile?.githubId || githubId;
  const roleLabel = profile?.role ? ROLE_LABELS[profile.role.toLowerCase()] || profile.role : "Software Engineer";
  const email = profile?.email;
  const joinedDate = profile?.createdAt ? new Date(profile.createdAt) : null;

  const repoNameMap = useMemo(() => {
    const reposList = Array.isArray(activeRepos) ? activeRepos : [];
    const mapping = new Map<string, string>();
    reposList.forEach((repo) => {
      if (repo.repoId) {
        mapping.set(repo.repoId, repo.name);
      }
    });
    return mapping;
  }, [activeRepos]);

  const heatmap = useContributionHeatmap(contributionActivity);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!githubId || (!profile && !stats.totalCommits && !stats.totalPRs && !stats.reviews)) {
    return (
      <DashboardLayout>
        <Card className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 shadow-none">
          {error ?? "We could not find this developer."}
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="space-y-2">
          <h1 className="text-4xl font-semibold text-slate-900">{displayName}</h1>
          <p className="text-base text-slate-500">{roleLabel}</p>
        </section>

        <HeroCard
          avatarUrl={profile?.avatarUrl}
          displayName={displayName}
          email={email}
          handle={handle}
          role={roleLabel}
          weeklyActivity={stats.weeklyActivity}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <PerformanceMetrics stats={stats} />
            <ContributionActivity heatmap={heatmap} />
            <RecentActivity events={recentActivity} repoNameMap={repoNameMap} />
          </div>

          <aside className="space-y-6">
            <QuickInfo email={email} handle={handle} joinedDate={joinedDate} />
            <ActiveRepositories repos={activeRepos} />
            <ActionButtons handle={handle} />
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function HeroCard({
  avatarUrl,
  displayName,
  role,
  handle,
  email,
  weeklyActivity,
}: {
  avatarUrl?: string;
  displayName: string;
  role: string;
  handle: string | undefined;
  email?: string;
  weeklyActivity: number;
}) {
  const statusLabel = weeklyActivity >= 60 ? "Active" : weeklyActivity >= 30 ? "Engaged" : "Warming up";

  return (
    <div className="overflow-hidden rounded-3xl border border-transparent bg-linear-to-r from-indigo-50 via-slate-50 to-purple-50 p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-indigo-200 text-slate-900 md:h-20 md:w-20">
            {avatarUrl ? (
              <Image alt={displayName} className="h-full w-full object-cover" height={80} src={avatarUrl} width={80} />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-semibold">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">{displayName}</h2>
              <p className="text-sm text-slate-500">{role}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
                {statusLabel}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {role}
              </span>
              {email ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                  <Mail className="h-3.5 w-3.5" />
                  {email}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-500">
              @{handle}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1 rounded-2xl bg-white/70 px-6 py-4 text-right md:items-end">
          <span className="text-sm font-medium text-slate-500">Weekly Activity</span>
          <span className="text-4xl font-semibold text-indigo-600">{weeklyActivity}%</span>
        </div>
      </div>
    </div>
  );
}

function PerformanceMetrics({ stats }: { stats: DeveloperStats }) {
  const trends = stats.trends ?? {
    commits: 0,
    prs: 0,
    reviews: 0,
    avgReviewTime: null,
  };

  const metrics = [
    {
      key: "commits",
      label: "Total Commits",
      value: stats.totalCommits ?? 0,
      trend: trends.commits,
      icon: GitCommit,
    },
    {
      key: "prs",
      label: "PRs Opened",
      value: stats.totalPRs ?? 0,
      trend: trends.prs,
      icon: GitPullRequest,
    },
    {
      key: "reviews",
      label: "Code Reviews",
      value: stats.reviews ?? 0,
      trend: trends.reviews,
      icon: MessageSquare,
    },
    {
      key: "reviewTime",
      label: "Avg Review Time",
      value: stats.avgReviewTimeHours ?? null,
      trend: trends.avgReviewTime,
      icon: AlertCircle,
      formatter: formatHours,
    },
  ];

  return (
    <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Performance Metrics</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
      </div>
    </Card>
  );
}

function MetricCard({
  metric,
}: {
  metric: {
    key: string;
    label: string;
    value: number | null;
    trend: number | null;
    icon: typeof GitCommit;
    formatter?: (value: number | null) => string;
  };
}) {
  const Icon = metric.icon;
  const formattedValue = metric.formatter ? metric.formatter(metric.value) : formatNumber(metric.value ?? 0);
  const trendLabel = formatTrend(metric.trend);
  const trendClass = trendClassName(metric.trend);

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-white p-2 text-indigo-500 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium text-slate-500">{metric.label}</span>
      </div>
      <div className="mt-4 space-y-1">
        <div className="text-2xl font-semibold text-slate-900">{formattedValue}</div>
        <div className={`text-xs font-semibold ${trendClass}`}>{trendLabel}</div>
      </div>
    </div>
  );
}

function QuickInfo({ handle, email, joinedDate }: { handle?: string; email?: string; joinedDate: Date | null }) {
  const items = [
    {
      label: "GitHub",
      value: handle ? `@${handle}` : "Not linked",
      icon: GitBranch,
    },
    {
      label: "Email",
      value: email ?? "Unavailable",
      icon: Mail,
    },
    {
      label: "Joined",
      value: joinedDate ? joinedDate.toLocaleString("default", { month: "short", year: "numeric" }) : "Unknown",
      icon: User,
    },
  ];

  return (
    <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Quick Info</h3>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <item.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className="text-sm font-medium text-slate-700">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActiveRepositories({ repos }: { repos: ActiveRepo[] }) {
  if (!repos.length) {
    return (
      <Card className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        No recent repository activity yet.
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Active Repositories</h3>
        <span className="text-xs font-semibold text-slate-400">Last 90 days</span>
      </div>
      <div className="mt-4 space-y-3">
        {repos.map((repo) => (
          <div key={repo.repoId ?? repo.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800">{repo.name}</span>
              <span className="text-xs text-slate-500">{formatNumber(repo.commits)} commits</span>
            </div>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
              Contributor
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActionButtons({ handle }: { handle?: string }) {
  const githubUrl = handle ? `https://github.com/${handle}` : undefined;

  return (
    <div className="space-y-3">
      <button className="h-12 w-full rounded-full bg-indigo-600 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500">
        Send Message
      </button>
      <Link
        aria-disabled={!githubUrl}
        className="flex h-12 w-full items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        href={githubUrl ?? "#"}
        onClick={(event) => {
          if (!githubUrl) {
            event.preventDefault();
          }
        }}
        prefetch={false}
        target="_blank"
      >
        View GitHub
      </Link>
    </div>
  );
}

function ContributionActivity({ heatmap }: { heatmap: HeatmapWeek[] }) {
  if (!heatmap.length) {
    return (
      <Card className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        No contribution data for the past 26 weeks.
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Contribution Activity (26 weeks)</h3>
        <span className="text-xs font-semibold text-slate-400">Weekly view</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <div className="grid grid-flow-col auto-cols-max gap-1">
          {heatmap.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-rows-7 gap-1">
              {week.days.map((day) => (
                <div
                  key={day.date}
                  className={`h-3.5 w-3.5 rounded ${day.color}`}
                  title={`${day.date}: ${day.value} contributions`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function RecentActivity({ events, repoNameMap }: { events: ActivityEvent[]; repoNameMap: Map<string, string> }) {
  if (!events.length) {
    return (
      <Card className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        No recent activity recorded.
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
      <div className="mt-4 space-y-4">
        {events.map((event) => (
          <ActivityItem key={event.id ?? `${event.type}-${event.timestamp}`} event={event} repoNameMap={repoNameMap} />
        ))}
      </div>
    </Card>
  );
}

function ActivityItem({ event, repoNameMap }: { event: ActivityEvent; repoNameMap: Map<string, string> }) {
  const icon = event.type === "commit" ? GitCommit : event.type === "pr" ? GitPullRequest : MessageSquare;
  const repoName = event.repoId ? repoNameMap.get(event.repoId) ?? event.repoId : "General";
  const timeAgo = formatRelativeTime(event.timestamp);

  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon === GitCommit ? <GitCommit className="h-4 w-4" /> : icon === GitPullRequest ? <GitPullRequest className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
      </span>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-slate-800">{event.title}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{repoName}</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

type HeatmapWeek = {
  days: Array<{
    date: string;
    value: number;
    color: string;
  }>;
};

function useContributionHeatmap(points: ContributionPoint[]): HeatmapWeek[] {
  return useMemo(() => {
    if (!points.length) return [];

    const totalDays = 26 * 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - (totalDays - 1));

    const values = new Map<string, number>();
    points.forEach((point) => {
      if (point?.date) {
        values.set(point.date, point.total ?? 0);
      }
    });

    const days: Array<{ date: string; value: number }> = [];
    for (let index = 0; index < totalDays; index += 1) {
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      const iso = current.toISOString().slice(0, 10);
      days.push({ date: iso, value: values.get(iso) ?? 0 });
    }

    const maxValue = days.reduce((max, day) => (day.value > max ? day.value : max), 0) || 1;

    const heatLevels = [
      "bg-slate-100",
      "bg-indigo-100",
      "bg-indigo-200",
      "bg-indigo-300",
      "bg-indigo-500",
    ];

    const buckets: HeatmapWeek[] = [];
    for (let week = 0; week < 26; week += 1) {
      const slice = days.slice(week * 7, week * 7 + 7).map((day) => {
        const ratio = day.value / maxValue;
        const level = day.value === 0 ? 0 : Math.min(4, Math.ceil(ratio * 4));
        return {
          date: day.date,
          value: day.value,
          color: heatLevels[level],
        };
      });
      buckets.push({ days: slice });
    }

    return buckets;
  }, [points]);
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toLocaleString() : "0";
}

function formatHours(value: number | null) {
  if (!Number.isFinite(value ?? NaN) || value === null) {
    return "–";
  }
  return `${value.toFixed(1)}h`;
}

function formatTrend(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "No change";
  if (value === 0) return "No change";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}% vs last week`;
}

function trendClassName(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "text-slate-400";
  return value >= 0 ? "text-emerald-600" : "text-rose-600";
}

function formatRelativeTime(timestamp?: string | Date) {
  if (!timestamp) return "Unknown";
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const diff = Date.now() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(diff / day);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
