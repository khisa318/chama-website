import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Banknote, TrendingUp, CalendarDays, ShieldCheck, CheckCircle2, AlertCircle, ChevronRight, HandCoins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoansWorkspace() {
  const { user } = useAuth();
  const { data: loans, isLoading: loansLoading } = trpc.loan.listMyLoans.useQuery();
  const { data: groups, isLoading: groupsLoading } = trpc.group.listMyGroups.useQuery();
  const stkPushMutation = trpc.mpesa.initiateSTKPush.useMutation();

  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const activeLoans = useMemo(() => loans?.filter(l => l.status === "active") || [], [loans]);
  const pendingLoans = useMemo(() => loans?.filter(l => l.status === "pending") || [], [loans]);

  const totalBorrowingPower = useMemo(() => {
    // In a real app, this would be a complex calculation based on group rules
    // For now, we'll sum some mock potential based on contributions
    return groups?.reduce((acc, g) => acc + (Number(g.targetAmount || 0) * 0.3), 0) || 0;
  }, [groups]);

  const handleRepayment = async (loanId: string, amount: number, groupId: string) => {
    setIsProcessing(loanId);
    try {
      await stkPushMutation.mutateAsync({
        groupId,
        amount,
        phoneNumber: user?.phone || "254700000000",
        description: `Loan Repayment`,
        transactionType: "repayment",
        targetId: loanId,
      });
      alert("STK Push sent! Please enter your PIN on your phone.");
    } catch (err: any) {
      alert(err.message || "Failed to initiate payment");
    } finally {
      setIsProcessing(null);
    }
  };

  if (loansLoading || groupsLoading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-8 p-6">
        <Skeleton className="h-48 w-full rounded-[32px]" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2 rounded-[32px]" />
          <Skeleton className="h-64 rounded-[32px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      
      {/* Hero Banner */}
      <div className="relative rounded-[32px] overflow-hidden card-shadow bg-card border border-border">
        <div className="absolute inset-0 amibank-gradient opacity-10"></div>
        <div className="relative p-8 md:p-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center">
          <div className="w-24 h-24 rounded-[24px] bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xl border-[4px] border-background/50">
            <Banknote className="w-10 h-10" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">Loans & Credit</h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed font-medium">
              Manage your active loans, review borrowing power across your chamas, and access fast liquidity with low-interest group rates.
            </p>
          </div>

          <div className="bg-background/80 backdrop-blur-xl rounded-[28px] p-7 border border-border w-full lg:w-auto shadow-sm min-w-[280px]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Estimated Borrowing Power</p>
            <p className="text-3xl font-extrabold text-foreground mb-4">KES {totalBorrowingPower.toLocaleString()}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/80 p-3 rounded-xl border border-border/50">
               <ShieldCheck className="w-4 h-4 text-primary" />
               Across {groups?.length || 0} active groups
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Loans */}
          <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-primary">
                <TrendingUp className="w-6 h-6" />
                <h2 className="text-2xl font-bold text-foreground">Active Loans</h2>
              </div>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{activeLoans.length} active</span>
            </div>

            <div className="space-y-4">
              {activeLoans.map((loan) => (
                <div key={loan.id} className="bg-background border border-border rounded-[24px] p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[16px] bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                        <Banknote className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg">{loan.reason}</p>
                        <p className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase mt-1">Due {new Date(loan.dueDate || "").toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xl font-extrabold text-foreground">KES {loan.amount.toLocaleString()}</p>
                      <p className="text-xs font-bold text-orange-500 mt-1">Interest: {loan.interestRate}%</p>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-[16px] p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="w-full">
                      <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                        <span>Repayment Progress</span>
                        <span>0%</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden w-full">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: '5%' }}></div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleRepayment(loan.id, Number(loan.amount), loan.groupId)} 
                      disabled={!!isProcessing}
                      className="w-full sm:w-auto rounded-[14px] font-bold h-10 px-6 whitespace-nowrap"
                    >
                      {isProcessing === loan.id ? <Loader2 className="animate-spin" /> : "Make Payment"}
                    </Button>
                  </div>
                </div>
              ))}
              
              {activeLoans.length === 0 && (
                <div className="text-center py-10 bg-secondary/50 rounded-[24px] border border-border/50">
                  <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3 opacity-80" />
                  <p className="font-bold text-foreground">You are debt free!</p>
                  <p className="text-xs font-medium text-muted-foreground mt-2">You currently have no active loans.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Applications */}
          {pendingLoans.length > 0 && (
            <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
              <div className="flex items-center gap-3 text-primary mb-6">
                <CalendarDays className="w-6 h-6" />
                <h2 className="text-2xl font-bold text-foreground">Pending Applications</h2>
              </div>
              <div className="space-y-4">
                {pendingLoans.map((loan) => (
                  <div key={loan.id} className="bg-background border border-border rounded-[24px] p-5 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{loan.reason}</p>
                      <p className="text-xs text-muted-foreground">KES {loan.amount.toLocaleString()} requested</p>
                    </div>
                    <span className="bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Under Review
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
            <h3 className="text-lg font-bold text-foreground mb-6">Group Borrowing Limits</h3>
            <div className="space-y-4">
              {groups?.map(group => (
                <div key={group.id} className="bg-background border border-border rounded-[20px] p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-[12px] bg-secondary flex items-center justify-center font-bold text-foreground shrink-0">
                      {group.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{group.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{group.type}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border/50 flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-primary">Interest Rate</span>
                    <span className="text-sm font-extrabold text-foreground">{group.loanInterestRate}%</span>
                  </div>
                  <Link to={`/app/groups/${group.id}`}>
                    <Button variant="ghost" className="w-full mt-4 text-xs font-bold">Apply in Group</Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
