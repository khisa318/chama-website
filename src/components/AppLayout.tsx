import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useChamaState } from "@/hooks/useChamaState";
import {
  BadgePlus,
  Building2,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { path: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/app/community", label: "Community", icon: Users },
  { path: "/app/create-group", label: "Create Group", icon: BadgePlus },
  { path: "/app/loans", label: "Loans", icon: WalletCards },
  { path: "/app/members", label: "Members", icon: UserRound },
  { path: "/app/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { adminGroups } = useChamaState();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPage =
    navItems.find(item => location.pathname.startsWith(item.path))?.label ??
    "Khisa's Kitty";

  const sidebar = (
    <div className="h-full flex flex-col bg-white border-r border-sky-100">
      <div className="px-5 py-6 border-b border-sky-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-3xl gradient-accent flex items-center justify-center text-white shadow-md">
            <HandCoins className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Khisa's Kitty</p>
            <p className="text-xs text-slate-500">Savings app workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-sky-50 hover:text-slate-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-4">
        <div className="rounded-[28px] gradient-accent-soft border border-sky-100 px-4 py-5">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-sky-700">
            Quick links
          </p>
          <div className="space-y-2">
            <Link
              to="/app/create-group"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-white/75 px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
            >
              <BadgePlus className="w-4 h-4 text-sky-700" />
              Create a new group
            </Link>
            <Link
              to="/app/community"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
            >
              <Users className="w-4 h-4 text-sky-700" />
              Browse community
            </Link>
            <Link
              to="/app/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
            >
              <Settings className="w-4 h-4 text-sky-700" />
              Account settings
            </Link>
            {adminGroups.length > 0 && (
              <Link
                to={`/app/groups/${adminGroups[0].id}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
              >
                <Building2 className="w-4 h-4 text-sky-700" />
                Manage group
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-sky-100">
        <div className="rounded-[24px] bg-sky-50 px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">
            {user?.name || "Member"}
          </p>
          <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
        </div>
        <button
          onClick={() => void logout()}
          className="mt-3 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f9ff] flex">
      <aside className="hidden lg:block w-72 fixed inset-y-0 left-0 z-30">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/35 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-80 z-50 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setMobileOpen(false)}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>
        </div>
        {sidebar}
      </aside>

      <main className="flex-1 lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-sky-100">
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden w-10 h-10 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <p className="text-sm text-slate-500">Workspace</p>
                <h1 className="text-xl font-semibold text-slate-900">
                  {currentPage}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/app/community"
                className="hidden md:inline-flex rounded-full border border-sky-100 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
              >
                Join more groups
              </Link>
              <div className="w-10 h-10 rounded-full gradient-accent text-white flex items-center justify-center font-semibold shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || "K"}
              </div>
            </div>
          </div>
        </header>

        <div className="px-5 py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
