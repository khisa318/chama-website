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
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useChamaState } from "@/hooks/useChamaState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const contributionData = [
  { month: "Nov", amount: 5000, status: "paid" },
  { month: "Dec", amount: 5000, status: "paid" },
  { month: "Jan", amount: 5000, status: "paid" },
  { month: "Feb", amount: 5000, status: "paid" },
  { month: "Mar", amount: 5000, status: "paid" },
  { month: "Apr", amount: 5000, status: "pending" },
];

const transactionsData = [
  { id: "MPESA-QKW9X4M", date: "Today, 10:42 AM", ref: "RHK9X4MP2", type: "inflow", amount: 2000, status: "Completed", desc: "Contribution - Alpha Circle" },
  { id: "SYS-LND-841", date: "Yesterday, 3:15 PM", ref: "RHK8M2KL1", type: "outflow", amount: 15000, status: "Completed", desc: "Loan Disbursement" },
  { id: "SYS-DIV-840", date: "15 Apr, 09:00 AM", ref: "RHK7P9QX4", type: "inflow", amount: 3450, status: "Completed", desc: "Dividend Payout" },
  { id: "MPESA-QKW5L1Z", date: "10 Apr, 14:20 PM", ref: "RHK5L1ZW8", type: "inflow", amount: 5000, status: "Completed", desc: "Contribution - Beta Group" },
];

