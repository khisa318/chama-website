import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useChamaState } from "@/hooks/useChamaState";
import { useRealtimeNotifications } from "@/hooks/useRealtime";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  WalletCards,
  X,
  Activity,
  HandCoins,
  CreditCard,
  MessageCircle,
  FileText,
  Bell
} from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";

const navItems = [
  { path: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/app/chamas", label: "Chamas", icon: Users },
  { path: "/app/contributions", label: "Contributions", icon: HandCoins },
  { path: "/app/expenses", label: "Expenses", icon: CreditCard },
  { path: "/app/loans", label: "My Loans", icon: WalletCards },
  { path: "/app/chat", label: "Khisa AI", icon: MessageCircle },
  { path: "/app/reports", label: "Statements", icon: FileText },
  { path: "/app/activity", label: "My Activity", icon: Activity },
  { path: "/app/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Force light mode
    document.documentElement.classList.remove('dark');
  }, []);

  // Real-time notifications
  useRealtimeNotifications(user?.id, (notification) => {
    // Show toast for new notification
    toast(notification.title || 'New notification', {
      description: notification.message,
      duration: 5000,
    });
    setUnreadCount((prev) => prev + 1);
  });

  const currentPage =
    navItems.find(item => location.pathname.startsWith(item.path))?.label ??
    "Dashboard";

  const sidebar = (
    <div className="h-full flex flex-col bg-card transition-colors duration-200">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl amibank-gradient flex items-center justify-center text-white shadow-lg">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-xl tracking-tight">Amibank</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-4 rounded-[16px] px-4 py-3.5 text-sm font-semibold transition-all duration-300 ${
                active
                  ? "bg-primary text-primary-foreground shadow-md translate-x-1"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-primary-foreground" : "opacity-80"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-6 border-t border-border">
        <div className="flex items-center gap-3 px-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-foreground shadow-sm">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground line-clamp-1">{user?.name || "Pro User"}</span>
            <span className="text-[11px] font-medium text-muted-foreground">Pro Account</span>
          </div>
        </div>
        <button
          onClick={() => void logout()}
          className="flex items-center gap-3 rounded-[16px] px-4 py-3.5 text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      <aside className="hidden lg:block w-[280px] shrink-0 border-r border-border bg-card relative z-30">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-[280px] z-50 bg-card border-r border-border transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-6 -right-14">
          <button
            onClick={() => setMobileOpen(false)}
            className="w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center text-foreground border border-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebar}
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="shrink-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border transition-colors duration-200">
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden w-11 h-11 rounded-[16px] bg-secondary text-foreground flex items-center justify-center transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {currentPage}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Dark mode removed per user request */}
              {/* Notification Bell */}
              <Link
                to="/app/notifications"
                className="relative w-11 h-11 rounded-[16px] bg-secondary text-foreground flex items-center justify-center transition-colors hover:bg-secondary/80"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
