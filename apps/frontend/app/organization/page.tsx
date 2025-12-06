"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import { useRouter } from "next/navigation";
import { Card } from "../../components/Ui/Card";
import { useUserStore } from "../../store/userStore";

export default function CreateOrgPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const router = useRouter();
  const { setActiveOrgId, fetchUser } = useUserStore((state) => ({
    setActiveOrgId: state.setActiveOrgId,
    fetchUser: state.fetchUser,
  }));

  const createOrg = async () => {
    const res = await api.post("/orgs", { name, slug });
    const { org, defaultOrgId } = res.data.data;

    const activeOrgId = defaultOrgId ?? org?._id;
    if (!org?._id || !activeOrgId) {
      throw new Error("Organization payload missing identifiers");
    }

    setActiveOrgId(activeOrgId.toString());
    await fetchUser();
    router.push(`/organization/${org._id}/repos`);
  };

  const disabled = name.trim().length === 0 || slug.trim().length === 0;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Create Organization</h1>
          <p className="mt-2 text-sm text-slate-500">
            Spin up a workspace to connect repos and start streaming activity.
          </p>
        </div>

        <Card className="rounded-2xl border-0 bg-white p-6 shadow-md">
          <div className="space-y-4">
            <div>
              <label htmlFor="org-name" className="text-sm font-medium text-slate-700">
                Organization name
              </label>
              <input
                id="org-name"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Acme Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="org-slug" className="text-sm font-medium text-slate-700">
                Slug (unique)
              </label>
              <input
                id="org-slug"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="acme-dev"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <button
              onClick={createOrg}
              disabled={disabled}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Create organization
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
