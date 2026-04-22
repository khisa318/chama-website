import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapAuditLog, unwrapList } from "../lib/data";
import { TRPCError } from "@trpc/server";

export const auditRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.string().uuid(),
        actorId: z.string().uuid().optional(),
        action: z.string().optional(),
        targetType: z.string().optional(),
        limit: z.number().int().positive().max(100).default(50),
        offset: z.number().int().nonnegative().default(0),
      }),
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("audit_log")
        .select("*, actor:actor_id(full_name, avatar_url)", { count: "exact" })
        .eq("group_id", input.groupId);

      if (input.actorId) query = query.eq("actor_id", input.actorId);
      if (input.action) query = query.eq("action", input.action);
      if (input.targetType) query = query.eq("target_type", input.targetType);

      const { data, count } = await query
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      return {
        logs: (data || []).map(mapAuditLog),
        total: count || 0,
      };
    }),

  getRecent: authedQuery
    .input(z.object({ groupId: z.string().uuid(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const { data } = await supabase
        .from("audit_log")
        .select("*, actor:actor_id(full_name, avatar_url)")
        .eq("group_id", input.groupId)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      return (data || []).map(mapAuditLog);
    }),

  getRecentForUser: authedQuery
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*, actor:actor_id(full_name, avatar_url), groups!inner(group_members!inner(user_id))")
        .eq("groups.group_members.user_id", ctx.user.id)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return (data || []).map(mapAuditLog);
    }),

  getStats: authedQuery
    .input(z.object({ groupId: z.string().uuid() }))
    .query(async ({ input }) => {
      // Get action counts for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from("audit_log")
        .select("action")
        .eq("group_id", input.groupId)
        .gte("created_at", thirtyDaysAgo.toISOString());

      const counts: Record<string, number> = {};
      data?.forEach((row) => {
        counts[row.action] = (counts[row.action] || 0) + 1;
      });

      return counts;
    }),
});
