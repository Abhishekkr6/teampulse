"use client";

import { isAxiosError } from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	ArrowUpRight,
	GitCommit,
	GitPullRequest,
	Settings2,
	Users,
	Activity,
} from "lucide-react";
import DashboardLayout from "../../../../components/Layout/DashboardLayout";
import { Card } from "../../../../components/Ui/Card";
import { Skeleton } from "../../../../components/Ui/Skeleton";
import { api } from "../../../../lib/api";
import { getCachedRepoSummary, RepoSummary } from "../types";
import { useUserStore } from "../../../../store/userStore";

type RepoHealth = "healthy" | "attention" | "warning";

interface MetricValue {
	value: number;
	change: number;
}

interface RepoMetrics {
	totalCommits: MetricValue;
	openPRs: MetricValue;
	contributors: MetricValue;
	churnRate: MetricValue;
}

interface RepoAlertsSummary {
	total: number;
	open: number;
	criticalOpen: number;
}

interface RepoInfo {
	id: string;
	name: string;
	description?: string;
	url?: string;
	language?: string;
	provider?: string;
	health: RepoHealth;
	alerts: RepoAlertsSummary;
	updatedAt?: string;
}

interface RepoContributor {
	githubId?: string;
	name: string;
	commits: number;
	prs: number;
}

interface RepoPullRequest {
	id: string;
	number: number | null;
	title: string;
	authorName: string;
	authorId?: string;
	risk: number;
	state: string;
	reviewers: number;
	updatedAt: string | Date | null;
}

interface RepoDetailResponse {
	repo: RepoInfo;
	metrics: RepoMetrics;
	topContributors: RepoContributor[];
	pullRequests: RepoPullRequest[];
}

interface ApiResponse<T> {
	success: boolean;
	data: T;
	error?: string;
}

const DEFAULT_METRIC: MetricValue = { value: 0, change: 0 };
const EMPTY_DETAIL: RepoDetailResponse = {
	repo: {
		id: "",
		name: "",
		description: "",
		language: undefined,
		provider: undefined,
		url: undefined,
		health: "healthy",
		alerts: { total: 0, open: 0, criticalOpen: 0 },
	},
	metrics: {
		totalCommits: DEFAULT_METRIC,
		openPRs: DEFAULT_METRIC,
		contributors: DEFAULT_METRIC,
		churnRate: DEFAULT_METRIC,
	},
	topContributors: [],
	pullRequests: [],
};

const HEALTH_LABELS: Record<RepoHealth, { label: string; className: string }> = {
	healthy: { label: "good", className: "bg-emerald-100 text-emerald-700" },
	attention: { label: "watch", className: "bg-amber-100 text-amber-700" },
	warning: { label: "critical", className: "bg-rose-100 text-rose-700" },
};

const LANGUAGE_COLORS: Record<string, string> = {
	javascript: "bg-amber-100 text-amber-700",
	typescript: "bg-indigo-100 text-indigo-700",
	python: "bg-sky-100 text-sky-700",
	java: "bg-orange-100 text-orange-700",
	ruby: "bg-rose-100 text-rose-700",
	go: "bg-lime-100 text-lime-700",
	rust: "bg-stone-100 text-stone-700",
	react: "bg-teal-100 text-teal-700",
	"c#": "bg-purple-100 text-purple-700",
};

const METRIC_DEFINITIONS: Array<{
	key: keyof RepoMetrics;
	label: string;
	icon: typeof GitCommit;
	format: "number" | "percent";
}> = [
	{ key: "totalCommits", label: "Total Commits", icon: GitCommit, format: "number" },
	{ key: "openPRs", label: "Open PRs", icon: GitPullRequest, format: "number" },
	{ key: "contributors", label: "Contributors", icon: Users, format: "number" },
	{ key: "churnRate", label: "Churn Rate", icon: Activity, format: "percent" },
];

