import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Users,
  Search,
  UserPlus,
  Crown,
  Shield,
  UserCircle,
  HandCoins,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Members() {
  const { data: groups } = trpc.group.list.useQuery();
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: groupDetails } = trpc.group.getById.useQuery(
    { id: Number(selectedGroup) },
    { enabled: selectedGroup !== "all" },
  );

  // Flatten all members from all groups
  const allMembers = (groups ?? []).flatMap((g) =>
    (groupDetails?.members ?? []).map((m) => ({ ...m, groupName: g.name })),
  );

  const roleIcons: Record<string, typeof Crown> = {
    admin: Crown,
    treasurer: Shield,
    member: UserCircle,
  };

  const roleColors: Record<string, string> = {
    admin: "bg-violet-100 text-violet-700",
    treasurer: "bg-blue-100 text-blue-700",
    member: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Search and Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {(groups ?? []).map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-accent gap-2">
              <UserPlus className="w-4 h-4" />
              Invite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Group</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    {(groups ?? []).map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email or Phone</Label>
                <Input placeholder="member@example.com" />
              </div>
              <div>
                <Label>Role</Label>
                <Select defaultValue="member">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="treasurer">Treasurer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full gradient-accent">Send Invite</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl card-shadow border border-border/50 divide-y divide-border/50">
        {(groupDetails?.members ?? []).map((member) => {
          const RoleIcon = roleIcons[member.role] || UserCircle;
          return (
            <div key={member.id} className="flex items-center gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg">
                {member.role?.charAt(0).toUpperCase() || "M"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">Member #{member.id}</p>
                  <Badge variant="secondary" className={roleColors[member.role] || ""}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {member.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <HandCoins className="w-3 h-3" />
                    ${Number(member.totalContributed).toLocaleString()} contributed
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  member.contributionStatus === "paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : member.contributionStatus === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                }
              >
                {member.contributionStatus}
              </Badge>
            </div>
          );
        })}

        {(!groupDetails?.members || groupDetails.members.length === 0) && (
          <div className="p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {selectedGroup === "all" ? "Select a group to see members" : "No members in this group"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
