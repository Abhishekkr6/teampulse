"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../components/Ui/Card";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
      router.push("/dashboard");
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <Card className="w-full max-w-sm rounded-2xl border-0 bg-white p-8 text-center shadow-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
          TP
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Welcome to TeamPulse</h1>
        <p className="mt-2 text-sm text-slate-500">
          Authenticate with GitHub to explore real-time engineering insights.
        </p>
        <a
          href="https://teampulse-production.up.railway.app/api/v1/auth/github/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Login with GitHub
        </a>
      </Card>
    </div>
  );
}
