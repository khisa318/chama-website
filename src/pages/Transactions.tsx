import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle,
  Filter,
  Download,
  Receipt,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TransactionsPage() {
  const { data: groups } = trpc.group.list.useQuery();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const { data: transactions } = trpc.transaction.list.useQuery({
    type: typeFilter !== "all" ? (typeFilter as "contribution" | "expense" | "loan" | "repayment") : undefined,
    groupId: groupFilter !== "all" ? Number(groupFilter) : undefined,
    limit: 100,
  });

  const typeIcons: Record<string, { icon: typeof ArrowDownLeft; color: string; bg: string }> = {
    contribution: { icon: ArrowDownLeft, color: "text-emerald-500", bg: "bg-emerald-50" },
    expense: { icon: ArrowUpRight, color: "text-red-500", bg: "bg-red-50" },
    loan: { icon: Banknote, color: "text-blue-500", bg: "bg-blue-50" },
    repayment: { icon: CheckCircle, color: "text-violet-500", bg: "bg-violet-50" },
  };

  // Group transactions by date
  const grouped = (transactions ?? []).reduce<Record<string, typeof transactions>>((acc, tx) => {
    const date = new Date(tx.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date]!.push(tx);
    return acc;
  }, {});

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white rounded-xl card-shadow border border-border/50 px-3 py-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="border-0 bg-transparent w-32">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="contribution">Contributions</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="loan">Loans</SelectItem>
              <SelectItem value="repayment">Repayments</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl card-shadow border border-border/50 px-3 py-2">
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="border-0 bg-transparent w-40">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {(groups ?? []).map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="gap-2 ml-auto">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <p className="text-sm font-medium text-muted-foreground mb-2 px-1">{date}</p>
            <div className="bg-white rounded-xl card-shadow border border-border/50 divide-y divide-border/50">
              {txs!.map((tx) => {
                const typeConfig = typeIcons[tx.type] || typeIcons.contribution;
                const TypeIcon = typeConfig.icon;
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-4">
                    <div className={`w-10 h-10 rounded-full ${typeConfig.bg} flex items-center justify-center`}>
                      <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground capitalize">{tx.type}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        tx.type === "contribution" || tx.type === "repayment" ? "text-emerald-500" : "text-red-500"
                      }`}>
                        {tx.type === "contribution" || tx.type === "repayment" ? "+" : "-"}
                        ${Number(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant="outline" className="text-[10px]">{tx.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {(!transactions || transactions.length === 0) && (
          <div className="bg-muted/50 rounded-xl p-8 text-center">
            <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}


