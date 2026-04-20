import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  CreditCard,
  Plus,
  Utensils,
  PartyPopper,
  ShieldAlert,
  Briefcase,
  Car,
  MoreHorizontal,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const categories = [
  { value: "food", label: "Food & Dining", icon: Utensils },
  { value: "events", label: "Events", icon: PartyPopper },
  { value: "emergency", label: "Emergency", icon: ShieldAlert },
  { value: "business", label: "Business", icon: Briefcase },
  { value: "transportation", label: "Transportation", icon: Car },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const catColors: Record<string, string> = {
  food: "bg-orange-100 text-orange-700",
  events: "bg-pink-100 text-pink-700",
  emergency: "bg-red-100 text-red-700",
  business: "bg-blue-100 text-blue-700",
  transportation: "bg-cyan-100 text-cyan-700",
  other: "bg-gray-100 text-muted-foreground",
};

export default function Expenses() {
  const { data: groups } = trpc.group.list.useQuery();
  const { data: expenses, refetch } = trpc.expense.list.useQuery();
  const { data: categoryBreakdown } = trpc.expense.categoryBreakdown.useQuery();
  const createExpense = trpc.expense.create.useMutation({ onSuccess: () => refetch() });

  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");

  const totalThisMonth = (categoryBreakdown ?? []).reduce((sum, c) => sum + Number(c.total), 0);

  const chartData = (categoryBreakdown ?? []).map((c) => ({
    name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
    amount: Number(c.total),
  }));

  const handleSubmit = () => {
    if (!groupId || !description || !amount) return;
    createExpense.mutate(
      {
        groupId: Number(groupId),
        description,
        amount: Number(amount),
        category: category as "food" | "events" | "emergency" | "business" | "transportation" | "other",
        date: new Date(),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setGroupId("");
          setDescription("");
          setAmount("");
          setCategory("other");
        },
      },
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Summary Card */}
      <div className="gradient-hero rounded-2xl p-5 card-shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Total Expenses This Month</p>
            <p className="text-xl font-bold text-white mt-1">
              ${totalThisMonth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-14 h-14 rounded-full bg-card/10 flex items-center justify-center">
            <CreditCard className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Category Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl card-shadow border border-border p-4">
          <h3 className="font-medium text-foreground mb-3">By Category</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="amount" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <Tabs defaultValue="history" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="record">Record</TabsTrigger>
          </TabsList>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-accent gap-2">
                <Plus className="w-4 h-4" />
                Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Expense</DialogTitle>
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
                  <Label>Description *</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for?" />
                </div>
                <div>
                  <Label>Amount ($) *</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          onClick={() => setCategory(cat.value)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                            category === cat.value
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-[10px]">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button onClick={handleSubmit} disabled={!groupId || !description || !amount} className="w-full gradient-accent">
                  Save Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="history" className="mt-4">
          <div className="bg-card rounded-xl card-shadow border border-border divide-y divide-border/50">
            {(expenses ?? []).map((e) => {
              const cat = categories.find((c) => c.value === e.category);
              const CatIcon = cat?.icon || MoreHorizontal;
              return (
                <div key={e.id} className="flex items-center gap-3 p-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${catColors[e.category]?.split(" ")[0] || "bg-gray-50"}`}>
                    <CatIcon className={`w-5 h-5 ${catColors[e.category]?.split(" ")[1] || "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{e.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-500">
                      -${Number(e.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <Badge variant="outline" className={`text-[10px] ${catColors[e.category] || ""}`}>
                      {e.category}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {(!expenses || expenses.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No expenses recorded</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="record" className="mt-4">
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
              <Label>Description *</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for?" />
            </div>
            <div>
              <Label>Amount ($) *</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Category</Label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                        category === cat.value ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px]">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={!groupId || !description || !amount} className="w-full gradient-accent">
              Save Expense
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
