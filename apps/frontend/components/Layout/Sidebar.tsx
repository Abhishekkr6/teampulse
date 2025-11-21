"use client";

import Link from "next/link";

const links = [
  { name: "Overview", href: "/dashboard" },
  { name: "Activity", href: "/dashboard/activity" },
  { name: "PRs", href: "/dashboard/prs" },
  { name: "Alerts", href: "/dashboard/alerts" },
  { name: "Developers", href: "/dashboard/developers" },
  { name: "Repos", href: "/dashboard/repos" },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-white shadow-sm border-r p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-6">TeamPulse</h1>

      <nav className="flex flex-col gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="px-3 py-2 rounded hover:bg-gray-100 transition"
          >
            {l.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
