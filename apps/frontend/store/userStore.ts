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

const orgIdExistsInList = (
  orgIds: unknown,
  candidate: string | null
): boolean => {
  if (!candidate || !Array.isArray(orgIds)) {
    return false;
  }

  return orgIds.some((entry) => normaliseOrgId(entry) === candidate);
};

interface UserState {
  user: User | null;
  loading: boolean;
  activeOrgId: string | null;
  initFromUrl: () => void;
  fetchUser: () => Promise<void>;
  setActiveOrgId: (
    orgId: string | null,
    options?: { refetch?: boolean }
  ) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: true,
  activeOrgId: null,

  // No token management on client; cookie is set by backend
  initFromUrl: () => {},

  fetchUser: async () => {
    try {
      // client only
      if (typeof window === "undefined") return;
      const res = await api.get("/me");
      const payload = res.data?.data;
      const rawUser = payload?.user ?? null;

      const user = rawUser;
      const defaultOrgId = normaliseOrgId(rawUser?.defaultOrgId);
      const orgIdsRaw = rawUser?.orgIds ?? [];

      const fallbackOrgId = extractPreferredOrgId(orgIdsRaw);
      const resolvedOrgId = orgIdExistsInList(orgIdsRaw, defaultOrgId)
        ? defaultOrgId
        : fallbackOrgId;

      set({ user, loading: false, activeOrgId: resolvedOrgId });
    } catch (error) {
      console.warn("Failed to fetch user", error);
      set({
        user: null,
        loading: false,
        activeOrgId: null,
      });
    }
  },

  setActiveOrgId: (orgId, options) => {
    const normalised = normaliseOrgId(orgId);
    set({ activeOrgId: normalised });

    if (options?.refetch) {
      useUserStore.getState().fetchUser();
    }
  },

  // Logout clears cookie server-side and resets store
  logout: async () => {
    try {
      await api.delete("/auth/logout");
    } catch {}
    set({ user: null, loading: false, activeOrgId: null });
    return Promise.resolve();
  },
}));
