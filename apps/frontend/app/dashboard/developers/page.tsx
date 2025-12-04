"use client";

import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import Image from "next/image";
import Link from "next/link";

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Developers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Activity overview of all contributors
        </p>
      </div>

      {devs.length === 0 && (
        <div className="text-gray-500 text-sm">
          No developer activity found. Once commits are pushed, developers will
          appear here.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {devs.map((d) => (
          <Link
            key={d.githubId}
            href={`/dashboard/developers/${d.githubId}`}
            className="block"
          >
            <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm transition hover:shadow-md cursor-pointer">
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                {d.avatarUrl ? (
                  <Image
                    src={d.avatarUrl}
                    alt={d.name}
                    width={56}
                    height={56}
                    className="rounded-full border"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-gray-100 text-lg font-semibold text-gray-600">
                    {d.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">{d.name}</div>
                  <div className="text-xs text-gray-500">{d.githubId}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Commits</span>
                <span className="font-semibold text-gray-900">{d.commits}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
