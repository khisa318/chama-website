import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
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
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useChamaState } from "@/hooks/useChamaState";

const groupTypeLabels: Record<string, string> = {
  savings: "Savings / Rotating",
  investment: "Investment",
  welfare: "Welfare",
  "table-banking": "Table Banking",
  business: "Business",
  "sacco-like": "SACCO-like",
  hybrid: "Hybrid",
};

function buildContributionHistory(walletBalance: number, months: number) {
  return Array.from({ length: Math.max(months, 1) }, (_, index) => ({
    label: `M${index + 1}`,
    amount: Math.round((walletBalance / Math.max(months, 1)) * (index + 1)),
  }));
}

function buildMemberGrowth(memberCount: number) {
  return Array.from({ length: 4 }, (_, index) => ({
    label: ["Start", "Growth", "Now - 1", "Now"][index],
    count: Math.max(1, Math.min(memberCount, Math.round(memberCount * ((index + 1) / 4)))),
  }));
}

function monthsActive(createdAt?: string) {
  if (!createdAt) return 1;
  const start = new Date(createdAt);
  const now = new Date();
  if (isNaN(start.getTime())) return 1;
  return Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1);
}

export default function GroupDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    getGroupById,
    updateGroup,
    sendMessage,
    joinGroup,
    contributeToGroup,
    withdrawFromGroup,
  } = useChamaState();
  const group = getGroupById(id);

  const [message, setMessage] = useState("");
  const [draftDescription, setDraftDescription] = useState(group?.description || "");
  const [draftMeetingDay, setDraftMeetingDay] = useState(group?.meetingDay || "");
  const [draftMonthlyContribution, setDraftMonthlyContribution] = useState(String(group?.monthlyContribution || 0));
  const [draftPayoutStyle, setDraftPayoutStyle] = useState(group?.payoutStyle || "");
  const [draftRules, setDraftRules] = useState(group?.rules?.join("\n") || "");

  // Join Flow States
  const [joinStep, setJoinStep] = useState<"preview" | "terms" | "confirm" | "payment" | "success">("preview");
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [joinMethod, setJoinMethod] = useState<"mpesa" | "bank" | "wallet">("mpesa");
  const [isProcessing, setIsProcessing] = useState(false);

  // Contribution/Withdrawal States
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionMethod, setContributionMethod] = useState<"mpesa" | "bank" | "wallet">("mpesa");
  const [contributionFeedback, setContributionFeedback] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"mpesa" | "bank" | "wallet">("mpesa");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawFeedback, setWithdrawFeedback] = useState("");

  const analytics = useMemo(() => {
    if (!group) return null;
    const activeMonths = monthsActive(group.createdAt);
    return {
      activeMonths,
      contributionHistory: buildContributionHistory(group.walletBalance || 0, Math.min(activeMonths, 6)),
      memberGrowth: buildMemberGrowth(group.memberCount || 1),
      averagePerMember: Math.round((group.totalContributed || 0) / Math.max(group.memberCount || 1, 1)),
    };
  }, [group]);

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto rounded-[32px] bg-card border border-border p-10 card-shadow text-center">
        <p className="text-lg font-semibold text-foreground">Chama not found</p>
        <p className="mt-3 text-muted-foreground">The group you requested could not be found or you lack access.</p>
        <Link to="/app/chamas">
          <Button className="mt-6 rounded-[16px]">Return to Chamas</Button>
        </Link>
      </div>
    );
  }

  const isMember = Boolean(group.role);
  const isAdmin = group.role === "admin";

  const handleSaveChanges = () => {
    updateGroup(group.id, {
      description: draftDescription.trim(),
      meetingDay: draftMeetingDay.trim(),
      monthlyContribution: Number(draftMonthlyContribution) || group.monthlyContribution,
      payoutStyle: draftPayoutStyle.trim(),
      rules: draftRules.split("\n").map(rule => rule.trim()).filter(Boolean),
    });
  };

  const handleSendMessage = () => {
    if (!message.trim() || !isMember) return;
    sendMessage(group.id, message.trim(), isAdmin ? "admin" : "member");
    setMessage("");
  };

  const handleContribute = () => {
    const amount = Number(contributionAmount) || group.monthlyContribution;
    if (!amount || !isMember) return;
    contributeToGroup(group.id, amount, contributionMethod);
    setContributionAmount("");
    setContributionFeedback("Contribution successfully recorded!");
    setTimeout(() => setContributionFeedback(""), 3000);
  };

  const handleWithdraw = () => {
    const amount = Number(withdrawAmount);
    if (!amount || !isAdmin) return;
    if (amount > (group.walletBalance || 0)) {
      setWithdrawFeedback("Amount exceeds wallet balance.");
      return;
    }
    withdrawFromGroup(group.id, amount, withdrawMethod, withdrawNote.trim() || "Admin withdrawal");
    setWithdrawAmount("");
    setWithdrawNote("");
    setWithdrawFeedback("Withdrawal approved.");
    setTimeout(() => setWithdrawFeedback(""), 3000);
  };

  const processPayment = () => {
    setIsProcessing(true);
    // Simulate network payment request
    setTimeout(() => {
      joinGroup(group.id, { acceptedTerms: true, paymentMethod: joinMethod });
      setIsProcessing(false);
      setJoinStep("success");
    }, 2000);
  };

  // --------------------------------------------------------------------------------
  // NON-MEMBER JOIN FLOW (Preview -> Terms -> Confirm -> Payment -> Success)
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
          {/* Header */}
          <div className="relative p-8 md:p-10 border-b border-border bg-gradient-to-br from-secondary/50 to-background">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-[20px] bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <span className="px-3 py-1 bg-secondary border border-border text-foreground text-[10px] font-bold rounded-full uppercase tracking-wider mb-2 inline-block">
                    {groupTypeLabels[group.groupType] || group.groupType}
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
            {/* Step: Preview */}
            {joinStep === "preview" && (
              <div className="space-y-10">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">About this Chama</h3>
                  <p className="text-muted-foreground leading-relaxed">{group.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Monthly</p>
                    <p className="text-lg font-extrabold text-foreground">KES {group.monthlyContribution?.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Members</p>
                    <p className="text-lg font-extrabold text-foreground">{group.memberCount} / {group.maxMembers}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Meeting Day</p>
                    <p className="text-lg font-extrabold text-foreground">{group.meetingDay}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Joining Fee</p>
                    <p className="text-lg font-extrabold text-foreground">KES {group.joinFee?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Core Rules</h3>
                    <ul className="space-y-3">
                      {group.rules?.slice(0, 3).map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><LineChart className="w-5 h-5 text-primary" /> Analytics Preview</h3>
                    <div className="bg-background rounded-[20px] p-5 border border-border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-foreground">Wallet Trajectory</p>
                        <p className="text-xs text-muted-foreground">Consistent growth over {analytics?.activeMonths} months.</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Terms */}
            {joinStep === "terms" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground">Review Rules & Terms</h2>
                  <p className="text-muted-foreground mt-2">Please read carefully before proceeding.</p>
                </div>
                
                <div className="bg-secondary/30 rounded-[24px] p-6 border border-border space-y-4 max-h-[300px] overflow-y-auto">
                  <h3 className="font-bold text-foreground flex items-center gap-2"><Info className="w-4 h-4" /> Chama Regulations</h3>
                  <ul className="space-y-3 pl-2 border-l-2 border-primary/20">
                    {group.rules?.map((rule, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground pl-3">{rule}</li>
                    ))}
                  </ul>
                  <div className="mt-6 p-4 bg-background rounded-xl border border-border text-sm text-muted-foreground">
                    By joining, you commit to making regular contributions of <strong className="text-foreground">KES {group.monthlyContribution?.toLocaleString()}</strong> per month. Failure to comply may result in penalties as outlined in the governance structure.
                  </div>
                </div>

                <label className="flex items-start gap-4 rounded-[20px] bg-secondary/50 p-5 cursor-pointer hover:bg-secondary transition-colors border border-transparent hover:border-border">
                  <input type="checkbox" checked={acceptedRules} onChange={e => setAcceptedRules(e.target.checked)} className="mt-1 w-5 h-5 accent-primary cursor-pointer" />
                  <span className="leading-relaxed font-medium text-foreground">I have read, understood, and agree to the rules and conditions of {group.name}.</span>
                </label>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setJoinStep("preview")} className="flex-1 rounded-[16px] h-12">Cancel</Button>
                  <Button onClick={() => setJoinStep("confirm")} disabled={!acceptedRules} className="flex-1 rounded-[16px] h-12 font-bold">Continue</Button>
                </div>
              </div>
            )}

            {/* Step: Confirm */}
            {joinStep === "confirm" && (
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground">Confirm Application</h2>
                  <p className="text-muted-foreground mt-2">Review your joining details.</p>
                </div>

                <div className="bg-secondary/50 rounded-[24px] p-6 border border-border">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-border/50">
                      <span className="text-sm font-medium text-muted-foreground">Chama Name</span>
                      <span className="font-bold text-foreground">{group.name}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-border/50">
                      <span className="text-sm font-medium text-muted-foreground">Monthly Contribution</span>
                      <span className="font-bold text-foreground">KES {group.monthlyContribution?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-foreground">Joining Fee (Due Now)</span>
                      <span className="font-extrabold text-primary text-lg">KES {group.joinFee?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setJoinStep("terms")} className="flex-1 rounded-[16px] h-12">Back</Button>
                  <Button onClick={() => setJoinStep("payment")} className="flex-1 rounded-[16px] h-12 font-bold">Proceed to Payment</Button>
                </div>
              </div>
            )}

            {/* Step: Payment */}
            {joinStep === "payment" && (
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Payment Required</h2>
                  <p className="text-muted-foreground mt-2">Pay KES {group.joinFee?.toLocaleString()} to activate your membership.</p>
                </div>

                <div className="space-y-4">
                  {(["mpesa", "bank", "wallet"] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => setJoinMethod(method)}
                      className={`w-full flex items-center justify-between p-4 rounded-[16px] border-2 transition-all ${
                        joinMethod === method ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <span className="font-bold text-foreground capitalize">{method === "mpesa" ? "M-Pesa" : method === "bank" ? "Bank Transfer" : "Khisa Wallet"}</span>
                      {joinMethod === method && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="outline" onClick={() => setJoinStep("confirm")} disabled={isProcessing} className="flex-1 rounded-[16px] h-12">Back</Button>
                  <Button onClick={processPayment} disabled={isProcessing} className="flex-1 rounded-[16px] h-12 font-bold bg-green-600 hover:bg-green-700 text-white">
                    {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</> : `Pay KES ${group.joinFee?.toLocaleString()}`}
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
  // FULL DASHBOARD VIEW (POST-JOIN / MEMBER)
  // --------------------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Success Banner (if just joined) */}
      {joinStep === "success" && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-[24px] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-green-700">Payment Successful!</h3>
              <p className="text-sm text-green-600/80">You are now an official member of {group.name}. Welcome to the dashboard.</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setJoinStep("preview")} className="text-green-700 hover:bg-green-500/20">Dismiss</Button>
        </div>
      )}

      <div className="flex items-center">
        <Link to="/app/chamas" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors bg-card border border-border px-4 py-2 rounded-[14px] shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Chamas
        </Link>
      </div>

      {/* Hero Banner (Member View) */}
      <div className="relative rounded-[32px] overflow-hidden card-shadow bg-card border border-border">
        <div className="absolute inset-0 amibank-gradient opacity-10"></div>
        <div className="relative p-8 md:p-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center">
          <div className="w-24 h-24 rounded-[24px] overflow-hidden bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xl border-[4px] border-background/50">
            {group.profileImage ? (
              <img src={group.profileImage} alt={group.name} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-10 h-10" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-background/50 border border-border text-foreground text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm backdrop-blur-md">
                {groupTypeLabels[group.groupType] || group.groupType}
              </span>
              {isAdmin && <span className="px-3 py-1 bg-orange-500/20 text-orange-500 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1"><Crown className="w-3 h-3"/> Admin</span>}
              {isMember && !isAdmin && <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Member</span>}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">{group.name}</h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed font-medium">{group.description}</p>
          </div>
          <div className="bg-background/80 backdrop-blur-xl rounded-[28px] p-7 border border-border w-full lg:w-auto shadow-sm min-w-[280px]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Total Balance</p>
            <p className="text-3xl font-extrabold text-foreground mb-4">KES {group.walletBalance?.toLocaleString() || 0}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/80 p-3 rounded-xl border border-border/50">
               <CalendarDays className="w-4 h-4 text-primary" />
               Next meeting: {group.nextContributionDate ? new Date(group.nextContributionDate).toLocaleDateString() : 'TBD'}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto pb-2 mb-2">
          <TabsList className="h-12 bg-card border border-border rounded-[16px] p-1 flex min-w-max w-auto">
            <TabsTrigger value="overview" className="rounded-xl font-bold px-6">Overview</TabsTrigger>
            <TabsTrigger value="members" className="rounded-xl font-bold px-6">Members</TabsTrigger>
            <TabsTrigger value="contributions" className="rounded-xl font-bold px-6">Contributions</TabsTrigger>
            <TabsTrigger value="loans" className="rounded-xl font-bold px-6">Loans</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl font-bold px-6">Analytics</TabsTrigger>
            <TabsTrigger value="rules" className="rounded-xl font-bold px-6">Settings</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Overview */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-[32px] bg-card border border-border p-7 card-shadow lg:col-span-2">
              <div className="flex items-center gap-3 text-primary mb-6">
                <Activity className="w-5 h-5" />
                <h3 className="text-xl font-bold text-foreground">Recent Activity</h3>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {group.ledger?.slice(0, 5).map((entry, idx) => (
                  <div key={idx} className="rounded-[20px] border border-border bg-background p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${entry.direction === "in" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{entry.note}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{entry.actorName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${entry.direction === "in" ? "text-green-500" : "text-red-500"}`}>
                        {entry.direction === "in" ? "+" : "-"}KES {entry.amount?.toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground uppercase">{new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {(!group.ledger || group.ledger.length === 0) && <p className="text-muted-foreground text-sm">No activity yet.</p>}
              </div>
            </div>

            <div className="rounded-[32px] bg-card border border-border p-6 card-shadow flex flex-col h-[400px]">
              <div className="flex items-center gap-3 text-primary mb-2">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-lg font-bold text-foreground">Group Chat</h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar mb-4 mt-2">
                {group.messages?.map((entry, idx) => (
                  <div key={idx} className="rounded-[16px] bg-secondary/50 p-3 border border-border/50">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-foreground text-xs">{entry.userName}</span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{entry.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Message..." className="rounded-[14px] bg-secondary/50" />
                <Button onClick={handleSendMessage} className="rounded-[14px] w-12 h-10 p-0 flex items-center justify-center shrink-0"><Send className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Members */}
        <TabsContent value="members" className="mt-6">
          <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-primary">
                <Users className="w-5 h-5" />
                <h3 className="text-xl font-bold text-foreground">Members Directory</h3>
              </div>
              <span className="bg-secondary text-foreground text-xs font-bold px-3 py-1 rounded-full">{group.memberCount} active</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.members?.map((member, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-background border border-border rounded-[20px] p-4">
                  <div className="w-12 h-12 rounded-[14px] bg-secondary flex items-center justify-center font-bold text-foreground shrink-0 text-lg">
                    {member.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-foreground text-sm truncate">{member.name}</p>
                      {member.role === "admin" && <Crown className="w-3.5 h-3.5 text-orange-500" />}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                      Status: <span className="text-green-500">Up to date</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Contributions */}
        <TabsContent value="contributions" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-[32px] bg-card border border-border p-7 card-shadow lg:col-span-1">
              <div className="flex items-center gap-3 text-primary mb-5">
                <CreditCard className="w-5 h-5" />
                <p className="font-bold text-foreground text-lg">Make Contribution</p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount (KES)</p>
                  <Input value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} placeholder={String(group.monthlyContribution)} type="number" className="rounded-[14px] h-11" />
                </div>
                <Button onClick={handleContribute} className="w-full rounded-[14px] h-11 font-bold">Contribute Now</Button>
                {contributionFeedback && <p className="text-xs font-bold text-green-600 bg-green-50 p-3 rounded-xl mt-2">{contributionFeedback}</p>}
              </div>
            </div>
            
            <div className="rounded-[32px] bg-card border border-border p-7 card-shadow lg:col-span-2">
              <div className="flex items-center gap-3 text-primary mb-5">
                <Wallet className="w-5 h-5" />
                <p className="font-bold text-foreground text-lg">Ledger</p>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {group.ledger?.filter(e => e.direction === 'in').map((entry, idx) => (
                  <div key={idx} className="rounded-[20px] border border-border bg-background p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[12px] bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{entry.note}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{entry.actorName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-500">+KES {entry.amount?.toLocaleString()}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground uppercase">{new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Loans */}
        <TabsContent value="loans" className="mt-6">
          <div className="rounded-[32px] bg-card border border-border p-10 card-shadow text-center">
            <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-foreground mb-2">Loan Management</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Active loans, repayment statuses, and new loan requests appear here based on Chama policies.</p>
            <Button className="mt-6 rounded-[16px] font-bold">Request a Loan</Button>
          </div>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="mt-6">
          <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
            <div className="flex items-center gap-3 text-primary mb-6">
              <LineChart className="w-5 h-5" />
              <h3 className="text-xl font-bold text-foreground">Chama Performance</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Wallet Trajectory</p>
                <div className="space-y-4">
                  {analytics?.contributionHistory?.map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                        <span>{item.label}</span>
                        <span className="text-foreground">KES {item.amount.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(10, (item.amount / (analytics.contributionHistory.at(-1)?.amount || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Member Growth</p>
                <div className="space-y-4">
                  {analytics?.memberGrowth?.map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                        <span>{item.label}</span>
                        <span className="text-foreground">{item.count} Members</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-sky-400 rounded-full" style={{ width: `${Math.max(10, (item.count / Math.max(group.memberCount, 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Rules / Settings */}
        <TabsContent value="rules" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
              <div className="flex items-center gap-3 text-primary mb-5">
                <ShieldCheck className="w-5 h-5" />
                <p className="font-bold text-foreground text-lg">Group Rules</p>
              </div>
              <div className="space-y-3">
                {group.rules?.map((rule, idx) => (
                  <div key={idx} className="rounded-[16px] bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground border border-border/50">
                    {rule}
                  </div>
                ))}
              </div>
            </div>
            
            {isAdmin && (
              <div className="space-y-6">
                <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
                  <div className="flex items-center gap-3 text-primary mb-6">
                    <PencilLine className="w-5 h-5" />
                    <h3 className="text-xl font-bold text-foreground">Admin Settings</h3>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</p>
                      <Textarea value={draftDescription} onChange={e => setDraftDescription(e.target.value)} className="min-h-[80px] rounded-[16px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Meeting Day</p>
                        <Input value={draftMeetingDay} onChange={e => setDraftMeetingDay(e.target.value)} className="rounded-[14px] h-11" />
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Contribution</p>
                        <Input value={draftMonthlyContribution} onChange={e => setDraftMonthlyContribution(e.target.value)} className="rounded-[14px] h-11" />
                      </div>
                    </div>
                    <Button onClick={handleSaveChanges} className="w-full rounded-[14px] h-11 font-bold">Save Settings</Button>
                  </div>
                </div>

                <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
                  <div className="flex items-center gap-3 text-primary mb-5">
                    <Landmark className="w-5 h-5" />
                    <p className="font-bold text-foreground text-lg">Admin Withdrawal</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount (KES)</p>
                      <Input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} type="number" placeholder="0" className="rounded-[14px] h-11" />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Note</p>
                      <Input value={withdrawNote} onChange={e => setWithdrawNote(e.target.value)} placeholder="E.g., Approved payout" className="rounded-[14px] h-11" />
                    </div>
                    <Button variant="destructive" onClick={handleWithdraw} className="w-full rounded-[14px] h-11 font-bold bg-red-500 hover:bg-red-600">
                      Approve Withdrawal
                    </Button>
                    {withdrawFeedback && <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl mt-2">{withdrawFeedback}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
