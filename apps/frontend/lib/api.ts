"use client";

import axios from "axios";

const DEFAULT_LOCAL_BASE = "http://localhost:4000/api/v1";

const resolveBaseURL = (): string => {
  const envBase = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (envBase) {
    return envBase.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/$/, "");
    return `${origin}/api/v1`;
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
