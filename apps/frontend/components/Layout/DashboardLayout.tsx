"use client";

import Sidebar from "./Sidebar";
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
    <div className="flex h-screen w-full">
      <Sidebar />
      <div className="flex flex-col flex-1 bg-gray-50">
        <Topbar />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
