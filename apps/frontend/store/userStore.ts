"use client";

import { create } from "zustand";
import { api } from "../lib/api";

interface User {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  orgIds?: string[];
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

interface UserState {
  user: User | null;
  loading: boolean;
  activeOrgId: string | null;
  fetchUser: () => Promise<void>;
  setActiveOrgId: (orgId: string | null) => void;
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
      set({
        user,
        loading: false,
        activeOrgId: defaultOrgId,
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

  setActiveOrgId: (orgId) => set({ activeOrgId: normaliseOrgId(orgId) }),
}));
