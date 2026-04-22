import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Landmark,
  LineChart,
  MessageSquare,
  PencilLine,
  Send,
  ShieldCheck,
  Users,
  Wallet,
  Crown,
  Activity,
  TrendingUp,
  Info,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Skeleton } from "@/components/ui/skeleton";

const groupTypeLabels: Record<string, string> = {
  savings: "Savings / Rotating",
  investment: "Investment",
  welfare: "Welfare",
  "table-banking": "Table Banking",
  business: "Business",
  "sacco-like": "SACCO-like",
  hybrid: "Hybrid",
};

export default function GroupDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: group, isLoading, error, refetch } = trpc.group.getById.useQuery({ id });
  const { data: members } = trpc.group.getMembers.useQuery({ groupId: id }, { enabled: !!group });
  const { data: contributions } = trpc.contribution.list.useQuery({ groupId: id }, { enabled: !!group });
  const { data: stats } = trpc.report.groupSummary.useQuery({ groupId: id }, { enabled: !!group });

  const joinMutation = trpc.group.joinByInvite.useMutation();
  const stkPushMutation = trpc.mpesa.initiateSTKPush.useMutation();
  const updateGroupMutation = trpc.group.update.useMutation();

  const [message, setMessage] = useState("");
  const [joinStep, setJoinStep] = useState<"preview" | "terms" | "confirm" | "payment" | "success">("preview");
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [joinMethod, setJoinMethod] = useState<"mpesa" | "bank" | "wallet">("mpesa");
  const [isProcessing, setIsProcessing] = useState(false);

  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionFeedback, setContributionFeedback] = useState("");

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 p-6">
        <Skeleton className="h-48 w-full rounded-[32px]" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2 rounded-[32px]" />
          <Skeleton className="h-64 rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-4xl mx-auto rounded-[32px] bg-card border border-border p-10 card-shadow text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-lg font-semibold text-foreground">Chama not found</p>
        <p className="mt-3 text-muted-foreground">{error?.message || "The group you requested could not be found or you lack access."}</p>
        <Link to="/app/chamas">
          <Button className="mt-6 rounded-[16px]">Return to Chamas</Button>
        </Link>
      </div>
    );
  }

  const userMembership = members?.find(m => m.userId === user?.id);
  const isMember = !!userMembership;
  const isAdmin = userMembership?.role === "admin" || userMembership?.role === "chairperson";

  const handleSendMessage = () => {
    // TODO: Implement chat mutation
    setMessage("");
  };

  const handleContribute = async () => {
    const amount = Number(contributionAmount);
    if (!amount) return;
    
    setIsProcessing(true);
    try {
      await stkPushMutation.mutateAsync({
        groupId: id,
        amount,
        phoneNumber: user?.phone || "254700000000",
        description: `Contribution for ${group.name}`,
        transactionType: "contribution",
      });
      setContributionFeedback("STK Push sent! Please check your phone.");
      setContributionAmount("");
    } catch (err: any) {
      setContributionFeedback(err.message || "Failed to initiate payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const processJoinPayment = async () => {
    setIsProcessing(true);
    try {
      await joinMutation.mutateAsync({ inviteCode: group.inviteCode || "" });
      setJoinStep("success");
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // --------------------------------------------------------------------------------
  // NON-MEMBER JOIN FLOW
  // --------------------------------------------------------------------------------
  if (!isMember && joinStep !== "success") {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex items-center">
          <Link to="/app/chamas" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors bg-card border border-border px-4 py-2 rounded-[14px] shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Discovery
          </Link>
        </div>

        <div className="rounded-[32px] overflow-hidden card-shadow bg-card border border-border">
          <div className="relative p-8 md:p-10 border-b border-border bg-gradient-to-br from-secondary/50 to-background">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-[20px] bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <span className="px-3 py-1 bg-secondary border border-border text-foreground text-[10px] font-bold rounded-full uppercase tracking-wider mb-2 inline-block">
                    {groupTypeLabels[group.type] || group.type}
                  </span>
                  <h1 className="text-3xl font-extrabold text-foreground">{group.name}</h1>
                </div>
              </div>
              {joinStep === "preview" && (
                <Button onClick={() => setJoinStep("terms")} className="rounded-[16px] px-8 h-12 font-bold text-base shadow-lg hover:-translate-y-1 transition-transform">
                  Join Now
                </Button>
              )}
            </div>
          </div>

          <div className="p-8 md:p-10">
            {joinStep === "preview" && (
              <div className="space-y-10">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">About this Chama</h3>
                  <p className="text-muted-foreground leading-relaxed">{group.description}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Target</p>
                    <p className="text-lg font-extrabold text-foreground">KES {group.targetAmount?.toLocaleString() || "N/A"}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Members</p>
                    <p className="text-lg font-extrabold text-foreground">{members?.length || 0}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Interest Rate</p>
                    <p className="text-lg font-extrabold text-foreground">{group.loanInterestRate}%</p>
                  </div>
                  <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                    <p className="text-lg font-extrabold text-foreground">{new Date(group.createdAt).getFullYear()}</p>
                  </div>
                </div>
              </div>
            )}

            {joinStep === "terms" && (
              <div className="max-w-2xl mx-auto space-y-6 text-center">
                <h2 className="text-2xl font-bold">Review Membership Terms</h2>
                <div className="bg-secondary/30 rounded-[24px] p-6 text-left border border-border">
                  <p className="text-sm text-muted-foreground mb-4">By joining this group, you agree to comply with all financial obligations and participation rules set by the committee.</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={acceptedRules} onChange={e => setAcceptedRules(e.target.checked)} className="w-5 h-5 accent-primary" />
                    <span className="text-sm font-bold">I accept the terms and conditions</span>
                  </label>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setJoinStep("preview")} className="flex-1">Back</Button>
                  <Button onClick={() => setJoinStep("confirm")} disabled={!acceptedRules} className="flex-1">Continue</Button>
                </div>
              </div>
            )}

            {joinStep === "confirm" && (
              <div className="max-w-md mx-auto space-y-6 text-center">
                <h2 className="text-2xl font-bold">Confirm Application</h2>
                <div className="bg-secondary/50 rounded-[24px] p-6 border border-border space-y-4">
                  <div className="flex justify-between font-bold">
                    <span>Group Name</span>
                    <span>{group.name}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setJoinStep("terms")} className="flex-1">Back</Button>
                  <Button onClick={processJoinPayment} disabled={isProcessing} className="flex-1">
                    {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm & Join"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------------
  // MEMBER DASHBOARD VIEW
  // --------------------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center">
        <Link to="/app/chamas" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors bg-card border border-border px-4 py-2 rounded-[14px] shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Chamas
        </Link>
      </div>

      <div className="relative rounded-[32px] overflow-hidden card-shadow bg-card border border-border">
        <div className="absolute inset-0 amibank-gradient opacity-10"></div>
        <div className="relative p-8 md:p-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center">
          <div className="w-24 h-24 rounded-[24px] bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xl border-[4px] border-background/50">
            <Users className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-background/50 border border-border text-foreground text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm backdrop-blur-md">
                {groupTypeLabels[group.type] || group.type}
              </span>
              {isAdmin && <span className="px-3 py-1 bg-orange-500/20 text-orange-500 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1"><Crown className="w-3 h-3"/> Admin</span>}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">{group.name}</h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed font-medium">{group.description}</p>
          </div>
          <div className="bg-background/80 backdrop-blur-xl rounded-[28px] p-7 border border-border w-full lg:w-auto shadow-sm min-w-[280px]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Current Value</p>
            <p className="text-3xl font-extrabold text-foreground mb-4">KES {stats?.currentInvestmentValue?.toLocaleString() || 0}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/80 p-3 rounded-xl border border-border/50">
               <TrendingUp className="w-4 h-4 text-primary" />
               Net Balance: KES {stats?.netBalance?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="h-12 bg-card border border-border rounded-[16px] p-1 mb-6">
          <TabsTrigger value="overview" className="rounded-xl font-bold px-6">Overview</TabsTrigger>
          <TabsTrigger value="members" className="rounded-xl font-bold px-6">Members</TabsTrigger>
          <TabsTrigger value="contributions" className="rounded-xl font-bold px-6">Contributions</TabsTrigger>
          <TabsTrigger value="loans" className="rounded-xl font-bold px-6">Loans</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl font-bold px-6">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-[32px] bg-card border border-border p-7 col-span-2">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity className="w-5 h-5" /> Performance</h3>
              <div className="h-64 flex items-end gap-2 pb-4">
                {/* Mock chart bars */}
                {[40, 60, 30, 90, 50, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/20 rounded-t-lg relative group">
                    <div className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all duration-500" style={{ height: `${h}%` }}></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[32px] bg-card border border-border p-7">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Quick Stats</h3>
              <div className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-2xl">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Total Contributions</p>
                  <p className="text-lg font-bold">KES {stats?.totalContributions.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-2xl">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Active Loan Debt</p>
                  <p className="text-lg font-bold">KES {stats?.activeLoanBalance.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members?.map((member, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-card border border-border rounded-[24px] p-5">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold">
                  {member.userName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{member.userName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contributions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-[32px] p-7">
              <h3 className="text-lg font-bold mb-4">Record Contribution</h3>
              <div className="space-y-4">
                <Input type="number" placeholder="Amount" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} />
                <Button onClick={handleContribute} className="w-full" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin" /> : "Pay via M-Pesa"}
                </Button>
                {contributionFeedback && <p className="text-xs text-center text-primary font-bold">{contributionFeedback}</p>}
              </div>
            </div>
            <div className="lg:col-span-2 bg-card border border-border rounded-[32px] p-7">
              <h3 className="text-lg font-bold mb-4">Contribution History</h3>
              <div className="space-y-3">
                {contributions?.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-secondary/30 rounded-2xl border border-border/50">
                    <div>
                      <p className="font-bold text-sm">KES {c.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{c.monthYear}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${c.status === 'paid' ? 'bg-green-500/20 text-green-600' : 'bg-orange-500/20 text-orange-600'}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {isAdmin && (
            <div className="max-w-2xl bg-card border border-border rounded-[32px] p-7">
              <h3 className="text-xl font-bold mb-6">Chama Settings</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase">Group Description</label>
                  <Textarea defaultValue={group.description} className="rounded-2xl" />
                </div>
                <Button className="w-full">Update Settings</Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
