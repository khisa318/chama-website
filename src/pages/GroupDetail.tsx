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
  Lock,
  MessageSquare,
  PencilLine,
  Send,
  ShieldCheck,
  Users,
  Wallet,
  Crown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

function monthLabel(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

function buildContributionHistory(walletBalance: number, months: number) {
  return Array.from({ length: Math.max(months, 1) }, (_, index) => ({
    label: `M${index + 1}`,
    amount: Math.round((walletBalance / Math.max(months, 1)) * (index + 1)),
  }));
}

function buildMemberGrowth(memberCount: number) {
  return Array.from({ length: 4 }, (_, index) => ({
    label: ["Start", "Growth", "Now - 1", "Now"][index],
    count: Math.max(
      1,
      Math.min(memberCount, Math.round(memberCount * ((index + 1) / 4)))
    ),
  }));
}

function monthsActive(createdAt: string) {
  const start = new Date(createdAt);
  const now = new Date();
  return Math.max(
    1,
    (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth()) +
      1
  );
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
  const [draftDescription, setDraftDescription] = useState(
    group?.description || ""
  );
  const [draftMeetingDay, setDraftMeetingDay] = useState(
    group?.meetingDay || ""
  );
  const [draftMonthlyContribution, setDraftMonthlyContribution] = useState(
    String(group?.monthlyContribution || 0)
  );
  const [draftPayoutStyle, setDraftPayoutStyle] = useState(
    group?.payoutStyle || ""
  );
  const [draftRules, setDraftRules] = useState(group?.rules.join("\n") || "");

  const [acceptedRules, setAcceptedRules] = useState(false);
  const [acceptedGovernance, setAcceptedGovernance] = useState(false);
  const [joinMethod, setJoinMethod] = useState<"mpesa" | "bank" | "wallet">(
    "mpesa"
  );
  const [joinFeedback, setJoinFeedback] = useState("");

  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionMethod, setContributionMethod] = useState<
    "mpesa" | "bank" | "wallet"
  >("mpesa");
  const [contributionFeedback, setContributionFeedback] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<
    "mpesa" | "bank" | "wallet"
  >("mpesa");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawFeedback, setWithdrawFeedback] = useState("");

  const analytics = useMemo(() => {
    if (!group) return null;
    const activeMonths = monthsActive(group.createdAt);
    return {
      activeMonths,
      contributionHistory: buildContributionHistory(
        group.walletBalance,
        Math.min(activeMonths, 6)
      ),
      memberGrowth: buildMemberGrowth(group.memberCount),
      averagePerMember: Math.round(
        group.totalContributed / Math.max(group.memberCount, 1)
      ),
    };
  }, [group]);

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto rounded-[32px] bg-card border border-border p-10 card-shadow">
        <p className="text-lg font-semibold text-foreground">Group not found</p>
        <p className="mt-3 text-muted-foreground">
          The group you opened is not available in this workspace.
        </p>
      </div>
    );
  }

  const isMember = Boolean(group.role);
  const isAdmin = group.role === "admin";
  const canJoin = acceptedRules && acceptedGovernance;

  const handleSaveChanges = () => {
    updateGroup(group.id, {
      description: draftDescription.trim(),
      meetingDay: draftMeetingDay.trim(),
      monthlyContribution:
        Number(draftMonthlyContribution) || group.monthlyContribution,
      payoutStyle: draftPayoutStyle.trim(),
      rules: draftRules
        .split("\n")
        .map(rule => rule.trim())
        .filter(Boolean),
    });
  };

  const handleSendMessage = () => {
    if (!message.trim() || !isMember) return;
    sendMessage(group.id, message.trim(), isAdmin ? "admin" : "member");
    setMessage("");
  };

  const handleJoin = () => {
    if (!canJoin) {
      setJoinFeedback(
        "You must accept the terms, penalties, and governance rules first."
      );
      return;
    }

    joinGroup(group.id, {
      acceptedTerms: true,
      paymentMethod: joinMethod,
    });
    setJoinFeedback("Join fee received. You are now a member of this chama.");
  };

  const handleContribute = () => {
    const amount = Number(contributionAmount) || group.monthlyContribution;
    if (!amount || !isMember) return;
    contributeToGroup(group.id, amount, contributionMethod);
    setContributionAmount("");
    setContributionFeedback(
      "Contribution received and posted to the chama wallet."
    );
  };

  const handleWithdraw = () => {
    const amount = Number(withdrawAmount);
    if (!amount || !isAdmin) return;
    if (amount > group.walletBalance) {
      setWithdrawFeedback(
        "This withdrawal is above the available wallet balance."
      );
      return;
    }
    withdrawFromGroup(
      group.id,
      amount,
      withdrawMethod,
      withdrawNote.trim() || "Admin withdrawal approved"
    );
    setWithdrawAmount("");
    setWithdrawNote("");
    setWithdrawFeedback("Withdrawal approved and posted to the audit ledger.");
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* 1. Hero Banner */}
      <div className="relative rounded-[32px] overflow-hidden card-shadow bg-card border border-border">
        {/* Gradient bg */}
        <div className="absolute inset-0 amibank-gradient opacity-10 dark:opacity-[0.15]"></div>
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
              {isAdmin && (
                <span className="px-3 py-1 bg-orange-500/20 text-orange-500 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3"/> Admin
                </span>
              )}
              {isMember && !isAdmin && (
                <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3"/> Member
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">{group.name}</h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed font-medium">{group.description}</p>
          </div>

          <div className="bg-background/80 backdrop-blur-xl rounded-[28px] p-7 border border-border w-full lg:w-auto shadow-sm min-w-[280px]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Fund Balance</p>
            <p className="text-3xl font-extrabold text-foreground mb-4">KES {group.walletBalance.toLocaleString()}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/80 p-3 rounded-xl border border-border/50">
               <CalendarDays className="w-4 h-4 text-primary" />
               Next meeting: {new Date(group.nextContributionDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <Link to="/app/community" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors bg-card border border-border px-4 py-2 rounded-[14px] shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to community
        </Link>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Core Actions & Ledger */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Join Section (If Not Member) */}
          {!isMember && (
            <div className="rounded-[32px] bg-card border border-border p-8 card-shadow">
              <div className="flex items-center gap-3 text-primary mb-6">
                <CheckCircle2 className="w-6 h-6" />
                <h2 className="text-2xl font-bold text-foreground">Before joining this chama</h2>
              </div>
              <div className="space-y-5 text-sm font-medium text-muted-foreground">
                <label className="flex items-start gap-4 rounded-[20px] bg-secondary/50 p-5 cursor-pointer hover:bg-secondary transition-colors">
                  <input
                    type="checkbox"
                    checked={acceptedRules}
                    onChange={e => setAcceptedRules(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-primary"
                  />
                  <span className="leading-relaxed">
                    I have read the rules, penalties, and contribution terms. I commit to making regular contributions of KES {group.monthlyContribution.toLocaleString()}.
                  </span>
                </label>
                <label className="flex items-start gap-4 rounded-[20px] bg-secondary/50 p-5 cursor-pointer hover:bg-secondary transition-colors">
                  <input
                    type="checkbox"
                    checked={acceptedGovernance}
                    onChange={e => setAcceptedGovernance(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-primary"
                  />
                  <span className="leading-relaxed">
                    I accept the governance structure, withdrawal policy, and audit rules of {group.name}.
                  </span>
                </label>

                <div className="rounded-[24px] border border-border bg-background p-6">
                  <p className="font-bold text-foreground mb-4">Choose joining payment method (KES {group.joinFee})</p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {(["mpesa", "bank", "wallet"] as const).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setJoinMethod(method)}
                        className={`rounded-[14px] px-5 py-3 text-xs font-bold transition-all ${
                          joinMethod === method
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-secondary text-muted-foreground border border-border hover:bg-secondary/80"
                        }`}
                      >
                        {method === "mpesa" ? "M-Pesa" : method === "bank" ? "Bank Transfer" : "Khisa Wallet"}
                      </button>
                    ))}
                  </div>
                  <Button onClick={handleJoin} className="w-full rounded-[16px] h-12 font-bold text-sm shadow-md">
                    Pay KES {group.joinFee} & Join Group
                  </Button>
                  {joinFeedback && (
                    <div className="mt-4 rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
                      {joinFeedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions (If Member) */}
          {isMember && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Contribute Box */}
              <div className="rounded-[32px] bg-card border border-border p-7 card-shadow hover-lift">
                <div className="flex items-center gap-3 text-primary mb-5">
                  <CreditCard className="w-5 h-5" />
                  <p className="font-bold text-foreground text-lg">Make a contribution</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount (KES)</p>
                    <Input
                      value={contributionAmount}
                      onChange={e => setContributionAmount(e.target.value)}
                      placeholder={String(group.monthlyContribution)}
                      type="number"
                      className="rounded-[14px] h-11"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(["mpesa", "wallet"] as const).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setContributionMethod(method)}
                        className={`flex-1 rounded-[12px] py-2.5 text-xs font-bold transition-all ${
                          contributionMethod === method
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground border border-border"
                        }`}
                      >
                        {method === "mpesa" ? "M-Pesa" : "Wallet"}
                      </button>
                    ))}
                  </div>
                  <Button onClick={handleContribute} className="w-full rounded-[14px] h-11 font-bold">
                    Contribute Now
                  </Button>
                  {contributionFeedback && (
                    <p className="text-xs font-bold text-primary bg-primary/10 p-3 rounded-xl mt-2">{contributionFeedback}</p>
                  )}
                </div>
              </div>

              {/* Admin Box OR Analytics Snapshot */}
              {isAdmin ? (
                <div className="rounded-[32px] bg-card border border-border p-7 card-shadow hover-lift">
                  <div className="flex items-center gap-3 text-primary mb-5">
                    <Landmark className="w-5 h-5" />
                    <p className="font-bold text-foreground text-lg">Admin Withdrawal</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount (KES)</p>
                      <Input
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        type="number"
                        placeholder="0"
                        className="rounded-[14px] h-11"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Note</p>
                      <Input
                        value={withdrawNote}
                        onChange={e => setWithdrawNote(e.target.value)}
                        placeholder="E.g., Approved payout"
                        className="rounded-[14px] h-11"
                      />
                    </div>
                    <Button variant="destructive" onClick={handleWithdraw} className="w-full rounded-[14px] h-11 font-bold bg-red-500 hover:bg-red-600">
                      Approve Withdrawal
                    </Button>
                    {withdrawFeedback && (
                      <p className="text-xs font-bold text-red-500 bg-red-500/10 p-3 rounded-xl mt-2">{withdrawFeedback}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-[32px] bg-card border border-border p-7 card-shadow hover-lift flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-primary mb-5">
                      <TrendingUp className="w-5 h-5" />
                      <p className="font-bold text-foreground text-lg">Your Status</p>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-secondary/50 rounded-[16px] p-4 border border-border flex justify-between items-center">
                        <span className="text-sm font-bold text-muted-foreground">Total Contributed</span>
                        <span className="text-sm font-extrabold text-foreground">KES {(group.members.find(m => m.name === user?.name)?.totalContributed || 0).toLocaleString()}</span>
                      </div>
                      <div className="bg-secondary/50 rounded-[16px] p-4 border border-border flex justify-between items-center">
                        <span className="text-sm font-bold text-muted-foreground">Monthly Expected</span>
                        <span className="text-sm font-extrabold text-foreground">KES {group.monthlyContribution.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Group Rules & Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
              <div className="flex items-center gap-3 text-primary mb-5">
                <ShieldCheck className="w-5 h-5" />
                <p className="font-bold text-foreground text-lg">Group Rules</p>
              </div>
              <div className="space-y-3">
                {group.rules.map(rule => (
                  <div key={rule} className="rounded-[16px] bg-secondary/50 px-4 py-3 text-xs font-medium leading-relaxed text-muted-foreground border border-border/50">
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
              <div className="flex items-center gap-3 text-primary mb-5">
                <CalendarDays className="w-5 h-5" />
                <p className="font-bold text-foreground text-lg">Group Structure</p>
              </div>
              <div className="space-y-4 text-sm font-medium text-muted-foreground">
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span>Meeting Day</span>
                  <span className="text-foreground font-bold">{group.meetingDay}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span>Payout Style</span>
                  <span className="text-foreground font-bold">{group.payoutStyle}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span>Join Fee</span>
                  <span className="text-foreground font-bold">KES {group.joinFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Join Code</span>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-bold tracking-widest">{group.joinCode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ledger History (If Member) */}
          {isMember && (
            <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
              <div className="flex items-center gap-3 text-primary mb-6">
                <Wallet className="w-5 h-5" />
                <h3 className="text-xl font-bold text-foreground">Ledger Activity</h3>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {group.ledger.map(entry => (
                  <div key={entry.id} className="rounded-[20px] border border-border bg-background p-4 flex items-center justify-between gap-4 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${entry.direction === "in" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{entry.note}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                          {entry.actorName} • {entry.method === "mpesa" ? "M-Pesa" : entry.method}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${entry.direction === "in" ? "text-green-500" : "text-red-500"}`}>
                        {entry.direction === "in" ? "+" : "-"}KES {entry.amount.toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {group.ledger.length === 0 && (
                  <div className="text-center p-8 text-muted-foreground font-medium">No ledger activity yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Admin Settings (If Admin) */}
          {isAdmin && (
             <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
               <div className="flex items-center gap-3 text-primary mb-6">
                 <PencilLine className="w-5 h-5" />
                 <h3 className="text-xl font-bold text-foreground">Admin Controls</h3>
               </div>
               <div className="grid gap-5 md:grid-cols-2">
                 <div>
                   <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</p>
                   <Textarea value={draftDescription} onChange={e => setDraftDescription(e.target.value)} className="min-h-[120px] rounded-[16px]" />
                 </div>
                 <div>
                   <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Rules (One per line)</p>
                   <Textarea value={draftRules} onChange={e => setDraftRules(e.target.value)} className="min-h-[120px] rounded-[16px]" />
                 </div>
                 <div>
                   <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Meeting Day</p>
                   <Input value={draftMeetingDay} onChange={e => setDraftMeetingDay(e.target.value)} className="rounded-[14px] h-11" />
                 </div>
                 <div>
                   <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Payout Style</p>
                   <Input value={draftPayoutStyle} onChange={e => setDraftPayoutStyle(e.target.value)} className="rounded-[14px] h-11" />
                 </div>
               </div>
               <Button onClick={handleSaveChanges} className="mt-6 rounded-[14px] px-8 h-11 font-bold">
                 Save Settings
               </Button>
             </div>
          )}
        </div>

        {/* RIGHT COLUMN: Chat, Members, Analytics */}
        <div className="space-y-8">
          
          {/* Group Chat */}
          {isMember ? (
            <div className="rounded-[32px] bg-card border border-border p-6 card-shadow flex flex-col h-[500px]">
              <div className="flex items-center gap-3 text-primary mb-2">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-lg font-bold text-foreground">Group Chat</h3>
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-4">Secure member-only discussion.</p>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar mb-4">
                {group.messages.map(entry => (
                  <div key={entry.id} className="rounded-[16px] bg-secondary/50 p-4 border border-border/50">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{entry.userName}</span>
                        {entry.userRole === "admin" && <span className="bg-orange-500/20 text-orange-500 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Admin</span>}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{new Date(entry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">{entry.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Message the group..."
                  className="rounded-[14px] bg-secondary/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button onClick={handleSendMessage} className="rounded-[14px] w-12 h-10 p-0 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-[32px] bg-card border border-border p-8 card-shadow text-center">
              <Lock className="w-8 h-8 text-primary mx-auto mb-3 opacity-50" />
              <p className="font-bold text-foreground">Chat is locked</p>
              <p className="text-xs font-medium text-muted-foreground mt-2">Join this group to participate in the discussion.</p>
            </div>
          )}

          {/* Members List */}
          <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-primary">
                <Users className="w-5 h-5" />
                <h3 className="text-lg font-bold text-foreground">Members</h3>
              </div>
              <span className="bg-secondary text-foreground text-xs font-bold px-3 py-1 rounded-full">{group.memberCount} / {group.maxMembers}</span>
            </div>

            {group.memberListVisibility === "public" || isMember ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {group.members.map(member => (
                  <div key={member.id} className="flex items-center gap-4 bg-background border border-border rounded-[20px] p-4">
                    <div className="w-10 h-10 rounded-[12px] bg-secondary flex items-center justify-center font-bold text-foreground shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-foreground text-sm truncate">{member.name}</p>
                        {member.role === "admin" && <Crown className="w-3.5 h-3.5 text-orange-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                          Contributed: KES {member.totalContributed.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium text-muted-foreground">Member list is private until you join.</p>
              </div>
            )}
          </div>

          {/* Analytics */}
          <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
            <div className="flex items-center gap-3 text-primary mb-6">
              <LineChart className="w-5 h-5" />
              <h3 className="text-lg font-bold text-foreground">Growth Analytics</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Wallet Trajectory</p>
                <div className="space-y-2.5">
                  {analytics?.contributionHistory.map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-[11px] font-bold text-muted-foreground mb-1.5">
                        <span>{item.label}</span>
                        <span className="text-foreground">KES {item.amount.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(10, (item.amount / (analytics.contributionHistory.at(-1)?.amount || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Member Growth</p>
                <div className="space-y-2.5">
                  {analytics?.memberGrowth.map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-[11px] font-bold text-muted-foreground mb-1.5">
                        <span>{item.label}</span>
                        <span className="text-foreground">{item.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-sky-400 rounded-full" style={{ width: `${Math.max(10, (item.count / Math.max(group.memberCount, 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
