export type RepoHealth = "healthy" | "attention" | "warning";

export interface RepoStats {
  commits: number;
  prs: number;
  contributors: number;
  openPRs: number;
  highRiskPRs: number;
}

export interface RepoAlerts {
  total: number;
  critical: number;
}

export interface RepoSummary {
  id: string;
  name: string;
  provider?: string;
  url?: string;
  language?: string;
  description?: string;
  health: RepoHealth;
  stats: RepoStats;
  alerts: RepoAlerts;
  updatedAt?: string;
}

export type RepoApiRecord = Partial<RepoSummary> & {
  _id?: string | { toString(): string } | null;
  stats?: Partial<RepoStats> | null;
  alerts?: Partial<RepoAlerts> | null;
};

export function normalizeRepo(item: RepoApiRecord): RepoSummary | null {
  const rawId =
    typeof item.id === "string"
      ? item.id
      : typeof item._id === "string"
      ? item._id
      : item._id != null && typeof (item._id as { toString(): string }).toString === "function"
      ? (item._id as { toString(): string }).toString()
      : null;

  if (!rawId) {
    return null;
  }

  const healthCandidate = item.health;
  const normalizedHealth: RepoHealth =
    healthCandidate === "attention" || healthCandidate === "warning" ? healthCandidate : "healthy";

  const stats: Partial<RepoStats> = item.stats ?? {};
  const alerts: Partial<RepoAlerts> = item.alerts ?? {};

  return {
    id: rawId,
    name: item.name ?? "Untitled repository",
    provider: item.provider,
    url: item.url,
    language: item.language,
    description: item.description,
    health: normalizedHealth,
    stats: {
      commits: stats.commits ?? 0,
      prs: stats.prs ?? 0,
      contributors: stats.contributors ?? 0,
      openPRs: stats.openPRs ?? 0,
      highRiskPRs: stats.highRiskPRs ?? 0,
    },
    alerts: {
      total: alerts.total ?? 0,
      critical: alerts.critical ?? 0,
    },
    updatedAt: item.updatedAt,
  };
}

const STORAGE_KEY_PREFIX = "repo-summary:";

export function cacheRepoSummary(summary: RepoSummary) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${summary.id}`, JSON.stringify(summary));
  } catch (error) {
    console.warn("Failed to cache repository summary", error);
  }
}

export function getCachedRepoSummary(repoId: string): RepoSummary | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${repoId}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as RepoApiRecord;
    return normalizeRepo(parsed);
  } catch (error) {
    console.warn("Failed to read cached repository summary", error);
    return null;
  }
}
