import { useState } from "react";
import { Link } from "react-router";
import { Users, Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChamaState } from "@/hooks/useChamaState";
import { useAuth } from "@/hooks/useAuth";

export default function ChamasWorkspace() {
  const { memberGroups, groups } = useChamaState();
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  const visibleGroups = groups.filter(
    group =>
      group.name.toLowerCase().includes(query.toLowerCase()) ||
      group.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Chamas</h1>
          <p className="text-muted-foreground mt-1">Manage, discover, or create your savings groups.</p>
        </div>
      </div>

      <Tabs defaultValue="my-chamas" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md h-12 rounded-[16px] p-1 bg-secondary border border-border">
          <TabsTrigger value="my-chamas" className="rounded-xl font-bold">My Chamas</TabsTrigger>
          <TabsTrigger value="discover" className="rounded-xl font-bold">Discover</TabsTrigger>
          <TabsTrigger value="create" className="rounded-xl font-bold">Create Chama</TabsTrigger>
        </TabsList>
        
        {/* My Chamas Tab */}
        <TabsContent value="my-chamas" className="mt-6">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {memberGroups.length > 0 ? (
              memberGroups.map(group => (
                <div key={group.id} className="rounded-[28px] bg-card border border-border p-6 card-shadow hover-lift">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center font-bold text-lg text-foreground">
                      {group.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg line-clamp-1">{group.name}</h3>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.role}</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">My Stake</span>
                      <span className="font-bold text-foreground">KES {group.totalContributed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Members</span>
                      <span className="font-bold text-foreground">{group.memberCount} active</span>
                    </div>
                  </div>
                  <Link to={`/app/groups/${group.id}`}>
                    <Button className="w-full rounded-[16px] font-bold">Open Dashboard</Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center rounded-[32px] border border-dashed border-border bg-card">
                <div className="w-16 h-16 mx-auto bg-secondary rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">You haven't joined any chamas yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">Discover existing public groups or create your own private circle.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover" className="mt-6">
          <div className="mb-6 relative max-w-md">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search public chamas by name or purpose..."
              className="pl-11 h-12 rounded-[16px] border-border bg-card"
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {visibleGroups.filter(g => !g.role).map(group => (
              <div key={group.id} className="rounded-[28px] bg-card border border-border p-5 card-shadow hover-lift">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-[20px] bg-secondary text-primary flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{group.name}</h2>
                      <p className="mt-2 text-sm text-muted-foreground leading-6 line-clamp-2">{group.description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground grid-cols-2">
                  <p className="font-semibold text-foreground">KES {group.monthlyContribution} / mo</p>
                  <p>{group.memberCount} / {group.maxMembers} members</p>
                  <p>{group.meetingDay}</p>
                  <p>{group.payoutStyle}</p>
                </div>
                <div className="mt-4 flex gap-3">
                  <Link to={`/app/groups/${group.id}`} className="flex-1">
                    <Button variant="outline" className="w-full rounded-[16px] font-bold">View Details</Button>
                  </Link>
                  <Link to={`/app/groups/${group.id}`} className="flex-1">
                    <Button className="flex-1 rounded-[16px] font-bold">Join Chama</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Create Chama Tab */}
        <TabsContent value="create" className="mt-6">
          <div className="max-w-2xl rounded-[32px] bg-card border border-border p-8 card-shadow">
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <PlusCircle className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Create a new Chama</h2>
              <p className="text-muted-foreground mt-2">Set up rules and invite members.</p>
            </div>
            
            <form className="space-y-6">
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">Chama Name</label>
                <Input placeholder="e.g. Vision 2030 Investors" className="h-12 rounded-[16px]" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">Privacy</label>
                  <select className="flex h-12 w-full rounded-[16px] border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                    <option value="private">Private (Invite Only)</option>
                    <option value="public">Public (Discoverable)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">Cycle Type</label>
                  <select className="flex h-12 w-full rounded-[16px] border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                    <option value="merry-go-round">Merry-Go-Round</option>
                    <option value="investment">Investment Pool</option>
                    <option value="welfare">Welfare / Emergency</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">Contribution Amount (KES)</label>
                <Input type="number" placeholder="5000" className="h-12 rounded-[16px]" />
              </div>
              <div className="pt-4 border-t border-border">
                <Button className="w-full h-12 rounded-[16px] font-bold text-base">Create Chama</Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
