"use client";

import Topbar from "./Topbar";
import { useUserStore } from "../../store/userStore";
import { useEffect } from "react";
import { useLiveStore } from "../../store/liveStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser();
    useLiveStore.getState().init();
  }, [fetchUser]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Topbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
