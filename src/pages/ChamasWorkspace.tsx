import { useState } from "react";
import { Link } from "react-router";
import { Users, Search, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/providers/trpc";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChamasWorkspace() {
  const [query, setQuery] = useState("");
  const { data: myGroups, isLoading: myLoading } = trpc.group.listMyGroups.useQuery();
  const { data: publicGroups, isLoading: publicLoading } = trpc.group.listPublic.useQuery();
  const createMutation = trpc.group.create.useMutation();

  const [createForm, setCreateForm] = useState({
    name: "",
    type: "savings" as any,
    description: "",
    targetAmount: 0,
    loanInterestRate: 10,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(createForm);
      alert("Chama created successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const visiblePublic = publicGroups?.filter(
    g => g.name.toLowerCase().includes(query.toLowerCase()) || 
         g.description.toLowerCase().includes(query.toLowerCase())
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
        
        <TabsContent value="my-chamas" className="mt-6">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {myLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-[28px]" />)
            ) : myGroups && myGroups.length > 0 ? (
              myGroups.map(group => (
                <div key={group.id} className="rounded-[28px] bg-card border border-border p-6 card-shadow hover-lift">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center font-bold text-lg text-foreground">
                      {group.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg line-clamp-1">{group.name}</h3>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.type}</p>
                    </div>
                  </div>
                  <Link to={`/app/groups/${group.id}`}>
                    <Button className="w-full rounded-[16px] font-bold">Open Dashboard</Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center rounded-[32px] border border-dashed border-border bg-card">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-bold">You haven't joined any chamas yet</h3>
                <p className="text-muted-foreground">Discover public groups or create your own.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="discover" className="mt-6">
          <div className="mb-6 relative max-w-md">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search public chamas..."
              className="pl-11 h-12 rounded-[16px]"
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {publicLoading ? (
              <Skeleton className="h-48 rounded-[28px]" />
            ) : visiblePublic?.map(group => (
              <div key={group.id} className="rounded-[28px] bg-card border border-border p-5 card-shadow hover-lift">
                <h2 className="text-xl font-bold">{group.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                <div className="mt-4 flex gap-3">
                  <Link to={`/app/groups/${group.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">Details</Button>
                  </Link>
                  <Link to={`/app/groups/${group.id}`} className="flex-1">
                    <Button className="w-full">Join</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <div className="max-w-2xl rounded-[32px] bg-card border border-border p-8 card-shadow">
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="text-sm font-bold block mb-2">Chama Name</label>
                <Input value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} placeholder="e.g. Vision 2030" required />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-bold block mb-2">Type</label>
                  <select 
                    value={createForm.type} 
                    onChange={e => setCreateForm({...createForm, type: e.target.value as any})}
                    className="w-full h-12 rounded-[16px] border border-border bg-transparent px-3"
                  >
                    <option value="savings">Savings</option>
                    <option value="investment">Investment</option>
                    <option value="welfare">Welfare</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-2">Target Amount (KES)</label>
                  <Input type="number" value={createForm.targetAmount} onChange={e => setCreateForm({...createForm, targetAmount: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold block mb-2">Description</label>
                <textarea 
                  value={createForm.description} 
                  onChange={e => setCreateForm({...createForm, description: e.target.value})}
                  className="w-full min-h-[100px] rounded-[16px] border border-border bg-transparent p-3"
                  placeholder="What is the purpose of this group?"
                />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full h-12 rounded-[16px] font-bold">
                {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Create Chama"}
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
