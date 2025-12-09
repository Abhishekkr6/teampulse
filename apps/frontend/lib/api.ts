"use client";

import axios from "axios";

const DEFAULT_LOCAL_BASE = "http://localhost:4000/api/v1";
const DEFAULT_REMOTE_BASE = "https://teampulse-production.up.railway.app/api/v1";

const pickEnvBase = (): string | undefined => {
  const candidates = [
    process.env.NEXT_PUBLIC_BACKEND_URL,
    process.env.BACKEND_URL,
    process.env.API_BASE_URL,
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return undefined;
};

const resolveBaseURL = (): string => {
  const envBase = pickEnvBase();
  if (envBase) {
    return envBase.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/$/, "");
    if (/localhost|127\.0\.0\.1/i.test(origin)) {
      const localBaseCandidate =
        (process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL ?? DEFAULT_LOCAL_BASE).trim();

      if (localBaseCandidate) {
        return localBaseCandidate.replace(/\/$/, "");
      }

      return DEFAULT_LOCAL_BASE;
    }

    console.warn(
      "NEXT_PUBLIC_BACKEND_URL missing; falling back to default production API host."
    );
    return DEFAULT_REMOTE_BASE;
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_REMOTE_BASE;
  }

  return DEFAULT_LOCAL_BASE;
};

export const api = axios.create();

api.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = resolveBaseURL();
  }

  // Do not use localStorage for auth; rely on httpOnly cookies
  config.withCredentials = true;

  return config;
});

export const getBackendBase = (): string => resolveBaseURL();

export const deleteAccount = async (): Promise<boolean> => {
  try {
    const res = await api.delete("/auth/logout");
    return Boolean(res?.data?.success);
  } catch (err) {
    console.error("Delete account failed", err);
    return false;
  }
};
