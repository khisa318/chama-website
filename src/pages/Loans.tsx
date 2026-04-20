import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Banknote,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Loans() {
  const { data: groups } = trpc.group.list.useQuery();
  const { data: loans, refetch } = trpc.loan.list.useQuery();
  const { data: pendingLoans } = trpc.loan.list.useQuery({ status: "pending" });
  const requestLoan = trpc.loan.request.useMutation({ onSuccess: () => refetch() });
  const approveLoan = trpc.loan.approve.useMutation({ onSuccess: () => refetch() });
  const declineLoan = trpc.loan.decline.useMutation({ onSuccess: () => refetch() });
  const makePayment = trpc.loan.makePayment.useMutation({ onSuccess: () => refetch() });

  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [period, setPeriod] = useState("6");

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    declined: "bg-red-100 text-red-700",
    active: "bg-blue-100 text-blue-700",
    repaid: "bg-violet-100 text-violet-700",
  };

  const handleRequest = () => {
    if (!groupId || !amount) return;
    requestLoan.mutate(
      {
        groupId: Number(groupId),
        amount: Number(amount),
        purpose: purpose || undefined,
        repaymentPeriod: Number(period),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setGroupId("");
          setAmount("");
          setPurpose("");
        },
      },
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Tabs defaultValue="my-loans" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="my-loans">My Loans</TabsTrigger>
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
          </TabsList>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-accent gap-2">
                <Plus className="w-4 h-4" />
                Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Loan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Group *</Label>
                  <Select value={groupId} onValueChange={setGroupId}>
                    <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
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
                  <Label>Purpose</Label>
                  <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Why do you need this loan?" />
                </div>
                <div>
                  <Label>Repayment Period (months)</Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleRequest} disabled={!groupId || !amount} className="w-full gradient-accent">
                  Submit Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="my-loans" className="mt-4 space-y-3">
          {(loans ?? []).filter((l) => l.status === "active" || l.status === "pending").map((loan) => (
            <div key={loan.id} className="bg-card rounded-xl card-shadow border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">${Number(loan.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <Badge className={statusColors[loan.status]}>{loan.status}</Badge>
              </div>
              {loan.purpose && <p className="text-sm text-muted-foreground mb-3">{loan.purpose}</p>}
              {loan.status === "active" && (
                <>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium">${Number(loan.remainingBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Progress
                    value={((Number(loan.amount) - Number(loan.remainingBalance)) / Number(loan.amount)) * 100}
                    className="h-2 mb-3"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const payment = prompt("Enter payment amount:");
                      if (payment) makePayment.mutate({ id: loan.id, amount: Number(payment) });
                    }}
                  >
                    Make Payment
                  </Button>
                </>
              )}
            </div>
          ))}
          {(!loans || loans.filter((l) => l.status === "active" || l.status === "pending").length === 0) && (
            <div className="bg-muted/50 rounded-xl p-8 text-center">
              <Banknote className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No active loans</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="request" className="mt-4">
          <div className="bg-card rounded-xl card-shadow border border-border p-6 space-y-4">
            <div>
              <Label>Group *</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
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
              <Label>Purpose</Label>
              <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Why do you need this loan?" />
            </div>
            <div>
              <Label>Repayment Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {groupId && amount && (
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">Interest Rate: <span className="font-medium text-foreground">5%</span></p>
                <p className="text-muted-foreground">Total Repayment: <span className="font-medium text-foreground">${(Number(amount) * 1.05).toFixed(2)}</span></p>
              </div>
            )}
            <Button onClick={handleRequest} disabled={!groupId || !amount} className="w-full gradient-accent">
              Submit Request
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="mt-4 space-y-3">
          {(pendingLoans ?? []).map((loan) => (
            <div key={loan.id} className="bg-card rounded-xl card-shadow border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">${Number(loan.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                <Badge className={statusColors[loan.status]}>{loan.status}</Badge>
              </div>
              {loan.purpose && <p className="text-sm text-muted-foreground mb-3">{loan.purpose}</p>}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 gap-1"
                  onClick={() => approveLoan.mutate({ id: loan.id })}
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:bg-red-50 gap-1"
                  onClick={() => declineLoan.mutate({ id: loan.id })}
                >
                  <XCircle className="w-4 h-4" /> Decline
                </Button>
              </div>
            </div>
          ))}
          {(!pendingLoans || pendingLoans.length === 0) && (
            <div className="bg-muted/50 rounded-xl p-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-muted-foreground">No pending approvals</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