export default function RepoDetailPage() {
	const params = useParams();
	const repoIdParam = params?.repoId;
	const repoId = Array.isArray(repoIdParam) ? repoIdParam[0] : repoIdParam;

	const [data, setData] = useState<RepoDetailResponse>(EMPTY_DETAIL);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const activeOrgId = useUserStore((state) => state.activeOrgId);
	const userLoading = useUserStore((state) => state.loading);

	useEffect(() => {
		let cancelled = false;

		if (userLoading) {
			return () => {
				cancelled = true;
			};
		}

		const cachedSummary = repoId ? getCachedRepoSummary(repoId) : null;
		if (cachedSummary && !cancelled) {
			setData((previous) => {
				if (previous.repo?.id) {
					return previous;
				}
				return buildDetailFromSummary(cachedSummary);
			});
		}

		const loadDetail = async () => {
			if (!repoId) {
				setError("Missing repository identifier in URL");
				setData(EMPTY_DETAIL);
				setLoading(false);
				return;
			}

			if (!activeOrgId) {
				setError("Select an organization to view repository data");
				setData(EMPTY_DETAIL);
				setLoading(false);
				return;
			}

			setLoading(true);
			setError(null);

			try {
				const response = await api.get<ApiResponse<RepoDetailResponse>>(`/orgs/${activeOrgId}/repos/${repoId}`);
				if (!cancelled) {
					const payload = response.data?.data ?? EMPTY_DETAIL;
					setData({
						repo: payload.repo ?? EMPTY_DETAIL.repo,
						metrics: payload.metrics ?? EMPTY_DETAIL.metrics,
						topContributors: Array.isArray(payload.topContributors) ? payload.topContributors : [],
						pullRequests: Array.isArray(payload.pullRequests) ? payload.pullRequests : [],
					});
				}
			} catch (err) {
				console.warn("Failed to load repository detail", err);
				if (cancelled) {
					return;
				}

				const fallback = cachedSummary ?? (repoId ? getCachedRepoSummary(repoId) : null);

				if (fallback && isAxiosError(err) && err.response?.status === 404) {
					setData(buildDetailFromSummary(fallback));
					setError("Detailed metrics are temporarily unavailable. Showing summary data instead.");
				} else {
					setError("Unable to load this repository right now. Try again in a moment.");
					setData(EMPTY_DETAIL);
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
	}, [repoId, activeOrgId, userLoading]);

	const topContributors = useMemo(() => (Array.isArray(data.topContributors) ? data.topContributors : []), [data.topContributors]);
	const pullRequests = useMemo(() => (Array.isArray(data.pullRequests) ? data.pullRequests : []), [data.pullRequests]);

	const hasRepo = Boolean(data.repo?.id);

	return (
		<DashboardLayout>
			<div className="space-y-7">
				{loading ? (
					<RepoDetailSkeleton />
				) : !hasRepo ? (
					<Card className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 shadow-none">
						{error ?? "We could not find this repository."}
					</Card>
				) : (
					<div className="space-y-7">
						{error ? (
							<Card className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 shadow-none">
								{error}
							</Card>
						) : null}
						<HeroSection repo={data.repo} />

						<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
							<RepositoryMetrics metrics={data.metrics} />
							<TopContributorsCard contributors={topContributors} />
						</div>

						<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)]">
							<RecentPullRequestsCard pullRequests={pullRequests} repoName={data.repo.name} />
							<RepoActions repo={data.repo} />
						</div>
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}

function HeroSection({ repo }: { repo: RepoInfo }) {
	const languageKey = repo.language ? repo.language.toLowerCase() : "";
	const languageStyle = LANGUAGE_COLORS[languageKey] ?? "bg-slate-100 text-slate-600";
	const languageLabel = repo.language ?? (languageKey ? capitalize(languageKey) : "Unknown language");
	const health = HEALTH_LABELS[repo.health] ?? HEALTH_LABELS.healthy;

	return (
		<div className="overflow-hidden rounded-3xl border border-transparent bg-linear-to-r from-indigo-50 via-slate-50 to-blue-50 p-6 shadow-sm">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-4">
					<div className="flex flex-wrap gap-3 text-xs font-semibold">
						<span className={`inline-flex items-center rounded-full px-3 py-1 ${languageStyle}`}>
							{languageLabel}
						</span>
						<span className={`inline-flex items-center rounded-full px-3 py-1 ${health.className}`}>
							{health.label}
						</span>
					</div>
					<div className="space-y-2">
						<h1 className="text-4xl font-semibold text-slate-900">{repo.name || "Repository"}</h1>
						<p className="max-w-3xl text-base text-slate-500">{repo.description || "No description provided yet."}</p>
					</div>
				</div>
				<div className="flex items-start justify-end">
					<button className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500">
						<Settings2 className="h-4 w-4" /> Configure
					</button>
				</div>
			</div>
		</div>
	);
}

function RepositoryMetrics({ metrics }: { metrics: RepoMetrics }) {
	return (
		<Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold text-slate-900">Repository Metrics</h2>
					<p className="text-sm text-slate-500">Rolling 7-day performance compared to the prior week</p>
				</div>
			</div>

			<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
				{METRIC_DEFINITIONS.map((definition) => (
					<MetricCard key={definition.key} definition={definition} value={metrics?.[definition.key] ?? DEFAULT_METRIC} />
				))}
			</div>
		</Card>
	);
}

function MetricCard({
	definition,
	value,
}: {
	definition: { key: keyof RepoMetrics; label: string; icon: typeof GitCommit; format: "number" | "percent" };
	value: MetricValue;
}) {
	const Icon = definition.icon;
	const formattedValue = definition.format === "percent" ? `${formatNumber(value.value, 1)}%` : formatNumber(value.value);
	const deltaLabel = formatDelta(value.change);
	const deltaClass = deltaTextClass(value.change);

	return (
		<div className="flex h-full flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
			<div className="flex items-center gap-3">
				<span className="rounded-full bg-white p-2 text-indigo-500 shadow-sm">
					<Icon className="h-4 w-4" />
				</span>
				<span className="text-sm font-medium text-slate-500">{definition.label}</span>
			</div>
			<div className="mt-5 space-y-1">
				<div className="text-3xl font-semibold text-slate-900">{formattedValue}</div>
				<div className={`text-xs font-semibold ${deltaClass}`}>{deltaLabel}</div>
			</div>
		</div>
	);
}

function TopContributorsCard({ contributors }: { contributors: RepoContributor[] }) {
	return (
		<Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 className="text-xl font-semibold text-slate-900">Top Contributors</h2>
			<ul className="mt-5 space-y-4">
				{contributors.length === 0 ? (
					<li className="text-sm text-slate-500">No recent contributor data yet.</li>
				) : (
					contributors.map((contributor, index) => (
						<li key={contributor.githubId ?? contributor.name} className="flex items-center justify-between">
							<div>
								<p className="text-sm font-semibold text-slate-900">{contributor.name}</p>
								<p className="text-xs text-slate-500">
									{formatNumber(contributor.commits)} commits • {formatNumber(contributor.prs)} PRs
								</p>
							</div>
							<span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
						</li>
					))
				)}
			</ul>
		</Card>
	);
}

function RecentPullRequestsCard({ pullRequests, repoName }: { pullRequests: RepoPullRequest[]; repoName: string }) {
	return (
		<Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-slate-900">Recent Pull Requests</h2>
				<span className="text-xs font-semibold text-slate-400">Past 30 days</span>
			</div>

			<div className="mt-5 overflow-x-auto">
				<table className="min-w-full divide-y divide-slate-100 text-left text-sm">
					<thead>
						<tr className="text-xs uppercase tracking-wide text-slate-400">
							<th className="py-3 pr-4 font-medium">Title</th>
							<th className="py-3 pr-4 font-medium">Repo</th>
							<th className="py-3 pr-4 font-medium">Author</th>
							<th className="py-3 pr-4 font-medium">Risk</th>
							<th className="py-3 pr-4 font-medium">Status</th>
							<th className="py-3 pr-4 font-medium text-right">Reviewers</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100 text-slate-600">
						{pullRequests.length === 0 ? (
							<tr>
								<td className="py-5 text-sm text-slate-500" colSpan={6}>
									No pull requests recorded yet.
								</td>
							</tr>
						) : (
							pullRequests.map((pr) => (
								<tr key={pr.id} className="transition hover:bg-slate-50/80">
									<td className="py-4 pr-4 text-sm font-medium text-slate-900">
										{pr.title}
										{pr.number ? <span className="ml-2 text-xs text-slate-400">#{pr.number}</span> : null}
									</td>
									<td className="py-4 pr-4 text-sm text-slate-500">{repoName}</td>
									<td className="py-4 pr-4 text-sm text-slate-500">{pr.authorName}</td>
									<td className="py-4 pr-4 text-sm">
										<RiskBadge value={pr.risk} />
									</td>
									<td className="py-4 pr-4 text-sm">
										<StatusBadge state={pr.state} />
									</td>
									<td className="py-4 text-right text-sm text-slate-500">{formatNumber(pr.reviewers)}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</Card>
	);
}

function RepoActions({ repo }: { repo: RepoInfo }) {
	return (
		<div className="space-y-4">
			<Link
				className="flex items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
				href={repo.url || "#"}
				target={repo.url ? "_blank" : undefined}
			>
				View on GitHub <ArrowUpRight className="h-4 w-4" />
			</Link>
			<Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<h3 className="text-base font-semibold text-slate-900">Repository Settings</h3>
				<p className="mt-2 text-sm text-slate-500">
					Manage branch protections, alerts, and notification settings tailored to this repository.
				</p>
				<button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
					<Settings2 className="h-4 w-4" /> Manage
				</button>
			</Card>
		</div>
	);
}

function buildDetailFromSummary(summary: RepoSummary): RepoDetailResponse {
	const alertsTotal = summary.alerts?.total ?? 0;
	const alertsCritical = summary.alerts?.critical ?? 0;
	const alertsOpen = Math.max(alertsTotal - alertsCritical, 0);

	return {
		repo: {
			id: summary.id,
			name: summary.name,
			description: summary.description ?? "",
			url: summary.url,
			language: summary.language,
			provider: summary.provider,
			health: summary.health as RepoHealth,
			alerts: {
				total: alertsTotal,
				open: alertsOpen,
				criticalOpen: alertsCritical,
			},
			updatedAt: summary.updatedAt,
		},
		metrics: {
			totalCommits: { value: summary.stats?.commits ?? 0, change: 0 },
			openPRs: { value: summary.stats?.openPRs ?? 0, change: 0 },
			contributors: { value: summary.stats?.contributors ?? 0, change: 0 },
			churnRate: { value: 0, change: 0 },
		},
		topContributors: [],
		pullRequests: [],
	};
}

function RiskBadge({ value }: { value: number }) {
	const severity = value >= 70 ? "high" : value >= 30 ? "medium" : "low";
	const className =
		severity === "high"
			? "bg-rose-100 text-rose-600"
			: severity === "medium"
			? "bg-amber-100 text-amber-600"
			: "bg-emerald-100 text-emerald-600";

	return (
		<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
			{formatNumber(value)}
		</span>
	);
}

function StatusBadge({ state }: { state: string }) {
	const normalized = state?.toLowerCase() ?? "open";
	const config =
		normalized === "merged"
			? { label: "merged", className: "bg-violet-100 text-violet-700" }
			: normalized === "closed"
			? { label: "closed", className: "bg-slate-100 text-slate-600" }
			: { label: "review", className: "bg-amber-100 text-amber-700" };

	return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}>{config.label}</span>;
}

function RepoDetailSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-40 w-full rounded-3xl" />
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
				<Skeleton className="h-60 w-full rounded-3xl" />
				<Skeleton className="h-60 w-full rounded-3xl" />
			</div>
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)]">
				<Skeleton className="h-64 w-full rounded-3xl" />
				<Skeleton className="h-64 w-full rounded-3xl" />
			</div>
		</div>
	);
}

function formatNumber(value: number, fractionDigits = 0) {
	if (!Number.isFinite(value)) {
		return "0";
	}
	return value.toLocaleString(undefined, {
		maximumFractionDigits: fractionDigits,
		minimumFractionDigits: fractionDigits,
	});
}

function formatDelta(change: number) {
	if (!Number.isFinite(change) || change === 0) {
		return "No change vs last week";
	}

	const formatted = Math.abs(change) >= 1 ? change.toFixed(1) : change.toFixed(2);
	return `${change > 0 ? "+" : ""}${formatted}% vs last week`;
}

function deltaTextClass(change: number) {
	if (!Number.isFinite(change) || change === 0) {
		return "text-slate-500";
	}
	return change > 0 ? "text-emerald-600" : "text-rose-600";
}

function capitalize(value: string) {
	if (!value) return "";
	return value.charAt(0).toUpperCase() + value.slice(1);
}
