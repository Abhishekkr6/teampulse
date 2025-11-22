"use client";

import DashboardLayout from "../../../components/Layout/DashboardLayout";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import Image from "next/image";

interface Developer {
  githubId: string;
  avatarUrl: string;
  name: string;
  commits: number;
}

export default function DevelopersPage() {
  const [devs, setDevs] = useState<Developer[]>([]);

  useEffect(() => {
    api.get("/developers").then((res) => setDevs(res.data.data));
  }, []);

  return (
    <DashboardLayout>
      <h1 className="text-xl font-semibold mb-4">Developers</h1>

      <div className="grid grid-cols-3 gap-4">
        {devs.map((d: Developer) => (
          <div key={d.githubId} className="flex flex-col items-center p-4 bg-white rounded shadow">
            <Image
              src={d.avatarUrl}
              alt={`${d.name}'s avatar`}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full mb-2"
            />
            <div className="font-bold">{d.name}</div>
            <div className="text-sm text-gray-600">Commits: {d.commits}</div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
