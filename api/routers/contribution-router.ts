import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapContribution, unwrap, unwrapList } from "../lib/data";

export const contributionRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.string().uuid().optional(),
        userId: z.string().uuid().optional(),
        status: z.enum(["paid", "pending", "overdue"]).optional(),
        monthYear: z.string().optional(), // "YYYY-MM"
      }).optional(),
    )
    .query(async ({ input }) => {
      let query = supabase.from("contributions").select("*").order("created_at", { ascending: false });

      if (input?.groupId) query = query.eq("group_id", input.groupId);
      if (input?.userId) query = query.eq("user_id", input.userId);
      if (input?.status) query = query.eq("status", input.status);
      if (input?.monthYear) query = query.eq("month_year", input.monthYear);

      const rows = unwrapList(await query);
      return rows.map(mapContribution);
    }),

  getById: authedQuery
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const row = unwrap(
        await supabase.from("contributions").select("*").eq("id", input.id).maybeSingle(),
        "Contribution not found",
      ) as Record<string, unknown>;
      return mapContribution(row);
    }),

  record: authedQuery
    .input(
      z.object({
        groupId: z.string().uuid(),
        userId: z.string().uuid(),
        amount: z.number().positive(),
        monthYear: z.string().regex(/^\d{4}-\d{2}$/), // "YYYY-MM"
        paymentMethod: z.enum(["mpesa", "cash", "bank"]),
        mpesaCode: z.string().optional(),
        status: z.enum(["paid", "pending"]).default("paid"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const contribution = unwrap(
        await supabase
          .from("contributions")
          .insert({
            group_id: input.groupId,
            user_id: input.userId,
            amount: input.amount,
            month_year: input.monthYear,
            payment_method: input.paymentMethod,
            mpesa_code: input.mpesaCode ?? null,
            status: input.status,
            recorded_by: ctx.user.id,
            paid_at: input.status === "paid" ? new Date().toISOString() : null,
          })
          .select("*")
          .single(),
      ) as Record<string, unknown>;

      // Audit log entry
      await supabase.from("audit_log").insert({
        group_id: input.groupId,
        actor_id: ctx.user.id,
        action: "recorded_contribution",
        target_type: "contribution",
        target_id: contribution.id as string,
        details: { amount: input.amount, monthYear: input.monthYear },
      });

      return mapContribution(contribution);
    }),

  updateStatus: authedQuery
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["paid", "pending", "overdue"]),
        mpesaCode: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const updates: Record<string, unknown> = {
        status: input.status,
        paid_at: input.status === "paid" ? new Date().toISOString() : null,
      };
      if (input.mpesaCode) updates.mpesa_code = input.mpesaCode;

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
    .input(z.object({ id: z.string().uuid() }))
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

  getSummary: authedQuery
    .input(z.object({ groupId: z.string().uuid(), monthYear: z.string().optional() }))
    .query(async ({ input }) => {
      const monthYear = input.monthYear ?? new Date().toISOString().slice(0, 7);
      
      const { data: contributions } = await supabase
        .from("contributions")
        .select("amount, status")
        .eq("group_id", input.groupId)
        .eq("month_year", monthYear);

      const totalPaid = contributions?.filter(c => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const totalPending = contributions?.filter(c => c.status === "pending").reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      return {
        monthYear,
        totalPaid,
        totalPending,
        count: contributions?.length || 0,
      };
    }),
});
