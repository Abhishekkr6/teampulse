"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  ChevronDown,
  FolderGit2,
  GitPullRequest,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useUserStore } from "../../store/userStore";

type User = {
  name: string;
  avatarUrl: string;
  email?: string;
};

const navLinks = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Activity", href: "/dashboard/activity", icon: Activity },
  { name: "Pull Requests", href: "/dashboard/prs", icon: GitPullRequest },
  { name: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { name: "Developers", href: "/dashboard/developers", icon: Users },
  { name: "Repositories", href: "/dashboard/repos", icon: FolderGit2 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Topbar() {
  const { user } = useUserStore() as { user: User | null };
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleMobileNav = () => setMobileNavOpen((prev) => !prev);
  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex w-full flex-wrap items-center gap-3 lg:flex-nowrap">
          <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm">
            TP
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">TeamPulse</p>
            <p className="text-xs text-slate-500">Developer Activity</p>
          </div>
        </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:text-indigo-600"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </button>

            {user ? (
              <Image
                src={user.avatarUrl}
                alt={`${user.name}'s avatar`}
                width={32}
                height={32}
                className="h-9 w-9 rounded-full border border-slate-200"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-slate-200" />
            )}

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-indigo-500 hover:text-indigo-600"
              onClick={toggleMobileNav}
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
            {navLinks.map(({ name, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileNav}
                  className={`flex items-center gap-2 rounded-full px-3 py-2 transition-colors ${
                    active
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 w-full md:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search..."
                className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="ml-auto hidden w-full items-center justify-end gap-3 lg:flex lg:w-auto">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search..."
                className="h-10 w-64 rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="button"
              className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:text-indigo-600 lg:flex"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </button>

            <button
              type="button"
              className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-indigo-500 hover:text-indigo-600 md:flex"
            >
              Team
              <ChevronDown className="h-4 w-4" />
            </button>

            {user ? (
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm">
                <Image
                  src={user.avatarUrl}
                  alt={`${user.name}'s avatar`}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full"
                />
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  {user.email && <p className="text-xs text-slate-500">{user.email}</p>}
                </div>
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-200" />
            )}
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto border-t border-slate-200 bg-white lg:hidden">
        <nav className="flex w-full items-center gap-1 px-4 py-2 text-sm">
          {navLinks.map(({ name, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobileNav}
                className={`flex items-center gap-2 rounded-full px-3 py-2 transition-colors ${
                  active
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                }`}
              >
                <Icon className="h-4 w-4" />
                {name}
              </Link>
            );
          })}
        </nav>
      </div>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 px-4 pt-24 backdrop-blur-sm lg:hidden"
          onClick={closeMobileNav}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Navigate</p>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-indigo-500 hover:text-indigo-600"
                onClick={closeMobileNav}
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              {navLinks.map(({ name, href, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobileNav}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-colors ${
                      active
                        ? "bg-indigo-100 text-indigo-700"
                        : "hover:bg-slate-100 hover:text-indigo-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
