import { trpc } from "@/providers/trpc";
import {
  Clock,
  CheckCircle,
  Banknote,
  Megaphone,
  UserPlus,
  CreditCard,
  HandCoins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const typeConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  payment_reminder: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  contribution_received: { icon: HandCoins, color: "text-emerald-500", bg: "bg-emerald-50" },
  loan_approved: { icon: Banknote, color: "text-blue-500", bg: "bg-blue-50" },
  loan_declined: { icon: Banknote, color: "text-red-500", bg: "bg-red-50" },
  group_announcement: { icon: Megaphone, color: "text-violet-500", bg: "bg-violet-50" },
  member_joined: { icon: UserPlus, color: "text-blue-500", bg: "bg-blue-50" },
  expense_recorded: { icon: CreditCard, color: "text-red-500", bg: "bg-red-50" },
};

export default function Notifications() {
  const { data: notifications, refetch } = trpc.notification.list.useQuery();
  const markRead = trpc.notification.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.notification.markAllRead.useMutation({ onSuccess: () => refetch() });

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          Mark all read
        </Button>
      </div>

      <div className="bg-white rounded-xl card-shadow border border-border/50 divide-y divide-border/50">
        {(notifications ?? []).map((notif) => {
          const config = typeConfig[notif.type] || typeConfig.payment_reminder;
          const Icon = config.icon;
          return (
            <div
              key={notif.id}
              className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                !notif.read ? "bg-blue-50/50" : ""
              }`}
              onClick={() => {
                if (!notif.read) markRead.mutate({ id: notif.id });
              }}
            >
              <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{notif.title}</p>
                  {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                </div>
                {notif.message && (
                  <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notif.createdAt).toLocaleDateString()} at{" "}
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        {(!notifications || notifications.length === 0) && (
          <div className="p-8 text-center text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
