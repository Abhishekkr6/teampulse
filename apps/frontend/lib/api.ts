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
      return `${origin}/api/v1`;
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

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});
