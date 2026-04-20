import { Badge } from "@/components/ui/badge";
import { useChamaState } from "@/hooks/useChamaState";

export default function MembersWorkspace() {
  const { memberGroups } = useChamaState();

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-card border border-border p-8 card-shadow">
        <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
          Members
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">
          Manage group structure and member roles
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-8">
          This page gives a clearer view of the groups you belong to, who leads
          them, and how contribution responsibilities are expected to work.
        </p>
      </section>

      <div className="grid gap-5">
        {memberGroups.map(group => (
          <div
            key={group.id}
            className="rounded-[30px] bg-card border border-border p-7 card-shadow transition-all hover:-translate-y-1 hover:shadow-lg hover:border-border"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {group.name}
                </h2>
                <p className="mt-2 text-muted-foreground">{group.description}</p>
              </div>
              <Badge
                variant="outline"
                className="border-sky-200 bg-secondary text-sky-700"
              >
                {group.role === "admin" ? "You are admin" : "You are a member"}
              </Badge>
            </div>
            <div className="mt-6 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
              <p>Members inside: {group.memberCount}</p>
              <p>Maximum size: {group.maxMembers}</p>
              <p>Join code: {group.joinCode}</p>
              <p>
                Next contribution:{" "}
                {new Date(group.nextContributionDate).toLocaleDateString()}
              </p>
              <p>Wallet balance: KES {group.walletBalance.toLocaleString()}</p>
              <p>Join fee: KES {group.joinFee.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
