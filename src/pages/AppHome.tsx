import { Link } from "react-router";
import {
  Banknote,
  HandCoins,
  ShieldCheck,
  Sparkles,
  Users,
  ChevronRight,
  PiggyBank,
  TrendingUp,
  MessageCircle,
  CreditCard,
  Settings,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useChamaState } from "@/hooks/useChamaState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function monthsSince(date: string) {
  const start = new Date(date);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth()) +
    1;
  return Math.max(months, 1);
}

function firstName(name?: string) {
  if (!name) return "Member";
  return name.split(" ")[0] || name;
}

export default function AppHome() {
  const { user } = useAuth();
  const { memberGroups, adminGroups } = useChamaState();

  const myTotalContributed = memberGroups.reduce(
    (sum, group) => sum + group.totalContributed,
    0
  );
  const myAvailableLoans = memberGroups.reduce(
    (sum, group) => sum + group.availableLoanLimit,
    0
  );
  const totalMembershipMonths = memberGroups.reduce(
    (sum, group) => sum + monthsSince(group.joinedAt || group.createdAt),
    0
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="relative rounded-[32px] overflow-hidden bg-card border border-border p-8 md:p-10 text-card-foreground card-shadow-lg transition-colors duration-200">
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            <div className="relative shrink-0">
              <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-background shadow-xl">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback className="text-xl text-white amibank-gradient font-bold">{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-card rounded-full shadow-lg"></div>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-xl font-extrabold tracking-tight mb-4 truncate max-w-[200px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[400px]" title={user?.name || ""}>{firstName(user?.name)}</h1>
              <div className="inline-flex items-center justify-center md:justify-start gap-2 bg-secondary px-4 py-2 rounded-full text-sm border border-border">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-foreground">Member for {totalMembershipMonths} months</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full md:w-auto flex justify-end">
            <div className="amibank-gradient rounded-[32px] p-8 w-full md:w-[380px] shadow-xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-card/10 blur-2xl transition-transform group-hover:scale-110 duration-700"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-white/90 text-sm font-bold tracking-wide uppercase">Total Contributions</p>
                <div className="p-2 bg-card/20 rounded-xl backdrop-blur-md">
                  <PiggyBank className="w-5 h-5 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold mb-8 tracking-tight relative z-10">
                KES {myTotalContributed.toLocaleString()}
              </h2>
              <div className="flex gap-4 relative z-10">
                <Link to="/app/contributions" className="flex-1">
                  <Button className="w-full bg-background text-foreground hover:bg-secondary shadow-lg font-bold rounded-[16px] h-12">
                    <HandCoins className="w-4 h-4 mr-2" />
                    Deposit
                  </Button>
                </Link>
                <Link to="/app/loans" className="flex-1">
                  <Button variant="outline" className="w-full border-background/30 text-background hover:bg-background/20 hover:text-background font-bold bg-transparent rounded-[16px] h-12">
                    <Banknote className="w-4 h-4 mr-2" />
                    Loan
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-[28px] p-6 border border-border card-shadow hover-lift group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-foreground">
              <Banknote className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Available</span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1">
            KES {myAvailableLoans.toLocaleString()}
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            Loans Available Across Groups
          </p>
        </div>

        <div className="bg-card rounded-[28px] p-6 border border-border card-shadow hover-lift group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-foreground">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Groups</span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1">
            {memberGroups.length}
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            Active Memberships
          </p>
        </div>

        <div className="rounded-[28px] p-6 border-2 border-dashed border-border/60 hover-lift group flex flex-col justify-center bg-transparent cursor-pointer transition-colors hover:border-primary/50 relative">
          <Link to="/app/community" className="absolute inset-0 z-20"></Link>
          <div className="text-center relative z-10">
            <div className="w-14 h-14 mx-auto rounded-[20px] bg-secondary flex items-center justify-center mb-4 text-foreground transition-transform group-hover:scale-110">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-1">Discover Groups</h3>
            <p className="text-sm text-muted-foreground font-medium">Find or create a new savings circle</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Column 1: My Portfolio & Admin Portal */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                <Users className="w-5 h-5 opacity-80" />
                My Portfolio
              </h2>
              <Link to="/app/community">
                <Button variant="ghost" className="text-foreground hover:bg-secondary font-bold rounded-xl text-xs px-2 h-8">
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {memberGroups.slice(0, 2).map(group => (
                <div
                  key={group.id}
                  className="bg-card rounded-[28px] p-6 border border-border card-shadow hover-lift group relative"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-[16px] bg-secondary flex items-center justify-center text-foreground font-extrabold text-lg">
                      {group.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground line-clamp-1">{group.name}</p>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5 tracking-wide uppercase">
                        Joined {new Date(group.joinedAt || group.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-background rounded-2xl p-4 border border-border mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Your Stake</span>
                      <span className="font-bold text-foreground text-sm">KES {group.totalContributed.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="amibank-gradient h-full rounded-full" style={{ width: `${Math.min(100, Math.max(10, (group.totalContributed / Math.max(group.walletBalance, 1)) * 100))}%` }}></div>
                    </div>
                  </div>
                  
                  <Link to={`/app/groups/${group.id}`}>
                    <Button className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-[16px] h-10 font-bold transition-all text-xs">
                      Dashboard
                    </Button>
                  </Link>
                </div>
              ))}

              {memberGroups.length === 0 && (
                <div className="bg-card rounded-[32px] p-8 border border-border card-shadow text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-secondary rounded-[20px] flex items-center justify-center mb-4">
                    <PiggyBank className="w-8 h-8 text-foreground opacity-80" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No active groups</h3>
                  <Link to="/app/community">
                    <Button className="rounded-[16px] px-6 h-10 font-bold text-xs shadow-md mt-2">Explore</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Groups Being Managed - Admin */}
          {adminGroups.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Crown className="w-5 h-5 text-orange-400" />
                <h2 className="text-xl font-bold text-foreground">Admin Portal</h2>
              </div>
              <div className="grid grid-cols-1 gap-5">
                {adminGroups.map(group => (
                  <div
                    key={group.id}
                    className="bg-card rounded-[28px] p-6 border border-border card-shadow hover-lift relative overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[14px] bg-secondary flex items-center justify-center font-bold text-foreground">
                            {group.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm">{group.name}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground">{group.memberCount} active</p>
                          </div>
                        </div>
                      </div>
                      
                      <Link to={`/app/groups/${group.id}`}>
                        <Button variant="outline" className="w-full bg-secondary/50 hover:bg-secondary border-transparent rounded-[14px] font-bold h-10 text-xs">
                          <Settings className="w-3.5 h-3.5 mr-2" />
                          Manage Settings
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Quick Tools */}
        <div className="bg-card rounded-[32px] p-7 border border-border card-shadow h-full min-h-[400px]">
          <h3 className="text-xl font-bold text-foreground mb-6">Quick Tools</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/app/contributions" className="flex flex-col items-center justify-center gap-3 p-5 bg-background rounded-[24px] border border-border hover:border-foreground/20 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground">
                <HandCoins className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-foreground">Deposit</span>
            </Link>
            
            <Link to="/app/loans" className="flex flex-col items-center justify-center gap-3 p-5 bg-background rounded-[24px] border border-border hover:border-foreground/20 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground">
                <Banknote className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-foreground">Borrow</span>
            </Link>
            
            <Link to="/app/expenses" className="flex flex-col items-center justify-center gap-3 p-5 bg-background rounded-[24px] border border-border hover:border-foreground/20 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-foreground">Expense</span>
            </Link>
            
            <Link to="/app/chat" className="flex flex-col items-center justify-center gap-3 p-5 bg-background rounded-[24px] border border-border hover:border-foreground/20 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-foreground">Khisa AI</span>
            </Link>
          </div>
        </div>
        
        {/* Column 3: Recent Activity */}
        <div className="bg-card rounded-[32px] p-7 border border-border card-shadow h-full min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">Activity</h3>
            <Button variant="ghost" size="sm" className="h-8 px-3 rounded-xl text-[10px] font-bold bg-secondary hover:bg-secondary/80">View all</Button>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-[14px] bg-secondary flex items-center justify-center text-foreground shrink-0">
                <HandCoins className="w-4 h-4 opacity-80" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Deposit recorded</p>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5 leading-snug">Monthly group deposit confirmed.</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1.5">2h ago</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-[14px] bg-secondary flex items-center justify-center text-foreground shrink-0">
                <Users className="w-4 h-4 opacity-80" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">New Member</p>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5 leading-snug">Sarah joined the Alpha Circle.</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1.5">Yesterday</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-[14px] bg-secondary flex items-center justify-center text-foreground shrink-0">
                <TrendingUp className="w-4 h-4 opacity-80" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Goal Reached!</p>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5 leading-snug">Alpha Circle hit 10k milestone.</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1.5">3d ago</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
