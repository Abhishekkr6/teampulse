"use client";

import Image from "next/image";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { useEffect } from "react";
import { useUserStore } from "../../store/userStore";

export default function MePage() {
  const { user, loading } = useUserStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { fetchUser } = useUserStore.getState();
    fetchUser();
  }, []);

  // Narrow unknown user fields without using 'any'
  const userRecord: Record<string, unknown> | null =
    user && typeof user === "object" ? (user as Record<string, unknown>) : null;
  const userId: string =
    typeof userRecord?._id === "string"
      ? userRecord._id
      : typeof userRecord?.id === "string"
      ? userRecord.id
      : "N/A";
  const orgIdsValue = userRecord?.orgIds;
  const orgIds: unknown[] | undefined = Array.isArray(orgIdsValue) ? orgIdsValue : undefined;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Account</h1>
          <p className="text-sm text-slate-500">Your profile and organization context</p>
        </header>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">Loading…</div>
        ) : !user ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-rose-600 shadow-sm">Not authenticated</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <Image
                  src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAQAIBRAA7"
                  alt={typeof userRecord?.name === "string" ? `${userRecord.name}'s avatar` : "User avatar"}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full border border-slate-200"
                />
                <div>
                  <p className="text-lg font-semibold text-slate-900">{user.name || "Unknown"}</p>
                  {user.email && <p className="text-sm text-slate-500">{user.email}</p>}
                  <p>
                    <span className="font-medium">User ID:</span> {userId}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-600">
                {Array.isArray(orgIds) && orgIds.length ? (
                  <ul className="list-disc pl-5">
                    {orgIds.map((orgId: unknown, idx: number) => (
                      <li key={idx} className="break-all">{String(orgId)}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No organizations linked.</p>
                )}
              </div>
              <h2 className="text-base font-semibold text-slate-900">Organizations</h2>
              <div className="mt-3 text-sm text-slate-600">
                {Array.isArray(orgIds) && orgIds.length ? (
                  <ul className="list-disc pl-5">
                    {orgIds.map((orgId: unknown, idx: number) => (
                      <li key={idx} className="break-all">{String(orgId)}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No organizations linked.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
