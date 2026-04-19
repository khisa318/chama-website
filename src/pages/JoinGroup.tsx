import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChamaState } from "@/hooks/useChamaState";

export default function JoinGroup() {
  const navigate = useNavigate();
  const { groups, findByCode } = useChamaState();
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const filteredGroups = useMemo(() => {
    const normalized = query.toLowerCase();
    return groups.filter(
      group =>
        group.name.toLowerCase().includes(normalized) ||
        group.description.toLowerCase().includes(normalized) ||
        group.joinCode.toLowerCase().includes(normalized)
    );
  }, [groups, query]);

  const handleJoinByCode = () => {
    const match = findByCode(code.trim());
    if (!match) {
      setError("No group matched that code. Check it and try again.");
      return;
    }

    navigate(`/app/groups/${match.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
      <section className="rounded-[32px] bg-white border border-border p-8 card-shadow h-fit">
        <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
          Join with a code
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Use a private invite code.
        </h1>
        <p className="mt-4 text-slate-600 leading-8">
          If someone already shared a group code with you, use it here and join
          directly.
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <Label htmlFor="group-code">Group code</Label>
            <Input
              id="group-code"
              value={code}
              onChange={e => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="Example: CWF300"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleJoinByCode} className="w-full rounded-full">
            Join this group
          </Button>
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[32px] bg-white border border-border p-8 card-shadow">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
                Join through community
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Browse available chama groups
              </h2>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search groups, purpose, or code"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          {filteredGroups.map(group => (
            <div
              key={group.id}
              className="rounded-[32px] bg-white border border-border p-7 card-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-[24px] overflow-hidden bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
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
                    <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 text-sky-700 px-3 py-1 text-xs font-semibold">
                      <Users className="w-3 h-3" />
                      {group.status === "open"
                        ? "Open to join"
                        : "Active community"}
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                      {group.name}
                    </h3>
                    <p className="mt-3 text-slate-600 leading-7 max-w-2xl">
                      {group.description}
                    </p>
                  </div>
                </div>
                <div className="text-right min-w-[160px]">
                  <p className="text-sm text-slate-500">Join code</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {group.joinCode}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-4 text-sm text-slate-700">
                <p>KES {group.monthlyContribution} / month</p>
                <p>
                  {group.memberCount} of {group.maxMembers} members
                </p>
                <p>{group.meetingDay}</p>
                <p>{group.payoutStyle}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {group.groupType}
                </span>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  Join fee KES {group.joinFee}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {group.rules.slice(0, 2).map(rule => (
                  <span
                    key={rule}
                    className="rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-600"
                  >
                    {rule}
                  </span>
                ))}
              </div>

              <div className="mt-7">
                <Button
                  className="rounded-full px-6 gap-2"
                  onClick={() => {
                    navigate(`/app/groups/${group.id}`);
                  }}
                >
                  Review and join
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
