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

    const counts = new Map<number, number>();
    for (const member of members) {
      const groupId = member.group_id as number;
      counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
    }

    return groups.map((row) => ({
      ...mapGroup(row),
      memberCount: counts.get(row.id as number) ?? 0,
    }));
  }),

  dashboardGroups: authedQuery.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get user's group memberships
    const memberships = unwrapList(
      await supabase.from("group_members").select("*").eq("user_id", userId)
    );

    if (memberships.length === 0) return { userGroups: [], managedGroups: [] };

    const groupIds = memberships.map(m => m.group_id);

    // Get groups
    const groups = unwrapList(
      await supabase.from("groups").select("*").in("id", groupIds)
    );

    // For each membership, calculate contributed since join
    const userGroups = await Promise.all(memberships.map(async (mem) => {
      const group = groups.find(g => g.id === mem.group_id);
      if (!group) return null;

      // Sum contributions since joined
      const contributions = unwrapList(
        await supabase.from("contributions").select("amount").eq("member_id", mem.id).gte("date", mem.joined_at)
      );
      const totalContributed = contributions.reduce((sum, c) => sum + Number(c.amount), 0);

      // Loans available - for simplicity, let's say 2x contributed
      const loansAvailable = totalContributed * 2;

      return {
        ...mapGroup(group),
        role: mem.role,
        totalContributed,
        loansAvailable,
        joinedAt: mem.joined_at,
      };
    }));

    const managedGroups = await Promise.all(userGroups.filter(g => g && g.role === 'admin').map(async (group) => {
      if (!group) return null;

      // Count members
      const { count: memberCount } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id);

      return {
        ...group,
        memberCount: memberCount || 0,
      };
    }));

    return { userGroups: userGroups.filter(Boolean), managedGroups: managedGroups.filter(Boolean) };
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const group = unwrap(
        await supabase.from("groups").select("*").eq("id", input.id).maybeSingle(),
        "Group not found",
      ) as Record<string, unknown>;

      const members = unwrapList(
        await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", input.id)
          .order("joined_at", { ascending: true }),
      );

      const userIds = members
        .map((member) => member.user_id as string | null)
        .filter((value): value is string => Boolean(value));

      const profiles =
        userIds.length === 0
          ? []
          : unwrapList(
              await supabase
                .from("profiles")
                .select("user_id, email, full_name, avatar_url")
                .in("user_id", userIds),
            );

      const profileMap = new Map(
        profiles.map((profile) => [profile.user_id as string, profile]),
      );

      return {
        ...mapGroup(group),
        members: members.map((member) => {
          const profile = member.user_id
            ? profileMap.get(member.user_id as string)
            : null;

          return mapGroupMember({
            ...member,
            email: profile?.email ?? null,
            full_name: profile?.full_name ?? null,
            avatar_url: profile?.avatar_url ?? null,
          });
        }),
      };
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(500).optional(),
        monthlyContribution: z.number().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = unwrap(
        await supabase
          .from("groups")
          .insert({
            name: input.name,
            description: input.description ?? null,
            monthly_contribution: input.monthlyContribution,
            created_by: ctx.user.id,
          })
          .select("*")
          .single(),
      ) as Record<string, unknown>;

      const memberResult = await supabase.from("group_members").insert({
        group_id: group.id as number,
        user_id: ctx.user.id,
        role: "admin",
        contribution_status: "paid",
      });

      if (memberResult.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: memberResult.error.message,
        });
      }

      return {
        ...mapGroup(group),
        memberCount: 1,
      };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(500).optional(),
        monthlyContribution: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.monthlyContribution !== undefined) {
        updates.monthly_contribution = input.monthlyContribution;
      }

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
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await supabase.from("group_members").delete().eq("group_id", input.id);
      await supabase.from("contributions").delete().eq("group_id", input.id);
      await supabase.from("transactions").delete().eq("group_id", input.id);
      await supabase.from("loans").delete().eq("group_id", input.id);
      await supabase.from("expenses").delete().eq("group_id", input.id);

      const { error } = await supabase.from("groups").delete().eq("id", input.id);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  addMember: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        userId: z.string().uuid(),
        role: z.enum(["admin", "treasurer", "member"]).default("member"),
      }),
    )
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("group_members").insert({
        group_id: input.groupId,
        user_id: input.userId,
        role: input.role,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  removeMember: authedQuery
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("group_members").delete().eq("id", input.memberId);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  updateMemberRole: authedQuery
    .input(
      z.object({
        memberId: z.number(),
        role: z.enum(["admin", "treasurer", "member"]),
      }),
    )
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("group_members")
        .update({ role: input.role })
        .eq("id", input.memberId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  getMessages: authedQuery
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("group_messages")
        .select(`
          *,
          profiles!inner(user_id, full_name)
        `)
        .eq("group_id", input.groupId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return (data || []).map(msg => ({
        ...msg,
        user: {
          name: msg.profiles?.full_name || 'Unknown',
        },
      }));
    }),

  sendMessage: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from("group_messages")
        .insert({
          group_id: input.groupId,
          user_id: ctx.user.id,
          user_name: ctx.user.name,
          user_avatar: ctx.user.avatar,
          content: input.content,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data;
    }),

  getAnalytics: authedQuery
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      // Monthly contributions
      const { data: contributions, error: contribError } = await supabase
        .from("contributions")
        .select("amount, date")
        .eq("group_id", input.groupId)
        .eq("status", "completed");

      if (contribError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: contribError.message });

      const monthlyContributions = contributions?.reduce((acc, c) => {
        const month = new Date(c.date).toISOString().slice(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + Number(c.amount);
        return acc;
      }, {} as Record<string, number>) || {};

      // Loans lent
      const { data: loans, error: loansError } = await supabase
        .from("loans")
        .select("amount")
        .eq("group_id", input.groupId)
        .in("status", ["approved", "active", "repaid"]);

      if (loansError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: loansError.message });

      const totalLoansLent = loans?.reduce((sum, l) => sum + Number(l.amount), 0) || 0;

      // Member growth
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("joined_at")
        .eq("group_id", input.groupId)
        .order("joined_at");

      if (membersError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: membersError.message });

      const memberGrowth = members?.reduce((acc, m) => {
        const month = new Date(m.joined_at).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Performance: total balance and contribution rate
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("balance, monthly_contribution")
        .eq("id", input.groupId)
        .single();

      if (groupError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: groupError.message });

      const totalBalance = Number(group.balance);
      const monthlyContribution = Number(group.monthly_contribution);

      // Active members: members with contributions in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activeMembers, error: activeError } = await supabase
        .from("contributions")
        .select("member_id")
        .eq("group_id", input.groupId)
        .gte("date", thirtyDaysAgo.toISOString())
        .eq("status", "completed");

      if (activeError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: activeError.message });

      const activeMemberIds = new Set(activeMembers?.map(c => c.member_id) || []);
      const activeMembersCount = activeMemberIds.size;

      return {
        monthlyContributions,
        totalLoansLent,
        memberGrowth,
        totalBalance,
        monthlyContribution,
        activeMembersCount,
      };
    }),

  dashboardAnalytics: authedQuery.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get user's group memberships
    const memberships = unwrapList(
      await supabase.from("group_members").select("group_id").eq("user_id", userId)
    );

    if (memberships.length === 0) {
      return {
        totalContributed: 0,
        totalLoansAvailable: 0,
        totalGroups: 0,
        monthlyContributions: {},
        memberGrowth: {},
      };
    }

    const groupIds = memberships.map(m => m.group_id);

    // Aggregate contributions
    const contributions = unwrapList(
      await supabase.from("contributions").select("amount, date").in("group_id", groupIds).eq("status", "completed")
    );

    const totalContributed = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const monthlyContributions = contributions.reduce((acc, c) => {
      const month = new Date(c.date).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + Number(c.amount);
      return acc;
    }, {} as Record<string, number>);

    // Member growth across all groups
    const members = unwrapList(
      await supabase.from("group_members").select("joined_at").in("group_id", groupIds)
    );

    const memberGrowth = members.reduce((acc, m) => {
      const month = new Date(m.joined_at).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Loans available (simplified as 2x contributed)
    const totalLoansAvailable = totalContributed * 2;

    return {
      totalContributed,
      totalLoansAvailable,
      totalGroups: groupIds.length,
      monthlyContributions,
      memberGrowth,
    };
  }),
});
