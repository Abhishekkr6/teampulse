"use client";

import { create } from "zustand";
import { api } from "../lib/api";
import { isAxiosError } from "axios";

interface User {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  orgIds?: unknown[];
  defaultOrgId?: string | null;
}

interface UserState {
  user: User | null;
  loading: boolean;
  activeOrgId: string | null;
  fetchUser: (opts?: { silent?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
}

const normaliseOrgId = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;

  type IdLike = {
    _id?: unknown;
    $oid?: unknown;
    toString?: () => string;
  };

  const toStringSafe = (v: unknown): string | null => {
    if (typeof v === "string") return v;
    if (v != null && typeof (v as { toString?: () => string }).toString === "function") {
      const s = (v as { toString: () => string }).toString();
      return typeof s === "string" ? s : null;
    }
    return null;
  };

  if (typeof value === "object" && value !== null) {
    const obj = value as IdLike;
    return (
      toStringSafe(obj._id) ??
      (typeof obj.$oid === "string" ? obj.$oid : null) ??
      toStringSafe(obj)
    );
  }
  return null;
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: true,
  activeOrgId: null,

  fetchUser: async (opts) => {
    try {
      // prevent double calls
      if (get().loading === false && opts?.silent) return;

      const res = await api.get("/me");
      const payload = res.data?.data ?? {};
      const rawUser = payload.user ?? null;

      const defaultOrgCandidate =
        payload.defaultOrgId ??
        rawUser?.defaultOrgId ??
        null;

      const orgIdsRaw: unknown[] = Array.isArray(payload.orgIds)
        ? (payload.orgIds as unknown[])
        : Array.isArray(rawUser?.orgIds)
        ? (rawUser.orgIds as unknown[])
        : [];

      const normalisedOrgIds = orgIdsRaw
        .map((value) => normaliseOrgId(value))
        .filter((value): value is string => Boolean(value));

      const normalisedDefault = normaliseOrgId(defaultOrgCandidate);
      const existingActive = get().activeOrgId;
      const activeFromExisting =
        existingActive && normalisedOrgIds.includes(existingActive)
          ? existingActive
          : null;

      // keep previous selection when it still exists, then fall back to defaults
      const derivedActiveOrgId =
        activeFromExisting ??
        normalisedDefault ??
        normalisedOrgIds[0] ??
        null;

      set({
        user: rawUser
          ? {
              ...rawUser,
              orgIds: normalisedOrgIds,
              defaultOrgId: normalisedDefault,
            }
          : null,
        activeOrgId: derivedActiveOrgId,
        loading: false,
      });
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;

        // 🚫 DO NOT logout on first 401
        if (status === 401) {
          set((s) => ({
            ...s,
            loading: false,
          }));
          return;
        }
      }

      set({
        user: null,
        activeOrgId: null,
        loading: false,
      });
    }
  },

  logout: async () => {
    try {
      await api.delete("/auth/logout");
    } catch {}

    // logout is the ONLY place we hard reset
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}

    set({
      user: null,
      activeOrgId: null,
      loading: false,
    });
  },
}));
