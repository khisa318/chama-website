import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  HandCoins,
  Plus,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function Contributions() {
  const { data: groups } = trpc.group.list.useQuery();
  const { data: contributions, refetch } = trpc.contribution.list.useQuery();
  const { data: monthlySummary } = trpc.contribution.monthlySummary.useQuery();
  const createContribution = trpc.contribution.create.useMutation({ onSuccess: () => refetch() });

  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [memberId, setMemberId] = useState("1");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  const statusIcons: Record<string, { icon: typeof CheckCircle; color: string }> = {
    completed: { icon: CheckCircle, color: "text-emerald-500" },
    pending: { icon: Clock, color: "text-amber-500" },
    failed: { icon: AlertCircle, color: "text-red-500" },
  };

  const handleSubmit = () => {
    if (!groupId || !amount) return;
    createContribution.mutate(
      {
        groupId: Number(groupId),
        memberId: Number(memberId),
        amount: Number(amount),
        date: new Date(),
        paymentMethod: paymentMethod as "cash" | "bank_transfer" | "mobile_money" | "card",
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setGroupId("");
          setAmount("");
          setNotes("");
        },
      },
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Monthly Summary */}
      <div className="gradient-hero rounded-2xl p-5 card-shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Contributions This Month</p>
            <p className="text-3xl font-bold text-white mt-1">
              ${(monthlySummary?.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-white/50 text-sm mt-1">{monthlySummary?.count ?? 0} contributions</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <HandCoins className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="add">Add New</TabsTrigger>
          </TabsList>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-accent gap-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Contribution</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Group *</Label>
                  <Select value={groupId} onValueChange={setGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {(groups ?? []).map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount ($) *</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!groupId || !amount || createContribution.isPending}
                  className="w-full gradient-accent"
                >
                  {createContribution.isPending ? "Submitting..." : "Submit Contribution"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="history" className="mt-4">
          <div className="bg-white rounded-xl card-shadow border border-border/50 divide-y divide-border/50">
            {(contributions ?? []).map((c) => {
              const status = statusIcons[c.status] || statusIcons.pending;
              const StatusIcon = status.icon;
              return (
                <div key={c.id} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <HandCoins className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">${Number(c.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.paymentMethod} - {new Date(c.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                    <Badge variant="outline" className="text-xs">{c.status}</Badge>
                  </div>
                </div>
              );
            })}
            {(!contributions || contributions.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">
                <HandCoins className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No contributions yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="add" className="mt-4">
          <div className="bg-white rounded-xl card-shadow border border-border/50 p-6 space-y-4">
            <div>
              <Label>Group *</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {(groups ?? []).map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount ($) *</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
            </div>
            <Button onClick={handleSubmit} disabled={!groupId || !amount} className="w-full gradient-accent">
              Submit Contribution
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
