"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { Card } from "../../../components/Ui/Card";
import { Button } from "../../../components/Ui/Button";
import { useUserStore } from "../../../store/userStore";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useUserStore((state) => ({
    user: state.user,
    logout: state.logout,
  }));
  const [processing, setProcessing] = useState(false);

  const handleLogout = async () => {
    if (processing) {
      return;
    }

    setProcessing(true);
    try {
      await logout();
      router.replace("/");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage your TeamPulse account preferences.</p>
        </header>

        <Card className="rounded-2xl border-0 bg-white p-6 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Account</p>
              <p className="text-xs text-slate-500">
                {user ? `Signed in as ${user.name ?? user.email ?? "your account"}` : "You are not currently signed in."}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              disabled={processing}
              className="sm:w-auto"
            >
              {processing ? "Signing out…" : "Log out"}
            </Button>
          </div>
        </Card>

        <Card className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">
          <p className="font-semibold">Heads up</p>
          <p className="mt-2">
            Logging out clears your token, cached repositories, and any in-memory activity. You will need to authenticate again to access TeamPulse.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
