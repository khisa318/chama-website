import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapGroup, mapGroupMember, unwrap, unwrapList } from "../lib/data";

export const groupRouter = createRouter({
  list: authedQuery.query(async () => {
    const groups = unwrapList(
      await supabase.from("groups").select("*").order("created_at", { ascending: false }),
    );
    const members = unwrapList(
      await supabase.from("group_members").select("group_id"),
    );

    const counts = new Map<string, number>();
    for (const member of members) {
      const groupId = member.group_id as string;
      counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
    }

    return groups.map((row) => ({
      ...mapGroup(row),
      memberCount: counts.get(row.id as string) ?? 0,
    }));
  }),

  listMyGroups: authedQuery.query(async ({ ctx }) => {
    const { data, error } = await supabase
      .from("groups")
      .select("*, group_members!inner(user_id)")
      .eq("group_members.user_id", ctx.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return (data || []).map(mapGroup);
  }),

  listPublic: authedQuery.query(async () => {
    const groups = unwrapList(
      await supabase.from("groups").select("*").order("created_at", { ascending: false }).limit(20)
    );
    return groups.map(mapGroup);
  }),

  getById: authedQuery
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const group = unwrap(
        await supabase.from("groups").select("*").eq("id", input.id).maybeSingle(),
        "Group not found",
      ) as Record<string, unknown>;

      return mapGroup(group);
    }),

  getMembers: authedQuery
    .input(z.object({ groupId: z.string().uuid() }))
    .query(async ({ input }) => {
      const members = unwrapList(
        await supabase
          .from("group_members")
          .select("*, users(*)")
          .eq("group_id", input.groupId)
          .order("joined_at", { ascending: true }),
      );

      return members.map((member) => {
        const user = member.users as Record<string, unknown>;
        return {
          ...mapGroupMember(member),
          userName: (user?.full_name as string) ?? "Unknown",
          userAvatar: (user?.avatar_url as string) ?? null,
        };
      });
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(500).optional(),
        type: z.enum(["savings", "table_banking", "investment", "welfare", "sacco"]),
        contributionAmount: z.number().min(0),
        contributionFrequency: z.enum(["weekly", "monthly", "custom"]),
        contributionDay: z.number().min(1).max(31).optional(),
        loanInterestRate: z.number().min(0).optional(),
        maxLoanMultiplier: z.number().min(1).optional(),
        loanRepaymentMonths: z.number().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const group = unwrap(
        await supabase
          .from("groups")
          .insert({
            name: input.name,
            description: input.description ?? null,
            type: input.type,
            invite_code: inviteCode,
            contribution_amount: input.contributionAmount,
            contribution_frequency: input.contributionFrequency,
            contribution_day: input.contributionDay ?? 1,
            loan_interest_rate: input.loanInterestRate ?? 0,
            max_loan_multiplier: input.maxLoanMultiplier ?? 3,
            loan_repayment_months: input.loanRepaymentMonths ?? 12,
            created_by: ctx.user.id,
          })
          .select("*")
          .single(),
      ) as Record<string, unknown>;

      await supabase.from("group_members").insert({
        group_id: group.id as string,
        user_id: ctx.user.id,
        role: "admin",
        status: "active",
      });

      return mapGroup(group);
    }),

  joinByInvite: authedQuery
    .input(z.object({ inviteCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = unwrap(
        await supabase.from("groups").select("*").eq("invite_code", input.inviteCode).maybeSingle(),
        "Invalid invite code",
      ) as Record<string, unknown>;

      const { error } = await supabase.from("group_members").insert({
        group_id: group.id as string,
        user_id: ctx.user.id,
        role: "member",
        status: "active",
      });

      if (error && error.code !== '23505') { // Ignore if already a member
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return mapGroup(group);
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(500).optional(),
        contributionAmount: z.number().min(0).optional(),
        contributionFrequency: z.enum(["weekly", "monthly", "custom"]).optional(),
        contributionDay: z.number().min(1).max(31).optional(),
        loanInterestRate: z.number().min(0).optional(),
        maxLoanMultiplier: z.number().min(1).optional(),
        loanRepaymentMonths: z.number().min(1).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.contributionAmount !== undefined) updates.contribution_amount = input.contributionAmount;
      if (input.contributionFrequency !== undefined) updates.contribution_frequency = input.contributionFrequency;
      if (input.contributionDay !== undefined) updates.contribution_day = input.contributionDay;
      if (input.loanInterestRate !== undefined) updates.loan_interest_rate = input.loanInterestRate;
      if (input.maxLoanMultiplier !== undefined) updates.max_loan_multiplier = input.maxLoanMultiplier;
      if (input.loanRepaymentMonths !== undefined) updates.loan_repayment_months = input.loanRepaymentMonths;

      const { error } = await supabase.from("groups").update(updates).eq("id", input.id);
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
      const { error } = await supabase.from("groups").delete().eq("id", input.id);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
      return { success: true };
    }),

  getDashboardStats: authedQuery.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const [membershipsResult, contributionsResult, loansResult] = await Promise.all([
      supabase.from("group_members").select("group_id").eq("user_id", userId),
      supabase.from("contributions").select("amount").eq("user_id", userId).eq("status", "paid"),
      supabase.from("loans").select("*", { count: "exact", head: true }).eq("borrower_id", userId).eq("status", "active"),
    ]);

    const memberships = unwrapList(membershipsResult);
    const contributions = contributionsResult.data || [];
    const activeLoansCount = loansResult.count || 0;

    const totalContributed = contributions.reduce((sum, c) => sum + Number(c.amount), 0);

    return {
      totalContributed,
      activeLoans: activeLoansCount,
      groupCount: memberships.length,
      availableBalance: totalContributed * 0.8,
    };
  }),
});

