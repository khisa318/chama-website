import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import {
  mapContribution,
  mapExpense,
  mapGroup,
  mapGroupMember,
  mapLoan,
  mapTransaction,
  unwrapList,
} from "../lib/data";

export const reportRouter = createRouter({
  savingsTrend: authedQuery
    .input(
      z.object({
        groupId: z.number().optional(),
        months: z.number().default(6),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(await supabase.from("transactions").select("*"))
        .map(mapTransaction)
        .filter((row) => row.status === "completed");

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (input?.months ?? 6) + 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const totals = new Map<string, { month: string; type: string; total: number }>();

      for (const row of rows) {
        const date = new Date(row.date);
        if (date < startDate) continue;
        if (input?.groupId && row.groupId !== input.groupId) continue;

        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const key = `${month}:${row.type}`;
        const current = totals.get(key) ?? { month, type: row.type, total: 0 };
        current.total += row.amount;
        totals.set(key, current);
      }

      return [...totals.values()].sort((a, b) => a.month.localeCompare(b.month));
    }),

  memberContributions: authedQuery
    .input(z.object({ groupId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const rows = unwrapList(await supabase.from("group_members").select("*"))
        .map(mapGroupMember)
        .filter((row) => row.contributionStatus === "paid");

      return rows.filter((row) => !input?.groupId || row.groupId === input.groupId);
    }),

  expenseBreakdown: authedQuery
    .input(
      z.object({
        groupId: z.number().optional(),
        month: z.number().optional(),
        year: z.number().optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(await supabase.from("expenses").select("*")).map(mapExpense);
      const now = new Date();
      const month = input?.month ?? now.getMonth() + 1;
      const year = input?.year ?? now.getFullYear();
      const totals = new Map<string, { category: string; total: number }>();

      for (const row of rows) {
        const date = new Date(row.date);
        if (date.getMonth() + 1 !== month || date.getFullYear() !== year) continue;
        if (input?.groupId && row.groupId !== input.groupId) continue;

        const current = totals.get(row.category) ?? { category: row.category, total: 0 };
        current.total += row.amount;
        totals.set(row.category, current);
      }

      return [...totals.values()];
    }),

  groupComparison: authedQuery.query(async () => {
    return unwrapList(await supabase.from("groups").select("*")).map(mapGroup);
  }),

  dashboardStats: authedQuery.query(async () => {
    const groups = unwrapList(await supabase.from("groups").select("*")).map(mapGroup);
    const members = unwrapList(await supabase.from("group_members").select("*")).map(mapGroupMember);
    const loans = unwrapList(await supabase.from("loans").select("*")).map(mapLoan);
    const contributions = unwrapList(await supabase.from("contributions").select("*")).map(mapContribution);
    const expenses = unwrapList(await supabase.from("expenses").select("*")).map(mapExpense);

    return {
      totalSavings: groups.reduce((sum, group) => sum + group.balance, 0),
      totalGroups: groups.length,
      totalMembers: members.length,
      activeLoans: loans.filter((loan) => loan.status === "active").length,
      pendingLoans: loans.filter((loan) => loan.status === "pending").length,
      totalContributions: contributions.reduce((sum, row) => sum + row.amount, 0),
      totalExpenses: expenses.reduce((sum, row) => sum + row.amount, 0),
    };
  }),
});
