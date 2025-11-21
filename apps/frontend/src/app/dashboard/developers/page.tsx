"use client";

import DashboardLayout from "../../../../components/Layout/DashboardLayout";
import { useEffect, useState } from "react";
import { api } from "../../../../lib/api";

type Developer = {
  id?: string | number;
  name: string;
  avatarUrl: string;
  commits: number;
};

export default function DevelopersPage() {
  const [devs, setDevs] = useState<Developer[]>([]);

  useEffect(() => {
    api.get("/dummy/developers").then((res) => setDevs(res.data.data));
  }, []);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {devs.map((d: Developer) => (
          <div key={d.id || d.name} className="p-4 bg-white border rounded">
            <img
              src={d.avatarUrl}
              alt={`Avatar of ${d.name}`}
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
