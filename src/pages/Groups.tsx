import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Plus,
  Search,
  Users,
  ChevronRight,
  Crown,
  UserCheck,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Groups() {
  const { data: groups, refetch } = trpc.group.list.useQuery();
  const createGroup = trpc.group.create.useMutation({ onSuccess: () => refetch() });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");

  const filteredGroups = (groups ?? []).filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = () => {
    if (!name.trim()) return;
    createGroup.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        monthlyContribution: Number(monthlyContribution) || 0,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDescription("");
          setMonthlyContribution("");
        },
      },
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Search and Create */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-accent gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Group</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Family Savings"
                />
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this group for?"
                />
              </div>
              <div>
                <Label htmlFor="amount">Monthly Contribution ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || createGroup.isPending}
                className="w-full gradient-accent"
              >
                {createGroup.isPending ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Group List */}
      <div className="space-y-3">
        {filteredGroups.map((group) => (
          <Link
            key={group.id}
            to={`/groups/${group.id}`}
            className="flex items-center gap-4 p-4 bg-white rounded-xl card-shadow border border-border/50 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {group.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{group.name}</p>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
                  Admin
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{group.description}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {group.memberCount} members
                </span>
                <span className="text-xs text-muted-foreground">
                  ${Number(group.monthlyContribution).toLocaleString()}/mo
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-foreground">
                ${Number(group.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">Balance</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </Link>
        ))}

        {filteredGroups.length === 0 && (
          <div className="bg-muted/50 rounded-xl p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              {search ? "No groups match your search" : "No groups yet"}
            </p>
            {!search && (
              <button
                onClick={() => setOpen(true)}
                className="text-primary text-sm mt-1 inline-block"
              >
                Create your first group
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
