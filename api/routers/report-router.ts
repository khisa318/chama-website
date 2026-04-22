import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import {
  unwrapList,
} from "../lib/data";

export const reportRouter = createRouter({
  groupSummary: authedQuery
    .input(z.object({ groupId: z.string().uuid() }))
    .query(async ({ input }) => {
      const contributions = unwrapList(await supabase.from("contributions").select("amount, status").eq("group_id", input.groupId));
      const loans = unwrapList(await supabase.from("loans").select("amount, status").eq("group_id", input.groupId));
      const investments = unwrapList(await supabase.from("investments").select("amount_invested, current_value").eq("group_id", input.groupId));
      const welfare = unwrapList(await supabase.from("welfare_claims").select("amount_approved").eq("group_id", input.groupId).eq("status", "paid"));

      const totalContributions = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
      const activeLoanBalance = loans.filter(l => l.status === "active").reduce((sum, l) => sum + Number(l.amount), 0);
      const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount_invested), 0);
      const currentInvestmentValue = investments.reduce((sum, i) => sum + Number(i.current_value), 0);
      const totalWelfarePaid = welfare.reduce((sum, w) => sum + Number(w.amount_approved), 0);

      return {
        totalContributions,
        activeLoanBalance,
        totalInvested,
        currentInvestmentValue,
        totalWelfarePaid,
        netBalance: totalContributions - activeLoanBalance - totalInvested - totalWelfarePaid,
      };
    }),

  savingsTrend: authedQuery
    .input(z.object({ groupId: z.string().uuid(), months: z.number().default(6) }))
    .query(async ({ input }) => {
      // Get contributions grouped by month
      const { data } = await supabase
        .from("contributions")
        .select("amount, month_year")
        .eq("group_id", input.groupId)
        .eq("status", "paid")
        .order("month_year", { ascending: true });

      const trendMap: Record<string, number> = {};
      data?.forEach(row => {
        trendMap[row.month_year] = (trendMap[row.month_year] || 0) + Number(row.amount);
      });

      return Object.entries(trendMap).map(([month, total]) => ({ month, total }));
    }),

  generatePDF: authedQuery
    .input(z.object({ groupId: z.string().uuid(), reportType: z.enum(["financial", "audit", "member_statement"]) }))
    .mutation(async ({ input }) => {
      // Mock PDF generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        downloadUrl: `https://example.com/reports/${input.groupId}_${input.reportType}.pdf`,
        message: "Report generated successfully",
      };
    }),
});
