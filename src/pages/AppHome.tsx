import { Link } from "react-router";
import {
  Banknote,
  HandCoins,
  Users,
  ChevronRight,
  MessageCircle,
  CreditCard,
  Crown,
  FileText,
  UserPlus,
  HeartHandshake,
  Activity,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function AppHome() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.group.getDashboardStats.useQuery();
  const { data: myGroups, isLoading: groupsLoading } = trpc.group.listMyGroups.useQuery();
  const { data: activity, isLoading: activityLoading } = trpc.audit.getRecentForUser.useQuery({ limit: 5 });

  if (statsLoading || groupsLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 p-8">
        <Skeleton className="h-64 rounded-[32px]" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-[24px]" />)}
        </div>
        <div className="grid grid-cols-3 gap-8">
          <Skeleton className="col-span-2 h-96 rounded-[32px]" />
          <Skeleton className="h-96 rounded-[32px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="amibank-gradient rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl card-shadow-lg transition-colors duration-200">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl transition-transform hover:scale-110 duration-700"></div>
        
        <div className="relative z-10 flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="relative shrink-0">
                <Avatar className="w-16 h-16 border-2 border-white shadow-md">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback className="text-xl text-primary bg-white font-bold">{user?.full_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-primary rounded-full"></div>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Welcome back, {user?.full_name?.split(" ")[0] || "Member"}!</h1>
                <p className="text-white/80 text-sm font-medium">Here is your financial summary.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-white/80 text-[10px] font-bold tracking-wider uppercase mb-1">Total Savings</p>
                <h2 className="text-lg md:text-2xl font-extrabold tracking-tight">KES {formatCurrency(stats?.totalContributed || 0)}</h2>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-white/80 text-[10px] font-bold tracking-wider uppercase mb-1">Active Loans</p>
                <h2 className="text-lg md:text-xl font-bold tracking-tight mt-1.5">{stats?.activeLoans || 0} active</h2>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-white/80 text-[10px] font-bold tracking-wider uppercase mb-1">My Groups</p>
                <h2 className="text-lg md:text-xl font-bold tracking-tight mt-1.5">{stats?.groupCount || 0}</h2>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-white/80 text-[10px] font-bold tracking-wider uppercase mb-1">Available Balance</p>
                <h2 className="text-lg md:text-xl font-bold tracking-tight mt-1.5">KES {formatCurrency(stats?.availableBalance || 0)}</h2>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <Link to="/app/contributions" className="flex-1">
              <Button className="w-full bg-white text-primary hover:bg-gray-100 shadow-lg font-bold rounded-[16px] h-12 transition-all hover:scale-[1.02]">
                <HandCoins className="w-4 h-4 mr-2" />
                Deposit
              </Button>
            </Link>
            <Link to="/app/loans" className="flex-1">
              <Button className="w-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/30 font-bold rounded-[16px] h-12 transition-all hover:scale-[1.02]">
                <Banknote className="w-4 h-4 mr-2" />
                Request Loan
              </Button>
            </Link>
            <Link to="/app/reports" className="flex-1">
              <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 hover:text-white font-bold bg-transparent rounded-[16px] h-12 transition-all hover:scale-[1.02]">
                <FileText className="w-4 h-4 mr-2" />
                Statement
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap md:flex-nowrap gap-4">
        <Link to="/app/contributions" className="flex-1 flex items-center gap-4 p-5 bg-card rounded-[24px] border border-border hover:border-primary/30 transition-all hover-lift group">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white transition-colors">
            <HandCoins className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-foreground">Deposit Funds</span>
        </Link>
        <Link to="/app/loans" className="flex-1 flex items-center gap-4 p-5 bg-card rounded-[24px] border border-border hover:border-primary/30 transition-all hover-lift group">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white transition-colors">
            <Banknote className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-foreground">Apply for Loan</span>
        </Link>
        <Link to="/app/chamas" className="flex-1 flex items-center gap-4 p-5 bg-card rounded-[24px] border border-border hover:border-primary/30 transition-all hover-lift group">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white transition-colors">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-foreground">Find Chamas</span>
        </Link>
        <Link to="/app/chat" className="flex-1 flex items-center gap-4 p-5 bg-card rounded-[24px] border border-border hover:border-primary/30 transition-all hover-lift group">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white transition-colors">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-foreground">Khisa AI</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card rounded-[32px] p-7 border border-border shadow-sm">
            <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
            
            {activityLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-6">
                {activity.map((log) => (
                  <div key={log.id} className="flex gap-4 items-start group">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Activity className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-primary font-bold">Audit</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-border rounded-2xl">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-bold">No recent activity found</p>
                <p className="text-sm text-muted-foreground">Start by making a contribution or joining a group.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card rounded-[32px] p-7 border border-border shadow-sm">
            <h3 className="text-xl font-bold mb-6">My Groups</h3>
            <div className="space-y-4">
              {myGroups?.map((group) => (
                <Link key={group.id} to={`/app/groups/${group.id}`} className="flex items-center justify-between p-4 rounded-2xl border border-border hover:bg-secondary/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {group.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{group.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{group.type}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </Link>
              ))}
              {myGroups?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">You are not a member of any groups.</p>
                  <Link to="/app/chamas">
                    <Button variant="link" className="text-primary font-bold">Join a group</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
