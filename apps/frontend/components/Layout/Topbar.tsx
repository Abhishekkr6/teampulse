"use client";

import { useEffect, useState } from "react";
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
  Users,
  X,
  Settings as SettingsIcon,
} from "lucide-react";
import { FloatingDock } from "../Ui/floating-dock";
import { useUserStore } from "../../store/userStore";
import { getBackendBase } from "../../lib/api";

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
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export default function Topbar() {
  const { user, loading } = useUserStore() as { user: User | null; loading: boolean };
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleMobileNav = () => setMobileNavOpen((prev) => !prev);
  const closeMobileNav = () => setMobileNavOpen(false);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    // Prevent background scroll while the mobile navigation drawer is visible.
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileNav();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileNavOpen]);

  // Bootstrap user on mount (single run, no dependencies)
  useEffect(() => {
    const { fetchUser } = useUserStore.getState();
    fetchUser();
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const renderNavLinks = (className?: string) =>
    navLinks.map(({ name, href, icon: Icon }) => {
      const active = isActive(href);
      return (
        <Link
          key={href}
          href={href}
          onClick={closeMobileNav}
          className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 transition-colors ${
            active
              ? "bg-indigo-100 text-indigo-700"
              : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
          } ${className ?? ""}`.trim()}
        >
          <Icon className="h-4 w-4" />
          {name}
        </Link>
      );
    });

  const dockItems = navLinks.map(({ name, href, icon: Icon }) => ({
    title: name,
    href,
    icon: <Icon className="h-4 w-4" />,
    isActive: isActive(href),
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex w-full flex-wrap items-center gap-3 py-3">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-slate-100/80"
            aria-label="TeamPulse home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm">
              TP
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-slate-900">TeamPulse</p>
              <p className="hidden text-xs text-slate-500 sm:block">Developer Activity</p>
            </div>
          </Link>
          <div className="ml-auto hidden items-center gap-3 md:flex">
            <div className="relative hidden md:block md:w-48 lg:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search..."
                className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="button"
              className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-indigo-500 hover:text-indigo-600 md:flex"
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
                <button
                  type="button"
                  onClick={() => {
                    try {
                      useUserStore.getState().logout().then(() => {
                        window.location.href = "/";
                      });
                    } catch {}
                  }}
                  className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm">
                <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
                <div className="hidden sm:block">
                  <div className="h-3 w-24 rounded bg-slate-200 animate-pulse mb-1" />
                  <div className="h-2 w-32 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-indigo-500 hover:text-indigo-600"
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
              <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse" />
            )}

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-indigo-500 hover:text-indigo-600"
              onClick={toggleMobileNav}
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white/95">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-2 py-2 sm:px-4 lg:px-8">
          <FloatingDock
            items={dockItems}
            desktopClassName="h-14 bg-white/90 px-6 pb-3 shadow-sm ring-1 ring-slate-200"
            mobileClassName="w-full"
          />
        </div>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeMobileNav}
          />
          <aside className="absolute inset-y-0 right-0 flex w-80 max-w-[80vw] translate-x-0 bg-white shadow-2xl">
            <div className="flex h-full w-full flex-col gap-6 p-6" id="mobile-navigation">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm">
                    TP
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">TeamPulse</p>
                    <p className="text-xs text-slate-500">Developer Activity</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-indigo-500 hover:text-indigo-600"
                  onClick={closeMobileNav}
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <nav className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                {renderNavLinks("w-full")}
              </nav>

              {user ? (
                <div className="mt-auto flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <Image
                    src={user.avatarUrl}
                    alt={`${user.name}'s avatar`}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full border border-slate-200"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    {user.email && <p className="text-xs text-slate-500">{user.email}</p>}
                  </div>
                </div>
              ) : (
                <div className="mt-auto flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-3 w-24 rounded bg-slate-200 animate-pulse mb-1" />
                    <div className="h-2 w-32 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
