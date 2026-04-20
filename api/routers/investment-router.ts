import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { unwrap, unwrapList } from "../lib/data";

export const investmentRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        status: z.enum(["active", "matured", "liquidated"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(
        await supabase
          .from("investments")
          .select("*")
          .eq("group_id", input.groupId)
          .order("purchase_date", { ascending: false }),
      );

      return rows.map((row) => ({
        ...row,
        performance: row.actual_return ? ((row.actual_return / row.purchase_amount) * 100).toFixed(2) : null,
      })).filter((row) => {
        if (input.status && row.status !== input.status) return false;
        return true;
      });
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const investment = unwrap(
        await supabase.from("investments").select("*").eq("id", input.id).maybeSingle(),
        "Investment not found",
      );

      return {
        ...investment,
        performance: investment.actual_return
          ? ((investment.actual_return / investment.purchase_amount) * 100).toFixed(2)
          : null,
      };
    }),

  create: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        name: z.string().max(255),
        description: z.string().max(2000).optional(),
        investmentType: z.enum(["property", "bonds", "stocks", "business", "other"]),
        purchaseAmount: z.number().positive(),
        purchaseDate: z.date(),
        maturityDate: z.date().optional(),
        expectedReturn: z.number().nonnegative().optional(),
        notes: z.string().max(1000).optional(),
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

      const investment = unwrap(
        await supabase
          .from("investments")
          .insert({
            group_id: input.groupId,
            name: input.name,
            description: input.description ?? null,
            investment_type: input.investmentType,
            purchase_amount: input.purchaseAmount,
            current_value: input.purchaseAmount,
            purchase_date: input.purchaseDate.toISOString(),
            maturity_date: input.maturityDate?.toISOString() ?? null,
            expected_return: input.expectedReturn ?? null,
            notes: input.notes ?? null,
            created_by: ctx.user.id,
            status: "active",
          })
          .select("*")
          .single(),
      );

      // Create transaction record
      await supabase.from("transactions").insert({
        group_id: input.groupId,
        type: "investment",
        amount: input.purchaseAmount,
        description: `Investment: ${input.name}`,
        category: "investment",
        date: input.purchaseDate.toISOString(),
        status: "completed",
        created_by: ctx.user.id,
      });

      // Create audit log
      await supabase.from("audit_logs").insert({
        group_id: input.groupId,
        user_id: ctx.user.id,
        action: "created_investment",
        entity_type: "investment",
        entity_id: investment.id,
        details: `Created investment: ${input.name} for KES ${input.purchaseAmount}`,
      });

      return investment;
    }),

  updateValue: authedQuery
    .input(
      z.object({
        id: z.number(),
        groupId: z.number(),
        currentValue: z.number().nonnegative(),
        actualReturn: z.number().optional(),
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

      const investment = unwrap(
        await supabase
          .from("investments")
          .update({
            current_value: input.currentValue,
            actual_return: input.actualReturn ?? null,
          })
          .eq("id", input.id)
          .select("*")
          .single(),
      );

      // Create audit log
      await supabase.from("audit_logs").insert({
        group_id: input.groupId,
        user_id: ctx.user.id,
        action: "updated_investment",
        entity_type: "investment",
        entity_id: input.id,
        details: `Updated investment value to KES ${input.currentValue}`,
      });

      return investment;
    }),

  markMatured: authedQuery
    .input(
      z.object({
        id: z.number(),
        groupId: z.number(),
        finalValue: z.number().nonnegative(),
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

      const investment = unwrap(
        await supabase
          .from("investments")
          .update({
            status: "matured",
            current_value: input.finalValue,
            actual_return: input.finalValue,
          })
          .eq("id", input.id)
          .select("*")
          .single(),
      );

      // Create audit log
      await supabase.from("audit_logs").insert({
        group_id: input.groupId,
        user_id: ctx.user.id,
        action: "matured_investment",
        entity_type: "investment",
        entity_id: input.id,
        details: `Investment matured with final value KES ${input.finalValue}`,
      });

      return investment;
    }),

  getPortfolioSummary: authedQuery
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const investments = unwrapList(
        await supabase
          .from("investments")
          .select("*")
          .eq("group_id", input.groupId),
      );

      const totalInvested = investments
        .filter((i) => i.status !== "liquidated")
        .reduce((sum, i) => sum + parseFloat(i.purchase_amount), 0);

      const totalCurrentValue = investments
        .filter((i) => i.status !== "liquidated")
        .reduce((sum, i) => sum + parseFloat(i.current_value || i.purchase_amount), 0);

      const totalReturn = totalCurrentValue - totalInvested;
      const returnPercentage = ((totalReturn / totalInvested) * 100).toFixed(2);

      return {
        totalInvested,
        totalCurrentValue,
        totalReturn,
        returnPercentage,
        activeInvestments: investments.filter((i) => i.status === "active").length,
        maturedInvestments: investments.filter((i) => i.status === "matured").length,
      };
    }),
});
