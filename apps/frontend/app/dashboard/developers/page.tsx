"use client";

import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import Image from "next/image";
import Link from "next/link";
import { Card } from "../../../components/Ui/Card";

interface Developer {
  githubId: string;
  avatarUrl?: string | null;
  name: string;
  commits: number;
}

export default function DevelopersPage() {
  const [devs, setDevs] = useState<Developer[]>([]);

  useEffect(() => {
    api.get("/developers").then((res) => setDevs(res.data.data || []));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">Developers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Activity overview of every active contributor.
          </p>
        </header>

        {devs.length === 0 ? (
          <Card className="rounded-2xl border-0 bg-white p-6 text-sm text-slate-500 shadow-md">
            No developer activity found yet. Once commits start flowing, contributors will appear here.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {devs.map((d) => (
              <Link key={d.githubId} href={`/dashboard/developers/${d.githubId}`} className="block">
                <Card className="h-full rounded-2xl border-0 bg-white p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="mb-4 flex items-center gap-4">
                    {d.avatarUrl ? (
                      <Image
                        src={d.avatarUrl}
                        alt={d.name}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg font-semibold text-slate-600">
                        {d.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div>
                      <div className="text-base font-semibold text-slate-900">{d.name}</div>
                      <div className="text-xs text-slate-500">{d.githubId}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Commits (30d)</span>
                    <span className="text-lg font-semibold text-slate-900">{d.commits}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
