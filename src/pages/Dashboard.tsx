import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  HandCoins,
  Users,
  CreditCard,
  Banknote,
  ChevronRight,
  PiggyBank,
  Sparkles,
  Settings,
  MessageCircle,
  TrendingUp,
  Calendar,
  Crown,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: dashboardData } = trpc.group.dashboardGroups.useQuery();
  const { data: dashboardAnalytics } = trpc.group.dashboardAnalytics.useQuery();
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const { data: groupDetails } = trpc.group.getById.useQuery(
    { id: selectedGroup?.id },
    { enabled: !!selectedGroup }
  );
  const { data: analytics } = trpc.group.getAnalytics.useQuery(
    { groupId: selectedGroup?.id },
    { enabled: !!selectedGroup }
  );
  const { data: messages, refetch: refetchMessages } = trpc.group.getMessages.useQuery(
    { groupId: selectedGroup?.id },
    { enabled: !!selectedGroup }
  );
  const sendMessage = trpc.group.sendMessage.useMutation();

export default function Dashboard() {
  const { user } = useAuth();
  const { data: dashboardData } = trpc.group.dashboardGroups.useQuery();
  const { data: dashboardAnalytics } = trpc.group.dashboardAnalytics.useQuery();
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const { data: groupDetails } = trpc.group.getById.useQuery(
    { id: selectedGroup?.id },
    { enabled: !!selectedGroup }
  );
  const { data: analytics } = trpc.group.getAnalytics.useQuery(
    { groupId: selectedGroup?.id },
    { enabled: !!selectedGroup }
  );
  const { data: messages, refetch: refetchMessages } = trpc.group.getMessages.useQuery(
    { groupId: selectedGroup?.id },
    { enabled: !!selectedGroup }
  );
  const sendMessage = trpc.group.sendMessage.useMutation();

  const quickActions = [
    { label: "Add Contribution", icon: HandCoins, path: "/contributions", color: "bg-violet-500" },
    { label: "Create Group", icon: Users, path: "/groups", color: "bg-blue-500" },
    { label: "Record Expense", icon: CreditCard, path: "/expenses", color: "bg-amber-500" },
    { label: "Request Loan", icon: Banknote, path: "/loans", color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header with User Info */}
      <div className="bg-white rounded-xl p-6 card-shadow border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback className="text-lg">{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}!</h1>
              <p className="text-muted-foreground">Manage your savings groups and track your progress</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Member since</p>
            <p className="font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Personal Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 card-shadow border border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">${dashboardAnalytics?.totalContributed.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground">Total Contributed</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Since you joined</p>
        </div>

        <div className="bg-white rounded-xl p-6 card-shadow border border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">${dashboardAnalytics?.totalLoansAvailable.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground">Loans Available</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Across all groups</p>
        </div>

        <div className="bg-white rounded-xl p-6 card-shadow border border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{dashboardAnalytics?.totalGroups || 0}</p>
              <p className="text-sm text-muted-foreground">Groups Joined</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Active memberships</p>
        </div>
      </div>

      {/* Your Groups */}
      <div className="bg-white rounded-xl p-6 card-shadow border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Your Groups</h2>
          <Link to="/app/community">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Browse More
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(dashboardData?.userGroups ?? []).map((group, i) => (
            group && (
              <div
                key={group.id}
                className="border border-border rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center text-white font-bold">
                    {group.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{group.name}</p>
                    <p className="text-sm text-muted-foreground">Joined {new Date(group.joinedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Your Contributions</span>
                    <span className="font-medium text-green-600">${group.totalContributed.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Loans Available</span>
                    <span className="font-medium text-blue-600">${group.loansAvailable.toFixed(2)}</span>
                  </div>
                </div>
                <Link to={`/app/groups/${group.id}`}>
                  <Button size="sm" className="w-full">
                    View Group Details
                  </Button>
                </Link>
              </div>
            )
          ))}
          {(!dashboardData?.userGroups || dashboardData.userGroups.length === 0) && (
            <div className="col-span-full text-center py-8">
              <PiggyBank className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium mb-2">No groups yet</p>
              <Link to="/app/community">
                <Button>Join or create a group</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Groups Being Managed - Only for Admins */}
      {dashboardData?.managedGroups && dashboardData.managedGroups.length > 0 && (
        <div className="bg-white rounded-xl p-6 card-shadow border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-semibold text-foreground">Groups Being Managed</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.managedGroups.filter((group): group is NonNullable<typeof group> => Boolean(group)).map((group, i) => (
              <div
                key={group.id}
                className="border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedGroup(group)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center text-white font-bold">
                    {group.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{group.name}</p>
                    <p className="text-sm text-muted-foreground">{group.memberCount} members</p>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    Admin
                  </Badge>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Group Balance</span>
                    <span className="font-medium">${Number(group.balance).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Contribution</span>
                    <span className="font-medium">${Number(group.monthlyContribution).toLocaleString()}</span>
                  </div>
                </div>
                <Button size="sm" className="w-full" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Group
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 card-shadow border border-border/50">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/app/contributions" className="flex flex-col items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-violet-500 flex items-center justify-center">
              <HandCoins className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-center">Add Contribution</span>
          </Link>
          <Link to="/app/loans" className="flex flex-col items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-center">Request Loan</span>
          </Link>
          <Link to="/app/expenses" className="flex flex-col items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-violet-500 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-center">Record Expense</span>
          </Link>
          <Link to="/app/chat" className="flex flex-col items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-center">Ask Khisa AI</span>
          </Link>
        </div>
      </div>

      {/* Group Details Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedGroup?.name} Management</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-3 mt-4">
              {groupDetails?.members ? (
                <div className="space-y-2">
                  {groupDetails.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{member.fullName?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.fullName || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Loading members...</p>
              )}
            </TabsContent>

            <TabsContent value="rules" className="space-y-3 mt-4">
              <div className="bg-white rounded-xl card-shadow border border-border/50 p-4">
                <h3 className="font-semibold mb-2">Group Rules</h3>
                <p className="text-muted-foreground">{selectedGroup?.description || "No rules defined."}</p>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-3 mt-4">
              {analytics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl card-shadow border border-border/50 p-4">
                      <h3 className="font-semibold text-foreground mb-3">Monthly Contributions</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={Object.entries(analytics.monthlyContributions).map(([month, amount]) => ({ month, amount }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                          <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-white rounded-xl card-shadow border border-border/50 p-4">
                      <h3 className="font-semibold text-foreground mb-3">Member Growth</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={Object.entries(analytics.memberGrowth).map(([month, count]) => ({ month, count }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl card-shadow border border-border/50 p-4">
                      <h3 className="font-semibold text-foreground mb-3">Performance</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Balance</span>
                          <span className="font-medium">${analytics.totalBalance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Monthly Target</span>
                          <span className="font-medium">${analytics.monthlyContribution.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl card-shadow border border-border/50 p-4">
                      <h3 className="font-semibold text-foreground mb-3">Loans</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Lent</span>
                          <span className="font-medium">${analytics.totalLoansLent.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl card-shadow border border-border/50 p-4">
                      <h3 className="font-semibold text-foreground mb-3">Activity</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Active Members (30d)</span>
                          <span className="font-medium">{analytics.activeMembersCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl card-shadow border border-border/50 p-6 text-center">
                  <p className="text-muted-foreground">Loading analytics...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="space-y-3 mt-4">
              <div className="bg-white rounded-xl card-shadow border border-border/50 p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Group Chat
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
                  {messages?.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{msg.user.name}</p>
                        <p className="text-sm text-muted-foreground">{msg.content}</p>
                        <p className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const content = formData.get("content") as string;
                    if (content.trim()) {
                      sendMessage.mutate(
                        { groupId: selectedGroup.id, content: content.trim() },
                        {
                          onSuccess: () => {
                            (e.target as HTMLFormElement).reset();
                            refetchMessages();
                          },
                        }
                      );
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="content"
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm"
                    required
                  />
                  <Button type="submit" size="sm">Send</Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
