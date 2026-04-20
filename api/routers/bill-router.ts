import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { unwrap, unwrapList } from "../lib/data";

export const billRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        status: z.enum(["pending", "partially_paid", "paid", "overdue"]).optional(),
        year: z.number().int().optional(),
        month: z.number().int().min(1).max(12).optional(),
      }),
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("bills")
        .select("*, payments:bill_payments(*)")
        .eq("group_id", input.groupId);

      if (input.status) {
        query = query.eq("status", input.status);
      }

      const { data } = await query.order("bill_month", { ascending: false });

      return (data || [])
        .map((bill) => ({
          ...bill,
          totalPaid: (bill.payments || []).reduce((sum: number, p: any) => sum + parseFloat(p.amount_paid), 0),
          remainingAmount: parseFloat(bill.bill_amount) - ((bill.payments || []).reduce((sum: number, p: any) => sum + parseFloat(p.amount_paid), 0)),
        }))
        .filter((bill) => {
          if (input.year && new Date(bill.bill_month).getFullYear() !== input.year) return false;
          if (input.month && new Date(bill.bill_month).getMonth() + 1 !== input.month) return false;
          return true;
        });
    }),

  createMonthlyBill: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        billMonth: z.date(),
        billAmount: z.number().positive(),
        billType: z.enum(["contribution", "fine", "loan", "other"]),
        description: z.string().max(500).optional(),
        dueDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is treasurer or chairperson
      const member = unwrap(
        await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("user_id", ctx.user.id)
          .maybeSingle(),
        "Not authorized",
      );

      if (!["treasurer", "chairperson", "admin"].includes(member.role)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if bill already exists for this month
      const existing = await supabase
        .from("bills")
        .select("*")
        .eq("group_id", input.groupId)
        .eq("bill_month", input.billMonth.toISOString().split("T")[0])
        .eq("bill_type", input.billType)
        .maybeSingle();

      if (existing.data) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bill already exists for this month",
        });
      }

      const bill = unwrap(
        await supabase
          .from("bills")
          .insert({
            group_id: input.groupId,
            bill_month: input.billMonth.toISOString().split("T")[0],
            bill_amount: input.billAmount,
            bill_type: input.billType,
            description: input.description ?? null,
            due_date: input.dueDate?.toISOString().split("T")[0] ?? null,
            status: "pending",
          })
          .select("*")
          .single(),
      );

      // Notify all members
      const members = unwrapList(
        await supabase.from("group_members").select("user_id").eq("group_id", input.groupId),
      );

      for (const m of members) {
        await supabase.from("notifications").insert({
          user_id: m.user_id,
          group_id: input.groupId,
          type: "bill",
          title: "New Bill Created",
          message: `New ${input.billType} bill of KES ${input.billAmount} is due`,
        });
      }

      // Create audit log
      await supabase.from("audit_logs").insert({
        group_id: input.groupId,
        user_id: ctx.user.id,
        action: "created_bill",
        entity_type: "bill",
        entity_id: bill.id,
        details: `Created ${input.billType} bill for KES ${input.billAmount}`,
      });

      return bill;
    }),

  recordPayment: authedQuery
    .input(
      z.object({
        billId: z.number(),
        groupId: z.number(),
        memberId: z.number(),
        amountPaid: z.number().positive(),
        paymentMethod: z.enum(["cash", "mpesa", "bank"]).default("cash"),
        mpesaRef: z.string().optional(),
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
      );

      if (!["treasurer", "chairperson", "admin"].includes(member.role)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const bill = unwrap(
        await supabase.from("bills").select("*").eq("id", input.billId).maybeSingle(),
      );

      // Record payment
      const payment = unwrap(
        await supabase
          .from("bill_payments")
          .insert({
            bill_id: input.billId,
            member_id: input.memberId,
            amount_paid: input.amountPaid,
            payment_method: input.paymentMethod,
            mpesa_ref: input.mpesaRef ?? null,
          })
          .select("*")
          .single(),
      );

      // Get total paid
      const payments = unwrapList(
        await supabase
          .from("bill_payments")
          .select("amount_paid")
          .eq("bill_id", input.billId),
      );

      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
      const billAmount = parseFloat(bill.bill_amount);

      // Update bill status
      let newStatus = "pending";
      if (totalPaid >= billAmount) {
        newStatus = "paid";
      } else if (totalPaid > 0) {
        newStatus = "partially_paid";
      }

      await supabase.from("bills").update({ status: newStatus }).eq("id", input.billId);

      // Create transaction record
      await supabase.from("transactions").insert({
        group_id: input.groupId,
        type: "bill_payment",
        amount: input.amountPaid,
        description: `${bill.bill_type} bill payment`,
        category: "bill",
        date: new Date().toISOString(),
        status: "completed",
        created_by: ctx.user.id,
      });

      return payment;
    }),

  getMemberBills: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        memberId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const bills = unwrapList(
        await supabase
          .from("bills")
          .select("*, payments:bill_payments(*)")
          .eq("group_id", input.groupId),
      );

      return bills.map((bill) => ({
        ...bill,
        memberPayment: bill.payments.find((p: any) => p.member_id === input.memberId),
        totalPaid: bill.payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount_paid), 0),
        remainingAmount: parseFloat(bill.bill_amount) - bill.payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount_paid), 0),
      }));
    }),

  getBillingSummary: authedQuery
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const bills = unwrapList(
        await supabase
          .from("bills")
          .select("*, payments:bill_payments(*)")
          .eq("group_id", input.groupId),
      );

      const totalBilled = bills.reduce((sum, b) => sum + parseFloat(b.bill_amount), 0);
      const totalCollected = bills.reduce(
        (sum, b) => sum + b.payments.reduce((pSum: number, p: any) => pSum + parseFloat(p.amount_paid), 0),
        0
      );

      return {
        totalBilled,
        totalCollected,
        totalOutstanding: totalBilled - totalCollected,
        paidBills: bills.filter((b) => b.status === "paid").length,
        partiallyPaidBills: bills.filter((b) => b.status === "partially_paid").length,
        pendingBills: bills.filter((b) => b.status === "pending").length,
        overdueBills: bills.filter((b) => b.status === "overdue").length,
        collectionRate: ((totalCollected / totalBilled) * 100).toFixed(2),
      };
    }),
});
