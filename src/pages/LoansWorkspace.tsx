import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useChamaState } from "@/hooks/useChamaState";

export default function LoansWorkspace() {
  const { memberGroups } = useChamaState();

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-white border border-border p-8 card-shadow">
        <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
          Loans
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">
          Loan visibility for every group
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600 leading-8">
          This space is designed for reviewing group borrowing rules, repayment
          expectations, and approval responsibility. It is ready for the full
          loan workflow layer.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {memberGroups.map(group => (
          <div
            key={group.id}
            className="rounded-[30px] bg-white border border-border p-7 card-shadow"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {group.name}
                </h2>
                <p className="mt-2 text-slate-600">
                  Suggested repayment model: {group.payoutStyle}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-sky-700 border-sky-200 bg-sky-50"
              >
                {group.role || "member"}
              </Badge>
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-700">
              <p>Independent wallet balance: KES {group.walletBalance}</p>
              <p>
                Monthly contribution baseline: KES {group.monthlyContribution}
              </p>
              <p>
                Next contribution date:{" "}
                {new Date(group.nextContributionDate).toLocaleDateString()}
              </p>
              <p>Meeting cycle: {group.meetingDay}</p>
              <p>Members currently inside: {group.memberCount}</p>
            </div>
            <div className="mt-7 flex gap-3">
              <Button className="rounded-full px-6">Request loan</Button>
              <Button variant="outline" className="rounded-full px-6">
                Review rules
              </Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
