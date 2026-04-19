import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapExpense, unwrap, unwrapList } from "../lib/data";

export const expenseRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.number().optional(),
        category: z
          .enum(["food", "events", "emergency", "business", "transportation", "other"])
          .optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(
        await supabase.from("expenses").select("*").order("date", { ascending: false }),
      );

      return rows
        .map(mapExpense)
        .filter((row) => {
          if (input?.groupId && row.groupId !== input.groupId) return false;
          if (input?.category && row.category !== input.category) return false;
          const date = new Date(row.date);
          if (input?.dateFrom && date < input.dateFrom) return false;
          if (input?.dateTo && date > input.dateTo) return false;
          return true;
        });
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const row = unwrap(
        await supabase.from("expenses").select("*").eq("id", input.id).maybeSingle(),
        "Expense not found",
      ) as Record<string, unknown>;
      return mapExpense(row);
    }),

  create: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        description: z.string().min(1).max(500),
        amount: z.number().positive(),
        category: z.enum(["food", "events", "emergency", "business", "transportation", "other"]),
        date: z.date(),
        receiptUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const expense = unwrap(
        await supabase
          .from("expenses")
          .insert({
            group_id: input.groupId,
            description: input.description,
            amount: input.amount,
            category: input.category,
            date: input.date.toISOString(),
            receipt_url: input.receiptUrl ?? null,
            created_by: ctx.user.id,
          })
          .select("*")
          .single(),
      ) as Record<string, unknown>;

      const group = unwrap(
        await supabase.from("groups").select("*").eq("id", input.groupId).single(),
      ) as Record<string, unknown>;
      await supabase
        .from("groups")
        .update({ balance: Number(group.balance ?? 0) - input.amount })
        .eq("id", input.groupId);

      await supabase.from("transactions").insert({
        group_id: input.groupId,
        type: "expense",
        amount: input.amount,
        description: input.description,
        category: input.category,
        date: input.date.toISOString(),
        status: "completed",
        created_by: ctx.user.id,
      });

      return mapExpense(expense);
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("expenses").delete().eq("id", input.id);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  categoryBreakdown: authedQuery
    .input(
      z.object({
        groupId: z.number().optional(),
        month: z.number().optional(),
        year: z.number().optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(await supabase.from("expenses").select("*"));
      const now = new Date();
      const month = input?.month ?? now.getMonth() + 1;
      const year = input?.year ?? now.getFullYear();

      const summary = new Map<string, { category: string; total: number; count: number }>();

      for (const row of rows.map(mapExpense)) {
        const date = new Date(row.date);
        if (date.getMonth() + 1 !== month || date.getFullYear() !== year) continue;
        if (input?.groupId && row.groupId !== input.groupId) continue;

        const current = summary.get(row.category) ?? {
          category: row.category,
          total: 0,
          count: 0,
        };
        current.total += row.amount;
        current.count += 1;
        summary.set(row.category, current);
      }

      return [...summary.values()];
    }),
});
