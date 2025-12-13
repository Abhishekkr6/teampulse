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
  // In the browser, always use same-origin path so Next rewrites proxy
  if (typeof window !== "undefined") {
    return "/api/v1";
  }

  // On the server, allow env override for direct backend calls
  const envBase = pickEnvBase();
  if (envBase) {
    return envBase.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_REMOTE_BASE;
  }

  return DEFAULT_LOCAL_BASE;
};

export const api = axios.create({
  baseURL: "/api/v1", 
  withCredentials: true 
});

// Remove localStorage token usage; rely on httpOnly cookie only

api.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = resolveBaseURL();
  }

  // Always include credentials; backend reads httpOnly cookie
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
