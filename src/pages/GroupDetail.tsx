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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <div className="max-w-4xl mx-auto rounded-[32px] bg-white border border-border p-10 card-shadow">
        <p className="text-lg font-semibold text-slate-900">Group not found</p>
        <p className="mt-3 text-slate-600">
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
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="rounded-[36px] bg-white border border-border card-shadow overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-8 md:p-10">
            <Link
              to="/app/community"
              className="inline-flex items-center gap-2 text-sm font-medium text-sky-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to community
            </Link>
            <div className="mt-6 flex items-start gap-4">
              <div className="w-20 h-20 rounded-[28px] overflow-hidden bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                {group.profileImage ? (
                  <img
                    src={group.profileImage}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-8 h-8" />
                )}
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  {isAdmin
                    ? "Admin view"
                    : isMember
                      ? "Member view"
                      : "Before joining"}
                </div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {groupTypeLabels[group.groupType] || group.groupType}
                </div>
                <h1 className="mt-4 text-4xl font-semibold text-slate-900">
                  {group.name}
                </h1>
                <p className="mt-3 max-w-2xl text-slate-600 leading-8">
                  {group.description}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-[24px] bg-sky-50 p-4">
                <p className="text-sm text-sky-700">Purpose</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {groupTypeLabels[group.groupType] || group.groupType}
                </p>
              </div>
              <div className="rounded-[24px] bg-blue-50 p-4">
                <p className="text-sm text-blue-700">Next contribution</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {new Date(group.nextContributionDate).toLocaleDateString()}
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-100 p-4">
                <p className="text-sm text-slate-600">Wallet balance</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  KES {group.walletBalance.toLocaleString()}
                </p>
              </div>
              <div className="rounded-[24px] border border-sky-100 bg-white p-4">
                <p className="text-sm text-slate-600">Join fee</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  KES {group.joinFee.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="gradient-hero border-t lg:border-t-0 lg:border-l border-border p-8 md:p-10">
            {!isMember ? (
              <div className="rounded-[28px] bg-white p-6 border border-sky-100">
                <div className="flex items-center gap-3 text-sky-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="font-semibold">Before joining this chama</p>
                </div>
                <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
                  <label className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={acceptedRules}
                      onChange={e => setAcceptedRules(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      I have read the rules, penalties, and contribution terms.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={acceptedGovernance}
                      onChange={e => setAcceptedGovernance(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      I accept the governance structure, withdrawal policy, and
                      audit rules.
                    </span>
                  </label>
                  <div className="rounded-2xl bg-sky-50 px-4 py-4">
                    <p className="font-medium text-slate-900">
                      Choose payment method
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["mpesa", "bank", "wallet"] as const).map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setJoinMethod(method)}
                          className={`rounded-full px-4 py-2 text-sm font-medium ${
                            joinMethod === method
                              ? "bg-sky-600 text-white"
                              : "bg-white text-slate-700 border border-sky-100"
                          }`}
                        >
                          {method === "mpesa"
                            ? "M-Pesa"
                            : method === "bank"
                              ? "Bank"
                              : "Wallet"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleJoin} className="w-full rounded-full">
                    Pay KES {group.joinFee} and join
                  </Button>
                  {joinFeedback && (
                    <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                      {joinFeedback}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] bg-white p-6 border border-sky-100">
                <div className="flex items-center gap-3 text-sky-700">
                  <Wallet className="w-5 h-5" />
                  <p className="font-semibold">Chama wallet summary</p>
                </div>
                <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
                  <p>
                    Monthly contribution: KES{" "}
                    {group.monthlyContribution.toLocaleString()}
                  </p>
                  <p>
                    Wallet transparency:{" "}
                    {group.walletTransparency
                      ? "Visible to members"
                      : "Private"}
                  </p>
                  <p>
                    Member list visibility:{" "}
                    {group.memberListVisibility === "public"
                      ? "Public"
                      : "Members only"}
                  </p>
                  <p>Total ledger entries: {group.ledger.length}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 rounded-[20px] bg-white border border-border p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
            <div className="flex items-center gap-3 text-sky-700">
              <ShieldCheck className="w-5 h-5" />
              <p className="font-semibold">Rules summary</p>
            </div>
            <div className="mt-5 space-y-3">
              {group.rules.map(rule => (
                <div
                  key={rule}
                  className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700"
                >
                  {rule}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
            <div className="flex items-center gap-3 text-sky-700">
              <CalendarDays className="w-5 h-5" />
              <p className="font-semibold">How this chama works</p>
            </div>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
              <p>Meeting day: {group.meetingDay}</p>
              <p>Funding model: {group.payoutStyle}</p>
              <p>
                Next contribution date:{" "}
                {new Date(group.nextContributionDate).toLocaleDateString()}
              </p>
              <p>Join fee required: KES {group.joinFee.toLocaleString()}</p>
              <p>Join code: {group.joinCode}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
                  Members
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                  {group.memberListVisibility === "public" || isMember
                    ? "People inside this group"
                    : "Member list is visible after joining"}
                </h2>
              </div>
              <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                {group.memberCount} members
              </div>
            </div>

            {group.memberListVisibility === "public" || isMember ? (
              <div className="mt-6 grid gap-4">
                {group.members.map(member => (
                  <div
                    key={member.id}
                    className="rounded-[24px] border border-border bg-slate-50 px-5 py-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {member.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Joined{" "}
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="rounded-full bg-white px-3 py-1 font-medium text-sky-700">
                          {member.role}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">
                          {member.contributionStatus}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-slate-700">
                      <p>
                        Total contributed: KES{" "}
                        {member.totalContributed.toLocaleString()}
                      </p>
                      <p>
                        {member.name === user?.name
                          ? "This is you"
                          : "Active group member"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-600">
                This chama only reveals the full member list after the user
                joins and accepts the rules.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="wallet">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
                <div className="flex items-center gap-3 text-sky-700">
                  <Wallet className="w-5 h-5" />
                  <p className="font-semibold">Independent chama wallet</p>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] bg-sky-50 p-4">
                    <p className="text-sm text-sky-700">Current balance</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      KES {group.walletBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-slate-100 p-4">
                    <p className="text-sm text-slate-600">Total contributed</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      KES {group.totalContributed.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-5 rounded-[24px] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                  Each chama wallet is fully independent. Transactions are
                  recorded in the ledger, balances are calculated from those
                  records, and no funds are mixed with other groups.
                </div>
              </div>

              {isMember && (
                <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
                  <div className="flex items-center gap-3 text-sky-700">
                    <CreditCard className="w-5 h-5" />
                    <p className="font-semibold">Make a contribution</p>
                  </div>
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700">
                        Amount
                      </p>
                      <Input
                        value={contributionAmount}
                        onChange={e => setContributionAmount(e.target.value)}
                        placeholder={String(group.monthlyContribution)}
                        type="number"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(["mpesa", "bank", "wallet"] as const).map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setContributionMethod(method)}
                          className={`rounded-full px-4 py-2 text-sm font-medium ${
                            contributionMethod === method
                              ? "bg-sky-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {method === "mpesa"
                            ? "M-Pesa"
                            : method === "bank"
                              ? "Bank"
                              : "Wallet"}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={handleContribute}
                      className="rounded-full px-6"
                    >
                      Contribute now
                    </Button>
                    {contributionFeedback && (
                      <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                        {contributionFeedback}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
                  <div className="flex items-center gap-3 text-sky-700">
                    <Landmark className="w-5 h-5" />
                    <p className="font-semibold">Admin withdrawal</p>
                  </div>
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700">
                        Withdrawal amount
                      </p>
                      <Input
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        type="number"
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700">
                        Withdrawal note
                      </p>
                      <Input
                        value={withdrawNote}
                        onChange={e => setWithdrawNote(e.target.value)}
                        placeholder="Example: Approved payout to chama account"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(["mpesa", "bank", "wallet"] as const).map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setWithdrawMethod(method)}
                          className={`rounded-full px-4 py-2 text-sm font-medium ${
                            withdrawMethod === method
                              ? "bg-sky-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {method === "mpesa"
                            ? "M-Pesa payout"
                            : method === "bank"
                              ? "Bank payout"
                              : "Wallet"}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={handleWithdraw}
                      className="rounded-full px-6"
                    >
                      Approve withdrawal
                    </Button>
                    {withdrawFeedback && (
                      <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                        {withdrawFeedback}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
              <div className="flex items-center gap-3 text-sky-700">
                <Wallet className="w-5 h-5" />
                <p className="font-semibold">Ledger history</p>
              </div>
              <div className="mt-5 space-y-4 max-h-[720px] overflow-y-auto pr-1">
                {group.ledger.map(entry => (
                  <div
                    key={entry.id}
                    className="rounded-[24px] border border-border bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {entry.note}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {entry.actorName} via{" "}
                          {entry.method === "mpesa" ? "M-Pesa" : entry.method}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            entry.direction === "in"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {entry.direction === "in" ? "+" : "-"}KES{" "}
                          {entry.amount.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
              <div className="flex items-center gap-3 text-sky-700">
                <LineChart className="w-5 h-5" />
                <p className="font-semibold">Since creation</p>
              </div>
              <div className="mt-5 space-y-4">
                <p className="text-4xl font-semibold text-slate-900">
                  {analytics?.activeMonths || 1}
                </p>
                <p className="text-sm leading-7 text-slate-600">
                  Months active since{" "}
                  {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
              <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
                Wallet growth
              </p>
              <div className="mt-5 space-y-3">
                {analytics?.contributionHistory.map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{item.label}</span>
                      <span>KES {item.amount.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full gradient-accent"
                        style={{
                          width: `${Math.max(18, (item.amount / (analytics.contributionHistory.at(-1)?.amount || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
              <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
                Member growth
              </p>
              <div className="mt-5 space-y-3">
                {analytics?.memberGrowth.map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{item.label}</span>
                      <span>{item.count} members</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-sky-500"
                        style={{
                          width: `${Math.max(18, (item.count / Math.max(group.memberCount, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[24px] bg-sky-50 px-4 py-4 text-sm text-slate-700">
                Average contribution per member: KES{" "}
                {analytics?.averagePerMember.toLocaleString()}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          {isAdmin ? (
            <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
              <div className="flex items-center gap-3 text-sky-700">
                <PencilLine className="w-5 h-5" />
                <p className="font-semibold">Admin controls</p>
              </div>
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Description
                  </p>
                  <Textarea
                    value={draftDescription}
                    onChange={e => setDraftDescription(e.target.value)}
                    className="min-h-[140px]"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Rules
                  </p>
                  <Textarea
                    value={draftRules}
                    onChange={e => setDraftRules(e.target.value)}
                    className="min-h-[140px]"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Meeting day
                  </p>
                  <Input
                    value={draftMeetingDay}
                    onChange={e => setDraftMeetingDay(e.target.value)}
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Monthly contribution
                  </p>
                  <Input
                    value={draftMonthlyContribution}
                    onChange={e => setDraftMonthlyContribution(e.target.value)}
                    type="number"
                  />
                </div>
                <div className="lg:col-span-2">
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Payout style
                  </p>
                  <Input
                    value={draftPayoutStyle}
                    onChange={e => setDraftPayoutStyle(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveChanges}
                className="mt-6 rounded-full px-6"
              >
                Save group changes
              </Button>
            </div>
          ) : (
            <div className="rounded-[32px] bg-white border border-border p-10 card-shadow text-center">
              <Lock className="w-8 h-8 text-sky-700 mx-auto" />
              <p className="mt-4 text-xl font-semibold text-slate-900">
                Admin settings are limited
              </p>
              <p className="mt-3 text-slate-600">
                Only the group admin can change rules, contribution amount, and
                other group settings.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat">
          {isMember ? (
            <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
              <div className="flex items-center gap-3 text-sky-700">
                <MessageSquare className="w-5 h-5" />
                <p className="font-semibold">Group chat</p>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                This chat is only visible to people inside the group.
              </p>

              <div className="mt-6 space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {group.messages.map(entry => (
                  <div
                    key={entry.id}
                    className="rounded-[24px] bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-slate-900">
                        {entry.userName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="rounded-full bg-white px-3 py-1 text-sky-700">
                          {entry.userRole}
                        </span>
                        <span>
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write to your group..."
                  className="min-h-[96px]"
                />
                <Button
                  onClick={handleSendMessage}
                  className="rounded-[22px] px-5 self-end gap-2"
                >
                  Send
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-[32px] bg-white border border-border p-10 card-shadow text-center">
              <Lock className="w-8 h-8 text-sky-700 mx-auto" />
              <p className="mt-4 text-xl font-semibold text-slate-900">
                Chat is for group members only
              </p>
              <p className="mt-3 text-slate-600">
                Join this group first if you want to take part in the private
                member conversation.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
