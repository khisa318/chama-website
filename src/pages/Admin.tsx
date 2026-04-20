import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Users,
  HandCoins,
  Banknote,
  Mail,
  MessageSquare,
  Shield,
  Search,
  Trash2,
  ChevronDown,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Admin() {
  const { data: stats, refetch: refetchStats } = trpc.admin.stats.useQuery();
  const { data: users, refetch: refetchUsers } = trpc.admin.userList.useQuery();
  const { data: contacts, refetch: refetchContacts } = trpc.contact.list.useQuery();
  const { data: messages } = trpc.message.list.useQuery();
  const { data: recentActivity } = trpc.admin.recentActivity.useQuery();
  const updateUserRole = trpc.admin.userUpdate.useMutation({ onSuccess: () => refetchUsers() });
  const deleteUser = trpc.admin.userDelete.useMutation({ onSuccess: () => { refetchUsers(); refetchStats(); } });
  const updateContactStatus = trpc.contact.updateStatus.useMutation({ onSuccess: () => refetchContacts() });

  const [userSearch, setUserSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const filteredUsers = (users ?? []).filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Total Groups", value: stats?.totalGroups ?? 0, icon: HandCoins, color: "text-violet-500", bg: "bg-violet-50" },
    { label: "Total Savings", value: `$${(stats?.totalSavings ?? 0).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Active Loans", value: stats?.activeLoans ?? 0, icon: Banknote, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Pending Contacts", value: stats?.pendingContacts ?? 0, icon: Mail, color: "text-red-500", bg: "bg-red-50" },
    { label: "Forum Messages", value: stats?.totalMessages ?? 0, icon: MessageSquare, color: "text-cyan-500", bg: "bg-cyan-50" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Admin Panel</h2>
          <p className="text-xs text-muted-foreground">Manage users, view analytics, monitor activity</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-card rounded-xl p-4 card-shadow border border-border">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="bg-card rounded-xl card-shadow border border-border divide-y divide-border/50">
            {filteredUsers.map((user) => (
              <div key={`${user.authType}-${user.id}`} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-white font-bold text-sm">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <Badge variant="outline" className="text-[10px]">{user.authType}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Select
                  defaultValue={user.role}
                  onValueChange={(value) =>
                    updateUserRole.mutate({ id: user.id, role: value as "user" | "admin" })
                  }
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm("Delete this user?")) {
                      deleteUser.mutate({ id: user.id });
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No users found</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <div className="bg-card rounded-xl card-shadow border border-border divide-y divide-border/50">
            {(contacts?.rows ?? []).map((contact) => (
              <div key={contact.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{contact.name}</p>
                    <span className="text-xs text-muted-foreground">{contact.email}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      contact.status === "new"
                        ? "bg-amber-100 text-amber-700"
                        : contact.status === "read"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                    }
                  >
                    {contact.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium mb-1">{contact.subject}</p>
                <p className="text-sm text-muted-foreground mb-2">{contact.message}</p>
                <div className="flex items-center gap-2">
                  <Select
                    defaultValue={contact.status}
                    onValueChange={(value) =>
                      updateContactStatus.mutate({ id: contact.id, status: value as "new" | "read" | "replied" })
                    }
                  >
                    <SelectTrigger className="w-28 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {(!contacts?.rows || contacts.rows.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">No contact submissions</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="bg-card rounded-xl card-shadow border border-border divide-y divide-border/50">
            {(recentActivity ?? []).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === "contribution" ? "bg-emerald-50" :
                  activity.type === "expense" ? "bg-red-50" : "bg-blue-50"
                }`}>
                  {activity.type === "contribution" ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : activity.type === "expense" ? (
                    <CreditCard className="w-4 h-4 text-red-500" />
                  ) : (
                    <Banknote className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description || activity.type}</p>
                  <p className="text-xs text-muted-foreground capitalize">{activity.type} - ${Number(activity.amount).toLocaleString()}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">No recent activity</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
