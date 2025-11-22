"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import { useRouter } from "next/navigation";

export default function CreateOrgPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const router = useRouter();

  const createOrg = async () => {
    const res = await api.post("/orgs", { name, slug });
    const org = res.data.data;
    localStorage.setItem("orgId", org._id);
    router.push(`/organization/${org._id}/repos`);
  };

  return (
    <div className="p-10 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Create Organization</h1>

      <input
        className="border p-3 rounded w-full mb-4"
        placeholder="Organization Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="border p-3 rounded w-full mb-4"
        placeholder="Slug (unique)"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      <button
        onClick={createOrg}
        className="px-6 py-3 bg-black text-white rounded-lg"
      >
        Create
      </button>
    </div>
  );
}
