import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapContribution, unwrap, unwrapList } from "../lib/data";

function inDateRange(value: string, from?: Date, to?: Date) {
  const date = new Date(value);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export const contributionRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.number().optional(),
        status: z.enum(["completed", "pending", "failed"]).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(
        await supabase
          .from("contributions")
          .select("*")
          .order("created_at", { ascending: false }),
      );

      return rows
        .map(mapContribution)
        .filter((row) => {
          if (input?.groupId && row.groupId !== input.groupId) return false;
          if (input?.status && row.status !== input.status) return false;
          return inDateRange(row.date, input?.dateFrom, input?.dateTo);
        });
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const row = unwrap(
        await supabase.from("contributions").select("*").eq("id", input.id).maybeSingle(),
        "Contribution not found",
      ) as Record<string, unknown>;
      return mapContribution(row);
    }),

  create: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        memberId: z.number(),
        amount: z.number().positive(),
        date: z.date(),
        paymentMethod: z
          .enum(["cash", "bank_transfer", "mobile_money", "card"])
          .default("cash"),
        notes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const contribution = unwrap(
        await supabase
          .from("contributions")
          .insert({
            group_id: input.groupId,
            member_id: input.memberId,
            amount: input.amount,
            date: input.date.toISOString(),
            payment_method: input.paymentMethod,
            notes: input.notes ?? null,
          })
          .select("*")
          .single(),
      ) as Record<string, unknown>;

      const group = unwrap(
        await supabase.from("groups").select("*").eq("id", input.groupId).single(),
      ) as Record<string, unknown>;
      const member = unwrap(
        await supabase.from("group_members").select("*").eq("id", input.memberId).single(),
      ) as Record<string, unknown>;

      await supabase
        .from("groups")
        .update({ balance: Number(group.balance ?? 0) + input.amount })
        .eq("id", input.groupId);

      await supabase
        .from("group_members")
        .update({
          total_contributed: Number(member.total_contributed ?? 0) + input.amount,
          contribution_status: "paid",
        })
        .eq("id", input.memberId);

      await supabase.from("transactions").insert({
        group_id: input.groupId,
        type: "contribution",
        amount: input.amount,
        description: `Contribution via ${input.paymentMethod}`,
        date: input.date.toISOString(),
        status: "completed",
        created_by: ctx.user.id,
      });

      return mapContribution(contribution);
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["completed", "pending", "failed"]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const updates: Record<string, unknown> = {};
      if (input.status) updates.status = input.status;

      const { error } = await supabase.from("contributions").update(updates).eq("id", input.id);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("contributions").delete().eq("id", input.id);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  monthlySummary: authedQuery
    .input(
      z.object({
        groupId: z.number().optional(),
        month: z.number().optional(),
        year: z.number().optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(await supabase.from("contributions").select("*"));
      const now = new Date();
      const month = input?.month ?? now.getMonth() + 1;
      const year = input?.year ?? now.getFullYear();

      const filtered = rows
        .map(mapContribution)
        .filter((row) => {
          const date = new Date(row.date);
          if (date.getMonth() + 1 !== month || date.getFullYear() !== year) return false;
          if (input?.groupId && row.groupId !== input.groupId) return false;
          return true;
        });

      return {
        total: filtered.reduce((sum, row) => sum + row.amount, 0),
        count: filtered.length,
        month,
        year,
      };
    }),
});
