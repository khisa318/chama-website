import { useMemo } from "react";
import { Link } from "react-router";
import { Banknote, TrendingUp, CalendarDays, ShieldCheck, CheckCircle2, AlertCircle, ChevronRight, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChamaState } from "@/hooks/useChamaState";

export default function LoansWorkspace() {
  const { memberGroups } = useChamaState();

  const totalBorrowingPower = useMemo(() => {
    return memberGroups.reduce((acc, group) => acc + (group.availableLoanLimit || 0), 0);
  }, [memberGroups]);

  const activeLoans = useMemo(() => {
    const all = [];
    for (const group of memberGroups) {
      for (const loan of group.loans) {
        if (loan.status === "active") {
          all.push({ ...loan, groupName: group.name, groupId: group.id });
        }
      }
    }
    return all;
  }, [memberGroups]);

  const availableOffers = useMemo(() => {
    const all = [];
    for (const group of memberGroups) {
      for (const loan of group.loans) {
        if (loan.status === "available") {
          all.push({ ...loan, groupName: group.name, groupId: group.id, maxLimit: group.availableLoanLimit });
        }
      }
    }
    return all;
  }, [memberGroups]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      
      {/* 1. Hero Banner */}
      <div className="relative rounded-[32px] overflow-hidden card-shadow bg-card border border-border">
        <div className="absolute inset-0 amibank-gradient opacity-10 dark:opacity-[0.15]"></div>
        <div className="relative p-8 md:p-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center">
          <div className="w-24 h-24 rounded-[24px] overflow-hidden bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xl border-[4px] border-background/50">
            <Banknote className="w-10 h-10" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">Loans & Credit</h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed font-medium">
              Manage your active loans, review borrowing power across your chamas, and access fast liquidity with low-interest group rates.
            </p>
          </div>

          <div className="bg-background/80 backdrop-blur-xl rounded-[28px] p-7 border border-border w-full lg:w-auto shadow-sm min-w-[280px]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Total Borrowing Power</p>
            <p className="text-3xl font-extrabold text-foreground mb-4">KES {totalBorrowingPower.toLocaleString()}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/80 p-3 rounded-xl border border-border/50">
               <ShieldCheck className="w-4 h-4 text-primary" />
               Across {memberGroups.length} active groups
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Loans & Offers */}
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
              {activeLoans.map((loan, idx) => (
                <div key={`${loan.id}-${idx}`} className="bg-background border border-border rounded-[24px] p-6 hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[16px] bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                        <Banknote className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg">{loan.title}</p>
                        <p className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase mt-1">From {loan.groupName}</p>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xl font-extrabold text-foreground">KES {loan.amount.toLocaleString()}</p>
                      <p className="text-xs font-bold text-orange-500 mt-1 flex items-center sm:justify-end gap-1">
                        <CalendarDays className="w-3.5 h-3.5" /> Due in {loan.dueInDays} days
                      </p>
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
                    <Button className="w-full sm:w-auto rounded-[14px] font-bold h-10 px-6 whitespace-nowrap">
                      Make Payment
                    </Button>
                  </div>
                </div>
              ))}
              
              {activeLoans.length === 0 && (
                <div className="text-center py-10 bg-secondary/50 rounded-[24px] border border-border/50">
                  <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3 opacity-80" />
                  <p className="font-bold text-foreground">You are debt free!</p>
                  <p className="text-xs font-medium text-muted-foreground mt-2">You currently have no active loans in any group.</p>
                </div>
              )}
            </div>
          </div>

          {/* Available Offers */}
          <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
            <div className="flex items-center gap-3 text-primary mb-6">
              <HandCoins className="w-6 h-6" />
              <h2 className="text-2xl font-bold text-foreground">Pre-approved Offers</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {availableOffers.map((loan, idx) => (
                <div key={`${loan.id}-${idx}`} className="bg-background border border-border rounded-[24px] p-6 hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">{loan.groupName}</span>
                    <span className="text-xs font-bold text-muted-foreground">{loan.dueInDays} Days Max</span>
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{loan.title}</h3>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed flex-1">
                    Access group funds instantly based on your contribution history. No collateral required.
                  </p>
                  <div className="mt-6 space-y-4">
                    <div className="bg-secondary/50 rounded-[16px] p-3 text-center">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Up To</p>
                      <p className="text-xl font-extrabold text-foreground">KES {loan.amount.toLocaleString()}</p>
                    </div>
                    <Link to={`/app/groups/${loan.groupId}`}>
                      <Button className="w-full rounded-[14px] font-bold h-11 group">
                        Apply Now <ChevronRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              
              {availableOffers.length === 0 && (
                <div className="col-span-full text-center py-10 bg-secondary/50 rounded-[24px] border border-border/50">
                  <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="font-bold text-foreground">No current offers</p>
                  <p className="text-xs font-medium text-muted-foreground mt-2 max-w-sm mx-auto">There are no pre-approved loan windows available in your groups right now.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Borrowing Power Breakdown */}
        <div className="space-y-8">
          <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
            <h3 className="text-lg font-bold text-foreground mb-6">Group Borrowing Limits</h3>
            
            <div className="space-y-4">
              {memberGroups.map(group => (
                <div key={group.id} className="bg-background border border-border rounded-[20px] p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-[12px] bg-secondary flex items-center justify-center font-bold text-foreground shrink-0">
                      {group.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{group.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{group.groupType}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-muted-foreground">Your Stake</span>
                      <span className="font-bold text-foreground">KES {group.totalContributed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-muted-foreground">Group Fund</span>
                      <span className="font-bold text-foreground">KES {group.walletBalance.toLocaleString()}</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-border/50 flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-primary">Max Loan</span>
                      <span className="text-sm font-extrabold text-foreground">KES {group.availableLoanLimit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}

              {memberGroups.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm font-medium text-muted-foreground">Join a group to access credit.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
