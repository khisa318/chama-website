import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapTransaction, unwrap, unwrapList } from "../lib/data";

export const transactionRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.number().optional(),
        type: z.enum(["contribution", "expense", "loan", "repayment"]).optional(),
        status: z.enum(["completed", "pending", "failed"]).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(
        await supabase.from("transactions").select("*").order("date", { ascending: false }),
      );

      return rows
        .map(mapTransaction)
        .filter((row) => {
          if (input?.groupId && row.groupId !== input.groupId) return false;
          if (input?.type && row.type !== input.type) return false;
          if (input?.status && row.status !== input.status) return false;
          const date = new Date(row.date);
          if (input?.dateFrom && date < input.dateFrom) return false;
          if (input?.dateTo && date > input.dateTo) return false;
          return true;
        })
        .slice(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const row = unwrap(
        await supabase.from("transactions").select("*").eq("id", input.id).maybeSingle(),
        "Transaction not found",
      ) as Record<string, unknown>;
      return mapTransaction(row);
    }),

  create: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        type: z.enum(["contribution", "expense", "loan", "repayment"]),
        amount: z.number().positive(),
        description: z.string().max(500).optional(),
        category: z.string().max(100).optional(),
        date: z.date(),
        status: z.enum(["completed", "pending", "failed"]).default("completed"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const row = unwrap(
        await supabase
          .from("transactions")
          .insert({
            group_id: input.groupId,
            type: input.type,
            amount: input.amount,
            description: input.description ?? null,
            category: input.category ?? null,
            date: input.date.toISOString(),
            status: input.status,
            created_by: ctx.user.id,
          })
          .select("*")
          .single(),
      ) as Record<string, unknown>;

      return mapTransaction(row);
    }),

  monthlyStats: authedQuery
    .input(
      z.object({
        groupId: z.number().optional(),
        months: z.number().default(6),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(await supabase.from("transactions").select("*"));
      const months = input?.months ?? 6;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months + 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const totals = new Map<string, { type: string; month: string; total: number }>();

      for (const row of rows.map(mapTransaction)) {
        const date = new Date(row.date);
        if (date < startDate) continue;
        if (input?.groupId && row.groupId !== input.groupId) continue;

        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const key = `${month}:${row.type}`;
        const current = totals.get(key) ?? { type: row.type, month, total: 0 };
        current.total += row.amount;
        totals.set(key, current);
      }

      return [...totals.values()].sort((a, b) => a.month.localeCompare(b.month));
    }),
});