export default function AppHome() {
  const { user } = useAuth();
  const { memberGroups } = useChamaState();

  const myTotalContributedRaw = memberGroups.reduce(
    (sum, group) => sum + group.totalContributed,
    0
  );
  const myTotalContributed = myTotalContributedRaw > 0 ? myTotalContributedRaw : 125000;

  const groupPoolRaw = memberGroups.reduce(
    (sum, group) => sum + group.walletBalance,
    0
  );
  const groupPool = groupPoolRaw > 0 ? groupPoolRaw : 1250000;

  const myOutstandingLoans = 15000;
  const nextContributionAmount = 5000;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="amibank-gradient rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl card-shadow-lg transition-colors duration-200">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl transition-transform hover:scale-110 duration-700"></div>
        
        <div className="relative z-10 flex flex-col gap-8">
          {/* Top: User Profile & Main Balances */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="relative shrink-0">
                <Avatar className="w-16 h-16 border-2 border-white shadow-md">
                  <AvatarImage src={user?.avatar || undefined} />
                  <AvatarFallback className="text-xl text-primary bg-white font-bold">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-primary rounded-full"></div>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Welcome back, {user?.name?.split(" ")[0] || "Member"}!</h1>
                <p className="text-white/80 text-sm font-medium">Here is your financial summary.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-white/80 text-[10px] font-bold tracking-wider uppercase mb-1">Total Savings</p>
                <h2 className="text-lg md:text-2xl font-extrabold tracking-tight">KES {formatCurrency(myTotalContributed)}</h2>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-white/80 text-[10px] font-bold tracking-wider uppercase mb-1">Outstanding Loan</p>
                <h2 className="text-lg md:text-xl font-bold tracking-tight mt-1.5">KES {formatCurrency(myOutstandingLoans)}</h2>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-white/80 text-[10px] font-bold tracking-wider uppercase mb-1">Next Contribution</p>
                <h2 className="text-lg md:text-xl font-bold tracking-tight mt-1.5">KES {formatCurrency(nextContributionAmount)}</h2>
                <p className="text-amber-300 text-[10px] font-bold mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Due in 3 days</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-white/80 text-[10px] font-bold tracking-wider uppercase mb-1">Available Pool</p>
                <h2 className="text-lg md:text-xl font-bold tracking-tight mt-1.5">KES {formatCurrency(groupPool)}</h2>
              </div>
            </div>
          </div>

          {/* Bottom: Actions Row */}
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

      {/* Quick Tools Row (Horizontal) */}
      <div className="flex flex-wrap md:flex-nowrap gap-4">
        <Link to="/app/contributions" className="flex-1 flex items-center gap-4 p-5 bg-card rounded-[24px] border border-border hover:border-primary/30 transition-all hover-lift hover:shadow-md group">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white transition-colors">
            <HandCoins className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-foreground">Deposit Funds</span>
        </Link>
        <Link to="/app/loans" className="flex-1 flex items-center gap-4 p-5 bg-card rounded-[24px] border border-border hover:border-primary/30 transition-all hover-lift hover:shadow-md group">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white transition-colors">
            <Banknote className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-foreground">Apply for Loan</span>
        </Link>
        <Link to="/app/expenses" className="flex-1 flex items-center gap-4 p-5 bg-card rounded-[24px] border border-border hover:border-primary/30 transition-all hover-lift hover:shadow-md group">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white transition-colors">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-foreground">Record Expense</span>
        </Link>
        <Link to="/app/chat" className="flex-1 flex items-center gap-4 p-5 bg-card rounded-[24px] border border-border hover:border-primary/30 transition-all hover-lift hover:shadow-md group">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white transition-colors">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-foreground">Khisa AI</span>
        </Link>
      </div>

      {/* Stat Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-[24px] p-6 border border-border flex items-center justify-between shadow-sm hover-lift">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Savings Rank</span>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-extrabold text-foreground">#2</h3>
              <span className="text-sm font-medium text-muted-foreground">of 12 members</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Crown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card rounded-[24px] p-6 border border-border flex items-center justify-between shadow-sm hover-lift">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Progress</span>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-extrabold text-foreground">8 / 12</h3>
              <span className="text-sm font-medium text-muted-foreground">paid this month</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card rounded-[24px] p-6 border border-border flex items-center justify-between shadow-sm hover-lift">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">My Groups</span>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-extrabold text-foreground">{memberGroups.length || 3}</h3>
              <span className="text-sm font-medium text-muted-foreground">Active memberships</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column (Transactions + Chart) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Contribution Chart */}
          <div className="bg-card rounded-[32px] p-7 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">Savings Trend</h3>
                <p className="text-sm text-muted-foreground">Your 6-month contribution history</p>
              </div>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 6, 6]} barSize={40}>
                    {contributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.status === 'pending' ? '#fbbf24' : 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-card rounded-[32px] p-7 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Transaction History</h3>
              <Button variant="ghost" size="sm" className="h-8 px-3 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80">View all</Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="pb-3 font-bold text-xs text-muted-foreground uppercase tracking-wider">Transaction</th>
                    <th className="pb-3 font-bold text-xs text-muted-foreground uppercase tracking-wider">Date & M-Pesa Ref</th>
                    <th className="pb-3 font-bold text-xs text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="pb-3 font-bold text-xs text-muted-foreground uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {transactionsData.map((txn, idx) => (
                    <tr key={idx} className="hover:bg-secondary/30 transition-colors group">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${txn.type === 'inflow' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {txn.type === 'inflow' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm">{txn.desc}</p>
                            <p className="text-xs text-muted-foreground">{txn.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="text-sm font-medium text-foreground">{txn.date}</p>
                        <p className="text-xs text-muted-foreground font-mono">{txn.ref}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className={`text-sm font-extrabold ${txn.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.type === 'inflow' ? '+' : '-'}KES {formatCurrency(txn.amount)}
                        </p>
                      </td>
                      <td className="py-4 text-right">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold rounded-lg shadow-sm">
                          {txn.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (Groups Panel + Quick Actions) */}
        <div className="space-y-8">
          
          {/* Groups Panel */}
          <div className="bg-card rounded-[32px] p-7 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Group Status</h3>
              <Link to="/app/community">
                <Button variant="ghost" className="text-primary hover:bg-secondary font-bold text-xs p-0 h-auto px-2 py-1 rounded-md">See all</Button>
              </Link>
            </div>

            <div className="space-y-6">
              {[
                { name: "Alpha Circle", members: 12, paid: 9 },
                { name: "Beta Investors", members: 8, paid: 6 },
                { name: "Family Fund", members: 15, paid: 15 }
              ].map((group, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm text-foreground">
                        {group.name.charAt(0)}
                      </div>
                      <p className="font-bold text-sm text-foreground">{group.name}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs font-bold bg-background shadow-sm border border-border">
                      {group.paid}/{group.members} paid
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${group.paid === group.members ? 'bg-green-500' : 'bg-primary'}`} 
                      style={{ width: `${(group.paid / group.members) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Upcoming */}
          <div className="bg-card rounded-[32px] p-7 border border-border shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 rounded-[20px] border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-foreground">Invite Members</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Grow your circle</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
              
              <button className="w-full flex items-center justify-between p-4 rounded-[20px] border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-foreground">Record Offline Pay</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Log manual cash</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
              
              <button className="w-full flex items-center justify-between p-4 rounded-[20px] border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-foreground">Welfare Claim</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Request emergency funds</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Upcoming Event</h3>
              <div className="flex items-start gap-4 p-4 rounded-[20px] bg-secondary/30 border border-border">
                <div className="w-12 h-12 rounded-xl bg-card border border-border flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[10px] font-bold text-primary uppercase leading-tight">Apr</span>
                  <span className="text-lg font-extrabold text-foreground leading-tight">24</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Monthly Meeting</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 4:00 PM • Google Meet
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
