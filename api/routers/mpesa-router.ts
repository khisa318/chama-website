import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { unwrap, unwrapList } from "../lib/data";

export const mpesaRouter = createRouter({
  // Initiate STK Push payment
  initiateSTKPush: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        amount: z.number().positive(),
        phoneNumber: z.string().regex(/^254\d{9}$/), // Format: 254XXXXXXXXX
        description: z.string().max(500),
        transactionType: z.enum(["contribution", "repayment", "bill_payment"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is member of group
      const member = unwrap(
        await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("user_id", ctx.user.id)
          .maybeSingle(),
        "You are not a member of this group",
      );

      // In production, you would call M-Pesa STK Push API here
      // For now, we'll create a pending transaction record

      const transaction = unwrap(
        await supabase
          .from("mpesa_transactions")
          .insert({
            group_id: input.groupId,
            member_id: member.id,
            amount: input.amount,
            phone_number: input.phoneNumber,
            transaction_type: input.transactionType,
            status: "pending",
            transaction_date: new Date().toISOString(),
            mpesa_ref: `PENDING_${Date.now()}`,
          })
          .select("*")
          .single(),
      );

      // TODO: Implement actual M-Pesa STK Push API call here
      // const stkPush = await initiateSTKPush(input.phoneNumber, input.amount);

      return {
        transactionId: transaction.id,
        status: "pending",
        message: "STK Push initiated. Please enter your M-Pesa PIN on your phone.",
      };
    }),

  // Record callback from M-Pesa
  recordC2BCallback: authedQuery
    .input(
      z.object({
        mpesaRef: z.string(),
        amount: z.number().positive(),
        phoneNumber: z.string(),
        transactionCode: z.string(),
        groupId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find matching pending transaction
      const pending = await supabase
        .from("mpesa_transactions")
        .select("*")
        .eq("group_id", input.groupId)
        .eq("phone_number", input.phoneNumber)
        .eq("amount", input.amount)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pending.data) {
        // Update transaction as matched
        const updated = unwrap(
          await supabase
            .from("mpesa_transactions")
            .update({
              status: "matched",
              mpesa_ref: input.mpesaRef,
            })
            .eq("id", pending.data.id)
            .select("*")
            .single(),
        );

        // Create contribution/transaction based on type
        if (pending.data.transaction_type === "contribution") {
          await supabase.from("contributions").insert({
            group_id: input.groupId,
            member_id: pending.data.member_id,
            amount: input.amount,
            date: new Date().toISOString(),
            payment_method: "mpesa",
            notes: `M-Pesa Ref: ${input.mpesaRef}`,
            status: "completed",
          });
        }

        return updated;
      }

      // If no pending transaction, create new one
      const group = unwrap(
        await supabase.from("groups").select("*").eq("id", input.groupId).maybeSingle(),
      );

      const newTransaction = unwrap(
        await supabase
          .from("mpesa_transactions")
          .insert({
            group_id: input.groupId,
            amount: input.amount,
            phone_number: input.phoneNumber,
            transaction_type: "contribution",
            status: "matched",
            transaction_date: new Date().toISOString(),
            mpesa_ref: input.mpesaRef,
          })
          .select("*")
          .single(),
      );

      return newTransaction;
    }),

  // Get transaction history
  getTransactions: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        status: z.enum(["pending", "matched", "completed"]).optional(),
        transactionType: z.enum(["contribution", "repayment", "bill_payment"]).optional(),
        limit: z.number().int().positive().max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("mpesa_transactions")
        .select("*")
        .eq("group_id", input.groupId);

      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.transactionType) {
        query = query.eq("transaction_type", input.transactionType);
      }

      const { data } = await query
        .order("transaction_date", { ascending: false })
        .limit(input.limit);

      return data || [];
    }),

  // Get member payment history
  getMemberPaymentHistory: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        memberId: z.number(),
        limit: z.number().int().positive().max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      const transactions = unwrapList(
        await supabase
          .from("mpesa_transactions")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("member_id", input.memberId)
          .order("transaction_date", { ascending: false })
          .limit(input.limit),
      );

      return transactions;
    }),

  // Auto-match pending transactions
  autoMatchTransactions: authedQuery
    .input(z.object({ groupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const member = unwrap(
        await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("user_id", ctx.user.id)
          .maybeSingle(),
      );

      if (!["treasurer", "chairperson", "admin"].includes(member.role)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const pending = unwrapList(
        await supabase
          .from("mpesa_transactions")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("status", "pending"),
      );

      let matchedCount = 0;

      for (const transaction of pending) {
        if (transaction.member_id) {
          // Auto-match this transaction
          await supabase
            .from("mpesa_transactions")
            .update({ status: "matched" })
            .eq("id", transaction.id);

          // Create corresponding contribution/repayment
          if (transaction.transaction_type === "contribution") {
            await supabase.from("contributions").insert({
              group_id: input.groupId,
              member_id: transaction.member_id,
              amount: transaction.amount,
              date: transaction.transaction_date,
              payment_method: "mpesa",
              notes: `M-Pesa Ref: ${transaction.mpesa_ref}`,
              status: "completed",
            });
          }

          matchedCount++;
        }
      }

      return {
        matched: matchedCount,
        total: pending.length,
      };
    }),

  // Get payment summary
  getPaymentSummary: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("mpesa_transactions")
        .select("*")
        .eq("group_id", input.groupId);

      if (input.startDate) {
        query = query.gte("transaction_date", input.startDate.toISOString());
      }

      if (input.endDate) {
        const endOfDay = new Date(input.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("transaction_date", endOfDay.toISOString());
      }

      const { data } = await query;
      const transactions = data || [];

      const summary = {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
        byType: {
          contribution: transactions
            .filter((t) => t.transaction_type === "contribution")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0),
          repayment: transactions
            .filter((t) => t.transaction_type === "repayment")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0),
          billPayment: transactions
            .filter((t) => t.transaction_type === "bill_payment")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        },
        byStatus: {
          pending: transactions.filter((t) => t.status === "pending").length,
          matched: transactions.filter((t) => t.status === "matched").length,
          completed: transactions.filter((t) => t.status === "completed").length,
        },
      };

      return summary;
    }),
});
