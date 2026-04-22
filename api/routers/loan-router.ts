import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapLoan, mapLoanRepayment, unwrap, unwrapList } from "../lib/data";

export const loanRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.string().uuid().optional(),
        borrowerId: z.string().uuid().optional(),
        status: z.enum(["pending", "active", "paid", "defaulted", "rejected"]).optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      let query = supabase.from("loans").select("*").order("created_at", { ascending: false });

      if (input?.groupId) query = query.eq("group_id", input.groupId);
      if (input?.borrowerId) query = query.eq("borrower_id", input.borrowerId);
      if (input?.status) query = query.eq("status", input.status);

      const rows = unwrapList(await query);
      return rows.map(mapLoan);
    }),

  getById: authedQuery
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const row = unwrap(
        await supabase.from("loans").select("*").eq("id", input.id).maybeSingle(),
        "Loan not found",
      ) as Record<string, unknown>;

      const repayments = unwrapList(
        await supabase.from("loan_repayments").select("*").eq("loan_id", input.id).order("month_number", { ascending: true })
      );

      return {
        ...mapLoan(row),
        repayments: repayments.map(mapLoanRepayment),
      };
    }),

  request: authedQuery
    .input(
      z.object({
        groupId: z.string().uuid(),
        amount: z.number().positive(),
        repaymentMonths: z.number().int().min(1).max(36),
        purpose: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = unwrap(
        await supabase.from("groups").select("loan_interest_rate").eq("id", input.groupId).single(),
      ) as Record<string, unknown>;

      const loan = unwrap(
        await supabase
          .from("loans")
          .insert({
            group_id: input.groupId,
            borrower_id: ctx.user.id,
            amount: input.amount,
            interest_rate: group.loan_interest_rate as number,
            repayment_months: input.repaymentMonths,
            purpose: input.purpose ?? null,
            status: "pending",
          })
          .select("*")
          .single(),
      ) as Record<string, unknown>;

      return mapLoan(loan);
    }),

  approve: authedQuery
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const loan = unwrap(
        await supabase.from("loans").select("*").eq("id", input.id).single(),
      ) as Record<string, unknown>;

      if (loan.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Loan is already approved or rejected" });
      }

      const now = new Date().toISOString();
      const { error: loanError } = await supabase
        .from("loans")
        .update({
          status: "active",
          approved_by: ctx.user.id,
          disbursed_at: now,
        })
        .eq("id", input.id);

      if (loanError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: loanError.message });

      // Generate repayment schedule (simplified)
      const repaymentMonths = loan.repayment_months as number;
      const principalPerMonth = Number(loan.amount) / repaymentMonths;
      const interestPerMonth = (Number(loan.amount) * (Number(loan.interest_rate) / 100)) / repaymentMonths;
      const totalDuePerMonth = principalPerMonth + interestPerMonth;

      const schedule = Array.from({ length: repaymentMonths }).map((_, i) => {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        return {
          loan_id: loan.id,
          month_number: i + 1,
          due_date: dueDate.toISOString().slice(0, 10),
          principal: principalPerMonth,
          interest: interestPerMonth,
          total_due: totalDuePerMonth,
          status: "pending",
        };
      });

      await supabase.from("loan_repayments").insert(schedule);

      await supabase.from("audit_log").insert({
        group_id: loan.group_id as string,
        actor_id: ctx.user.id,
        action: "approved_loan",
        target_type: "loan",
        target_id: loan.id as string,
        details: { amount: loan.amount },
      });

      return { success: true };
    }),

  reject: authedQuery
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("loans")
        .update({ status: "rejected" })
        .eq("id", input.id);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  recordRepayment: authedQuery
    .input(
      z.object({
        repaymentId: z.string().uuid(),
        amount: z.number().positive(),
        mpesaCode: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repayment = unwrap(
        await supabase.from("loan_repayments").select("*, loans(group_id)").eq("id", input.repaymentId).single(),
      ) as any;

      const { error: updateError } = await supabase
        .from("loan_repayments")
        .update({
          amount_paid: input.amount,
          mpesa_code: input.mpesaCode ?? null,
          status: input.amount >= repayment.total_due ? "paid" : "pending",
          paid_at: new Date().toISOString(),
        })
        .eq("id", input.repaymentId);

      if (updateError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: updateError.message });

      // Audit log
      await supabase.from("audit_log").insert({
        group_id: repayment.loans.group_id,
        actor_id: ctx.user.id,
        action: "recorded_repayment",
        target_type: "loan_repayment",
        target_id: input.repaymentId,
        details: { amount: input.amount },
      });

      return { success: true };
    }),
});
