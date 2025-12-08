"use client";

import Topbar from "./Topbar";
import { useEffect } from "react";
import { useUserStore } from "../../store/userStore";
let hasBootstrapped = false;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (hasBootstrapped) return;
    hasBootstrapped = true;

    const { fetchUser } = useUserStore.getState();
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Topbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
