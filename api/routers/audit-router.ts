import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { unwrapList } from "../lib/data";

export const auditRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        userId: z.number().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().int().positive().max(1000).default(50),
        offset: z.number().int().nonnegative().default(0),
      }),
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("audit_logs")
        .select("*, user:user_id(*)", { count: "exact" })
        .eq("group_id", input.groupId);

      if (input.userId) {
        query = query.eq("user_id", input.userId);
      }

      if (input.action) {
        query = query.eq("action", input.action);
      }

      if (input.entityType) {
        query = query.eq("entity_type", input.entityType);
      }

      if (input.startDate) {
        query = query.gte("created_at", input.startDate.toISOString());
      }

      if (input.endDate) {
        const endOfDay = new Date(input.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      const { data, count } = await query
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      return {
        logs: data || [],
        total: count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  getByEntity: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        entityType: z.string(),
        entityId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const logs = unwrapList(
        await supabase
          .from("audit_logs")
          .select("*, user:user_id(*)")
          .eq("group_id", input.groupId)
          .eq("entity_type", input.entityType)
          .eq("entity_id", input.entityId)
          .order("created_at", { ascending: false }),
      );

      return logs;
    }),

  getActivitySummary: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        days: z.number().int().positive().default(30),
      }),
    )
    .query(async ({ input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const logs = unwrapList(
        await supabase
          .from("audit_logs")
          .select("action, entity_type, count(*)")
          .eq("group_id", input.groupId)
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false }),
      );

      // Group by action and entity type
      const activityMap: Record<string, number> = {};
      logs.forEach((log) => {
        const key = `${log.action}:${log.entity_type}`;
        activityMap[key] = (activityMap[key] || 0) + 1;
      });

      return activityMap;
    }),

  getUserActivity: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        userId: z.number(),
        limit: z.number().int().positive().max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const logs = unwrapList(
        await supabase
          .from("audit_logs")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("user_id", input.userId)
          .order("created_at", { ascending: false })
          .limit(input.limit),
      );

      return logs;
    }),

  getApprovalHistory: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        entityType: z.string(), // 'loan', 'welfare', 'investment'
      }),
    )
    .query(async ({ input }) => {
      const logs = unwrapList(
        await supabase
          .from("audit_logs")
          .select("*, user:user_id(*)")
          .eq("group_id", input.groupId)
          .eq("entity_type", input.entityType)
          .in("action", ["approved", "rejected", "approved_loan", "rejected_loan"])
          .order("created_at", { ascending: false }),
      );

      return logs;
    }),

  exportAuditReport: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("audit_logs")
        .select("*, user:user_id(*)")
        .eq("group_id", input.groupId);

      if (input.startDate) {
        query = query.gte("created_at", input.startDate.toISOString());
      }

      if (input.endDate) {
        const endOfDay = new Date(input.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      const { data } = await query
        .order("created_at", { ascending: false })
        .limit(10000);

      return {
        data: data || [],
        generatedAt: new Date().toISOString(),
      };
    }),
});
