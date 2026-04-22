import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapMpesaTransaction, unwrap, unwrapList } from "../lib/data";

export const mpesaRouter = createRouter({
  // Initiate STK Push payment
  initiateSTKPush: authedQuery
    .input(
      z.object({
        groupId: z.string().uuid(),
        amount: z.number().positive(),
        phoneNumber: z.string().regex(/^254\d{9}$/), // Format: 254XXXXXXXXX
        description: z.string().max(500),
        transactionType: z.enum(["contribution", "repayment"]),
        targetId: z.string().uuid().optional(), // e.g. repayment ID
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const isMock = process.env.NEXT_PUBLIC_MPESA_MOCK === "true" || true; // Default to true for now

      if (isMock) {
        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const mpesaCode = `MOCK${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

        // Create the actual record based on type
        if (input.transactionType === "contribution") {
          await supabase.from("contributions").insert({
            group_id: input.groupId,
            user_id: ctx.user.id,
            amount: input.amount,
            month_year: new Date().toISOString().slice(0, 7),
            payment_method: "mpesa",
            mpesa_code: mpesaCode,
            status: "paid",
            recorded_by: ctx.user.id,
            paid_at: new Date().toISOString(),
          });
        } else if (input.transactionType === "repayment" && input.targetId) {
          await supabase.from("loan_repayments").update({
            amount_paid: input.amount,
            mpesa_code: mpesaCode,
            status: "paid",
            paid_at: new Date().toISOString(),
          }).eq("id", input.targetId);
        }

        // Log to raw mpesa_transactions
        await supabase.from("mpesa_transactions").insert({
          mpesa_code: mpesaCode,
          amount: input.amount,
          phone_number: input.phoneNumber,
          transaction_type: "STKPush",
          status: "matched",
          metadata: { ...input, mock: true },
        });

        return {
          success: true,
          mpesaCode,
          message: "Payment successful (Mocked)",
        };
      }

      // Production STK Push logic would go here
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Real M-Pesa integration is pending credentials" });
    }),

  // Get raw mpesa transactions (for admin matching)
  listRaw: authedQuery
    .input(z.object({ status: z.enum(["pending", "matched", "failed"]).optional() }).optional())
    .query(async ({ input }) => {
      let query = supabase.from("mpesa_transactions").select("*").order("created_at", { ascending: false });
      if (input?.status) query = query.eq("status", input.status);

      const rows = unwrapList(await query);
      return rows.map(mapMpesaTransaction);
    }),

  // Auto-match raw transactions to members by phone number
  autoMatch: authedQuery
    .input(z.object({ groupId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const pending = unwrapList(
        await supabase.from("mpesa_transactions").select("*").eq("status", "pending")
      );

      let matchedCount = 0;
      for (const tx of pending) {
        // Try to find a member with this phone number in the group
        const { data: member } = await supabase
          .from("users")
          .select("id")
          .eq("phone", tx.phone_number)
          .single();

        if (member) {
          // Check if they are in this group
          const { data: membership } = await supabase
            .from("group_members")
            .select("*")
            .eq("group_id", input.groupId)
            .eq("user_id", member.id)
            .single();

          if (membership) {
            // Found a match! Create contribution
            await supabase.from("contributions").insert({
              group_id: input.groupId,
              user_id: member.id,
              amount: tx.amount,
              month_year: new Date().toISOString().slice(0, 7),
              payment_method: "mpesa",
              mpesa_code: tx.mpesa_code,
              status: "paid",
              recorded_by: ctx.user.id,
              paid_at: tx.created_at,
            });

            await supabase.from("mpesa_transactions").update({ status: "matched" }).eq("id", tx.id);
            matchedCount++;
          }
        }
      }

      return { matchedCount };
    }),
});

