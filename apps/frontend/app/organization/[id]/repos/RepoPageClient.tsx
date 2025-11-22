"use client";

import { useState, useEffect } from "react";
import { api } from "../../../../lib/api";

type Repo = {
  _id: string;
  name: string;
};

export default function RepoPageClient({ orgId }: { orgId: string }) {
  const [repoFullName, setRepoFullName] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);

  useEffect(() => {
    if (!orgId) return;

    api.get(`/orgs/${orgId}/repos`)
      .then((res) => setRepos(res.data.data))
      .catch(() => {});
  }, [orgId]);

  const connectRepo = async () => {
    console.log("repoFullName =", repoFullName);
    console.log("orgId =", orgId);

    const res = await api.post(`/orgs/${orgId}/repos/connect`, {
      repoFullName,
    });

    setRepos((prev) => [...prev, res.data.data]);
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl mb-4">Connect Repository</h1>

      <input
        className="border p-3 rounded w-full mb-4"
        placeholder="owner/repo"
        value={repoFullName}
        onChange={(e) => setRepoFullName(e.target.value)}
      />

      <button
        onClick={connectRepo}
        className="px-6 py-3 bg-black text-white rounded-lg"
      >
        Connect Repo
      </button>

      <h2 className="text-xl mt-8 mb-2">Connected Repos</h2>
      <ul className="list-disc ml-6">
        {repos.map((r) => (
          <li key={r._id}>{r.name}</li>
        ))}
      </ul>
    </div>
  );
}
