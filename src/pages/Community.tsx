import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Search, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChamaState } from "@/hooks/useChamaState";

export default function Community() {
  const { groups } = useChamaState();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const visibleGroups = useMemo(() => {
    const normalized = query.toLowerCase();
    return groups.filter(
      group =>
        group.name.toLowerCase().includes(normalized) ||
        group.description.toLowerCase().includes(normalized) ||
        group.joinCode.toLowerCase().includes(normalized)
    );
  }, [groups, query]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-card border border-border p-8 card-shadow">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-primary">
              Community
            </p>
            <h1 className="mt-3 text-2xl font-bold text-foreground">
              Discover chama groups to join
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-8">
              Every group is organised into a clean card with contribution
              expectations, meeting patterns, and join codes so members can pick
              confidently.
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, purpose, or code"
              className="pl-9"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {visibleGroups.map(group => (
          <div
            key={group.id}
            className="rounded-[28px] bg-card border border-border p-7 card-shadow cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
            onClick={() => navigate(`/app/groups/${group.id}`)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-[20px] overflow-hidden bg-secondary text-primary flex items-center justify-center shrink-0">
                  {group.profileImage ? (
                    <img
                      src={group.profileImage}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-secondary text-primary px-3 py-1 text-xs font-semibold">
                    <Users className="w-3 h-3" />
                    {group.role ? `You are ${group.role}` : "Open group"}
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-foreground">
                    {group.name}
                  </h2>
                  <p className="mt-3 text-muted-foreground leading-7">
                    {group.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Join code</p>
                <p className="text-lg font-semibold text-foreground">
                  {group.joinCode}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
              <p>KES {group.monthlyContribution} per member</p>
              <p>
                {group.memberCount} / {group.maxMembers} members
              </p>
              <p>{group.meetingDay}</p>
              <p>{group.payoutStyle}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                {group.groupType}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
                Join fee KES {group.joinFee}
              </span>
            </div>

            <div className="mt-6 space-y-2">
              {group.rules.slice(0, 3).map(rule => (
                <p key={rule} className="text-sm text-muted-foreground">
                  {rule}
                </p>
              ))}
            </div>

            <div className="mt-7 flex gap-3">
              <Link to={`/app/groups/${group.id}`}>
                <Button
                  variant="outline"
                  className="rounded-[16px] px-6 font-bold h-10 gap-2"
                  onClick={e => e.stopPropagation()}
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Button>
              </Link>
              <Button className="rounded-[16px] px-6 font-bold h-10 gap-2 bg-foreground text-background hover:bg-foreground/90" disabled={!!group.role}
                onClick={e => {
                  e.stopPropagation();
                  navigate(`/app/groups/${group.id}`);
                }}
              >
                {group.role ? "Already in this group" : "Review and join"}
                {!group.role && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
