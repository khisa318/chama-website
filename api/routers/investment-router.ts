import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapInvestment, unwrap, unwrapList } from "../lib/data";

export const investmentRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.string().uuid(),
        type: z.enum(["unit_trust", "shares", "property", "fixed_deposit", "other"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      let query = supabase.from("investments").select("*").eq("group_id", input.groupId).order("purchase_date", { ascending: false });

      if (input.type) query = query.eq("type", input.type);

      const rows = unwrapList(await query);
      return rows.map(mapInvestment);
    }),

  getById: authedQuery
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const row = unwrap(
        await supabase.from("investments").select("*").eq("id", input.id).maybeSingle(),
        "Investment not found",
      ) as Record<string, unknown>;
      return mapInvestment(row);
    }),

  add: authedQuery
    .input(
      z.object({
        groupId: z.string().uuid(),
        name: z.string().min(1).max(255),
        type: z.enum(["unit_trust", "shares", "property", "fixed_deposit", "other"]),
        institution: z.string().optional(),
        amountInvested: z.number().positive(),
        purchaseDate: z.string().optional(),
        notes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const investment = unwrap(
        await supabase
          .from("investments")
          .insert({
            group_id: input.groupId,
            name: input.name,
            type: input.type,
            institution: input.institution ?? null,
            amount_invested: input.amountInvested,
            current_value: input.amountInvested,
            purchase_date: input.purchaseDate ?? new Date().toISOString().slice(0, 10),
            notes: input.notes ?? null,
            created_by: ctx.user.id,
          })
          .select("*")
          .single(),
      ) as Record<string, unknown>;

      await supabase.from("audit_log").insert({
        group_id: input.groupId,
        actor_id: ctx.user.id,
        action: "added_investment",
        target_type: "investment",
        target_id: investment.id as string,
        details: { name: input.name, amount: input.amountInvested },
      });

      return mapInvestment(investment);
    }),

  updateValue: authedQuery
    .input(
      z.object({
        id: z.string().uuid(),
        currentValue: z.number().nonnegative(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const investment = unwrap(
        await supabase
          .from("investments")
          .update({
            current_value: input.currentValue,
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.id)
          .select("*, groups(id)")
          .single(),
      ) as any;

      await supabase.from("audit_log").insert({
        group_id: investment.group_id,
        actor_id: ctx.user.id,
        action: "updated_investment_value",
        target_type: "investment",
        target_id: input.id,
        details: { newValue: input.currentValue },
      });

      return { success: true };
    }),

  getPortfolioStats: authedQuery
    .input(z.object({ groupId: z.string().uuid() }))
    .query(async ({ input }) => {
      const investments = unwrapList(
        await supabase.from("investments").select("*").eq("group_id", input.groupId)
      );

      const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount_invested), 0);
      const totalCurrentValue = investments.reduce((sum, i) => sum + Number(i.current_value), 0);
      const unrealizedGain = totalCurrentValue - totalInvested;
      const returnPercentage = totalInvested > 0 ? (unrealizedGain / totalInvested) * 100 : 0;

      // Mock AI Insight
      const aiInsight = totalInvested > 0 
        ? "Based on your group's savings rate, you could reach KES 500K in 8 months. Consider diversifying into a money market fund."
        : "Start your investment journey by adding your first asset. Diversification is key to long-term growth.";

      return {
        totalInvested,
        totalCurrentValue,
        unrealizedGain,
        returnPercentage,
        aiInsight,
      };
    }),
});
