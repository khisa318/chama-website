import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapLoan, unwrap, unwrapList } from "../lib/data";

export const loanRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.number().optional(),
        status: z.enum(["pending", "approved", "declined", "active", "repaid"]).optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(
        await supabase.from("loans").select("*").order("created_at", { ascending: false }),
      );

      return rows
        .map(mapLoan)
        .filter((row) => {
          if (input?.groupId && row.groupId !== input.groupId) return false;
          if (input?.status && row.status !== input.status) return false;
          return true;
        });
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const row = unwrap(
        await supabase.from("loans").select("*").eq("id", input.id).maybeSingle(),
        "Loan not found",
      ) as Record<string, unknown>;
      return mapLoan(row);
    }),

  request: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        amount: z.number().positive(),
        purpose: z.string().max(500).optional(),
        repaymentPeriod: z.number().int().min(1).max(24),
        interestRate: z.number().min(0).max(100).default(5),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = unwrap(
        await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("user_id", ctx.user.id)
          .maybeSingle(),
        "You are not a member of this group",
      ) as Record<string, unknown>;

      const loan = unwrap(
        await supabase
          .from("loans")
          .insert({
            group_id: input.groupId,
            requester_id: member.id as number,
            amount: input.amount,
            purpose: input.purpose ?? null,
            repayment_period: input.repaymentPeriod,
            interest_rate: input.interestRate,
            remaining_balance: input.amount,
          })
          .select("*")
          .single(),
      ) as Record<string, unknown>;

      return mapLoan(loan);
    }),

  approve: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const loan = unwrap(
        await supabase.from("loans").select("*").eq("id", input.id).single(),
      ) as Record<string, unknown>;
      const now = new Date();
      const nextPayment = new Date(now);
      nextPayment.setMonth(nextPayment.getMonth() + 1);

      const { error: loanError } = await supabase
        .from("loans")
        .update({
          status: "active",
          approved_by: ctx.user.id,
          approved_at: now.toISOString(),
          next_payment_date: nextPayment.toISOString(),
        })
        .eq("id", input.id);

      if (loanError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: loanError.message,
        });
      }

      const group = unwrap(
        await supabase.from("groups").select("*").eq("id", loan.group_id as number).single(),
      ) as Record<string, unknown>;
      await supabase
        .from("groups")
        .update({ balance: Number(group.balance ?? 0) - Number(loan.amount ?? 0) })
        .eq("id", loan.group_id as number);

      await supabase.from("transactions").insert({
        group_id: loan.group_id as number,
        type: "loan",
        amount: Number(loan.amount ?? 0),
        description: `Loan approved: ${(loan.purpose as string | null) || "No purpose specified"}`,
        date: now.toISOString(),
        status: "completed",
        created_by: ctx.user.id,
      });

      return { success: true };
    }),

  decline: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("loans")
        .update({ status: "declined" })
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  makePayment: authedQuery
    .input(z.object({ id: z.number(), amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const loan = unwrap(
        await supabase.from("loans").select("*").eq("id", input.id).single(),
      ) as Record<string, unknown>;
      const newBalance = Math.max(0, Number(loan.remaining_balance ?? 0) - input.amount);
      const status = newBalance <= 0 ? "repaid" : "active";

      const { error: updateError } = await supabase
        .from("loans")
        .update({
          remaining_balance: newBalance,
          status,
        })
        .eq("id", input.id);

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: updateError.message,
        });
      }

      await supabase.from("transactions").insert({
        group_id: loan.group_id as number,
        type: "repayment",
        amount: input.amount,
        description: "Loan repayment",
        date: new Date().toISOString(),
        status: "completed",
        created_by: ctx.user.id,
      });

      const group = unwrap(
        await supabase.from("groups").select("*").eq("id", loan.group_id as number).single(),
      ) as Record<string, unknown>;
      await supabase
        .from("groups")
        .update({ balance: Number(group.balance ?? 0) + input.amount })
        .eq("id", loan.group_id as number);

      return { success: true, newBalance };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("loans").delete().eq("id", input.id);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),
});
