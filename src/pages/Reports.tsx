import { trpc } from "@/providers/trpc";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Users,
} from "lucide-react";

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Reports() {
  const { data: stats } = trpc.report.dashboardStats.useQuery();
  const { data: savingsTrend } = trpc.report.savingsTrend.useQuery({ months: 6 });
  const { data: expenseBreakdown } = trpc.report.expenseBreakdown.useQuery();
  const { data: groupComparison } = trpc.report.groupComparison.useQuery();

  const savingsData = (savingsTrend ?? [])
    .filter((t) => t.type === "contribution")
    .reduce<Record<string, number>>((acc, t) => {
      const month = t.month;
      acc[month] = (acc[month] || 0) + Number(t.total);
      return acc;
    }, {});

  const savingsChart = Object.entries(savingsData).map(([month, total]) => ({
    month: month.slice(5),
    savings: total,
  }));

  const expenseData = (expenseBreakdown ?? []).map((e) => ({
    name: e.category.charAt(0).toUpperCase() + e.category.slice(1),
    value: Number(e.total),
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Saved", value: stats?.totalSavings ?? 0, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Total Expenses", value: stats?.totalExpenses ?? 0, icon: BarChart3, color: "text-red-500", bg: "bg-red-50" },
          { label: "Net Balance", value: (stats?.totalSavings ?? 0) - (stats?.totalExpenses ?? 0), icon: PieIcon, color: "text-violet-500", bg: "bg-violet-50" },
          { label: "Active Groups", value: stats?.totalGroups ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-4 card-shadow border border-border/50">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold text-foreground">
                {typeof stat.value === "number" && stat.value > 999
                  ? `$${(stat.value / 1000).toFixed(1)}k`
                  : `$${stat.value.toLocaleString()}`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Savings Trend */}
      <div className="bg-white rounded-xl card-shadow border border-border/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-foreground">Monthly Savings Trend</h3>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={savingsChart}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f8" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="savings"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#savingsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl card-shadow border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-foreground">Expense Breakdown</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {expenseData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {expenseData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Group Comparison */}
        <div className="bg-white rounded-xl card-shadow border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-foreground">Group Balances</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupComparison ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f8" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="balance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
