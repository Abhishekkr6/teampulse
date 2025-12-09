"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "../../lib/api";
import { Button } from "../../components/Ui/Button";
import { Card } from "../../components/Ui/Card";
import { Skeleton } from "../../components/Ui/Skeleton";
import { useLiveStore } from "../../store/liveStore";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const resetLive = useLiveStore((s) => s.reset);

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const ok = await deleteAccount();
      if (ok) {
        // Clear local state and token
        try { resetLive?.(); } catch {}
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("orgId");
          localStorage.removeItem("teampulse:lastRepos");
          sessionStorage.removeItem("teampulse:lastOrgId");
        }
        router.replace("/");
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || confirmText.toLowerCase() !== "delete";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <Card className="p-4 space-y-4">
        <div>
          <p className="text-sm text-red-600 font-medium">Danger Zone</p>
          <p className="text-sm text-gray-500 mt-1">
            Deleting your account will permanently remove all your data, organizations, repositories, PRs, commits, alerts, and metrics from TeamPulse. This action cannot be undone.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type 'delete' to confirm"
            className="border rounded px-3 py-2 w-64"
          />
          <Button disabled={disabled} onClick={handleDelete}>
            {loading ? <Skeleton className="w-20 h-4" /> : "Delete & Logout"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
