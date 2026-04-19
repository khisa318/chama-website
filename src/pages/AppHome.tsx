import { Link } from "react-router";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  HandCoins,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useChamaState } from "@/hooks/useChamaState";

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
  const totalWalletBalance = memberGroups.reduce(
    (sum, group) => sum + group.walletBalance,
    0
  );
  const totalMembershipMonths = memberGroups.reduce(
    (sum, group) => sum + monthsSince(group.joinedAt || group.createdAt),
    0
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-[#dbe6f7] bg-white p-6 md:p-8 card-shadow overflow-hidden">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                <Sparkles className="h-4 w-4" />
                Dashboard
              </div>
              <div className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500">
                {memberGroups.length} active group
                {memberGroups.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
                Welcome back
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-5xl">
                Good to see you, {firstName(user?.name)}.
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Here is your chama overview for today, from contributions and
                loan access to the groups you manage.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[28px] bg-[#eef6ff] p-5">
                <p className="text-sm text-sky-700">Groups</p>
                <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                  {memberGroups.length}
                </p>
              </div>
              <div className="rounded-[28px] bg-[#f2f5ff] p-5">
                <p className="text-sm text-blue-700">Contributed</p>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                  KES {myTotalContributed.toLocaleString()}
                </p>
              </div>
              <div className="rounded-[28px] bg-[#f3f6f9] p-5">
                <p className="text-sm text-slate-600">Loans</p>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                  KES {myAvailableLoans.toLocaleString()}
                </p>
              </div>
              <div className="rounded-[28px] border border-[#d9e6fb] bg-white p-5">
                <p className="text-sm text-slate-600">Months active</p>
                <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                  {totalMembershipMonths}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[32px] bg-[linear-gradient(180deg,#16214f_0%,#1f2e69_100%)] p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white/65">At a glance</p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Your chama circle
                  </h2>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                  live
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {memberGroups.slice(0, 3).map(group => (
                  <div
                    key={group.id}
                    className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{group.name}</p>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">
                        {group.role === "admin" ? "Admin" : "Member"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white/70">
                      Joined{" "}
                      {new Date(
                        group.joinedAt || group.createdAt
                      ).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-sm text-white/60">
                      Wallet KES {group.walletBalance.toLocaleString()}
                    </p>
                  </div>
                ))}
                {memberGroups.length === 0 && (
                  <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 text-sm leading-7 text-white/75">
                    You have not joined a group yet. Open Community to find one.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                to="/app/community"
                className="rounded-[28px] border border-[#dbe6f7] bg-[#f8fbff] p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Users className="h-5 w-5 text-sky-700" />
                <p className="mt-4 text-lg font-semibold text-slate-900">
                  Community
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Browse more groups and open detailed views.
                </p>
              </Link>
              <Link
                to="/app/loans"
                className="rounded-[28px] border border-[#dbe6f7] bg-[#f8fbff] p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <CalendarDays className="h-5 w-5 text-sky-700" />
                <p className="mt-4 text-lg font-semibold text-slate-900">
                  Loans
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Check loan access and follow repayment options.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
                Your groups
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Open a group to see details
              </h2>
            </div>
            <Link to="/app/community">
              <Button variant="outline" className="rounded-full px-5">
                Browse community
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {memberGroups.map(group => (
              <Link
                key={group.id}
                to={`/app/groups/${group.id}`}
                className="rounded-[28px] border border-sky-100 bg-sky-50/60 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700">
                      <Users className="w-3 h-3" />
                      {group.role === "admin" ? "Admin view" : "Member view"}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-slate-900">
                      {group.name}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {group.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-sky-700 shrink-0" />
                </div>
                <div className="mt-5 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
                  <p>
                    KES {group.totalContributed.toLocaleString()} contributed
                  </p>
                  <p>
                    KES {group.availableLoanLimit.toLocaleString()} loans
                    available
                  </p>
                  <p>{group.memberCount} members in group</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[32px] bg-slate-900 text-white p-7">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5" />
              <p className="text-sm uppercase tracking-[0.18em] text-white/60">
                Groups being managed
              </p>
            </div>
            <div className="mt-5 space-y-4">
              {adminGroups.map(group => (
                <Link
                  key={group.id}
                  to={`/app/groups/${group.id}`}
                  className="block rounded-[24px] bg-white/8 px-4 py-4 hover:bg-white/12 transition-colors"
                >
                  <p className="font-semibold">{group.name}</p>
                  <p className="mt-1 text-sm text-white/70">
                    Manage members, rules, analytics, and chat
                  </p>
                </Link>
              ))}
              {adminGroups.length === 0 && (
                <p className="text-sm leading-7 text-white/70">
                  You are not managing a group yet. Create one to get the admin
                  controls here.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
            <div className="flex items-center gap-3 text-sky-700">
              <Banknote className="w-5 h-5" />
              <p className="font-semibold">Wallet and loan access</p>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-sky-50 px-4 py-4">
                <p className="text-sm text-sky-700">Combined wallet balance</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  KES {totalWalletBalance.toLocaleString()}
                </p>
              </div>
              {memberGroups.slice(0, 3).map(group => (
                <div
                  key={group.id}
                  className="rounded-2xl bg-slate-50 px-4 py-4"
                >
                  <p className="font-medium text-slate-900">{group.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Up to KES {group.availableLoanLimit.toLocaleString()}{" "}
                    available
                  </p>
                </div>
              ))}
              {memberGroups.length === 0 && (
                <p className="text-sm text-slate-600">
                  Join a group to unlock group-based loans.
                </p>
              )}
            </div>
            <Link
              to="/app/loans"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-sky-700"
            >
              Open loans workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="rounded-[32px] bg-white border border-border p-7 card-shadow">
            <div className="flex items-center gap-3 text-sky-700">
              <HandCoins className="w-5 h-5" />
              <p className="font-semibold">Member insights</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Every group detail page now carries members, rules, analytics
              since the group was created, and a private group chat for people
              inside that group.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
