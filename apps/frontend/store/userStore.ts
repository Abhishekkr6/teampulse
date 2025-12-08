"use client";

import { create } from "zustand";
import { api } from "../lib/api";
import { useLiveStore } from "./liveStore";

interface User {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  orgIds?: unknown[];
  // Add other user properties as needed
  defaultOrgId?: string | null;
}

const normaliseOrgId = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;

  if (typeof value === "object") {
    const maybeRecord = value as { _id?: unknown; toString?: () => string };
    const maybeOid = (value as { $oid?: unknown }).$oid;
    if (typeof maybeOid === "string") {
      return maybeOid;
    }

    if (typeof maybeRecord._id === "string") {
      return maybeRecord._id;
    }

    if (maybeRecord._id && typeof maybeRecord._id === "object") {
      const nested = maybeRecord._id as { toString?: () => string };
      if (typeof nested.toString === "function") {
        const result = nested.toString();
        if (typeof result === "string" && result !== "[object Object]") {
          return result;
        }
      }
    }

    if (typeof maybeRecord.toString === "function") {
      const fallback = maybeRecord.toString();
      if (typeof fallback === "string" && fallback !== "[object Object]") {
        return fallback;
      }
    }
  }

  return null;
};

const extractPreferredOrgId = (orgIds: unknown): string | null => {
  if (!Array.isArray(orgIds) || orgIds.length === 0) {
    return null;
  }

  for (let index = orgIds.length - 1; index >= 0; index -= 1) {
    const normalised = normaliseOrgId(orgIds[index]);
    if (normalised) {
      return normalised;
    }
  }

  return null;
};

const orgIdExistsInList = (orgIds: unknown, candidate: string | null): boolean => {
  if (!candidate || !Array.isArray(orgIds)) {
    return false;
  }

  return orgIds.some((entry) => normaliseOrgId(entry) === candidate);
};

interface UserState {
  user: User | null;
  loading: boolean;
  activeOrgId: string | null;
  fetchUser: () => Promise<void>;
  setActiveOrgId: (orgId: string | null, options?: { refetch?: boolean }) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: true,
  activeOrgId: null,

  fetchUser: async () => {
    try {
      const res = await api.get("/me");
      const user = res.data.data as User | null;
      const defaultOrgId = normaliseOrgId((user as unknown as { defaultOrgId?: unknown })?.defaultOrgId);
      const orgIdsRaw = (user as unknown as { orgIds?: unknown })?.orgIds;
      const fallbackOrgId = extractPreferredOrgId(orgIdsRaw);
      const storedOrgId = typeof window !== "undefined"
        ? normaliseOrgId(window.sessionStorage.getItem("teampulse:lastOrgId"))
        : null;
      const activeOrgIdCandidate = orgIdExistsInList(orgIdsRaw, defaultOrgId)
        ? defaultOrgId
        : fallbackOrgId;
      const resolvedOrgId = orgIdExistsInList(orgIdsRaw, storedOrgId)
        ? storedOrgId
        : activeOrgIdCandidate;
      set({
        user,
        loading: false,
        activeOrgId: resolvedOrgId,
      });
    } catch (err) {
      console.log("User load error");
      set({
        loading: false,
        user: null,
        activeOrgId: null,
      });
    }
  },

  setActiveOrgId: (orgId, options) => {
    const normalised = normaliseOrgId(orgId);

    if (typeof window !== "undefined") {
      try {
        if (normalised) {
          window.sessionStorage.setItem("teampulse:lastOrgId", normalised);
        } else {
          window.sessionStorage.removeItem("teampulse:lastOrgId");
        }
      } catch (error) {
        console.warn("Failed to persist active org selection", error);
      }
    }

    set({ activeOrgId: normalised });

    if (options?.refetch) {
      useUserStore.getState().fetchUser();
    }
  },

  logout: async () => {
    try {
      await api.delete("/auth/logout");
    } catch (error) {
      console.warn("Failed to revoke session on server", error);
    }

    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("teampulse:lastRepos");

        const session = window.sessionStorage;
        session.removeItem("teampulse:lastOrgId");

        const sessionKeys: string[] = [];
        for (let index = 0; index < session.length; index += 1) {
          const key = session.key(index);
          if (key && key.startsWith("repo-summary:")) {
            sessionKeys.push(key);
          }
        }
        sessionKeys.forEach((key) => session.removeItem(key));
      }
    } catch (error) {
      console.warn("Failed to clear stored auth state", error);
    }

    try {
      useLiveStore.getState().reset();
    } catch (error) {
      console.warn("Failed to reset live store", error);
    }

    set({ user: null, loading: false, activeOrgId: null });
  },
}));
