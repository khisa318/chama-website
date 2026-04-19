import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapNotification, unwrap, unwrapList } from "../lib/data";

export const notificationRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        type: z.enum([
          "payment_reminder",
          "contribution_received",
          "loan_approved",
          "loan_declined",
          "group_announcement",
          "member_joined",
          "expense_recorded",
        ]).optional(),
        read: z.boolean().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const rows = unwrapList(
        await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", ctx.user.id)
          .order("created_at", { ascending: false }),
      );

      return rows
        .map(mapNotification)
        .filter((row) => {
          if (input?.type && row.type !== input.type) return false;
          if (input?.read !== undefined && row.read !== input.read) return false;
          return true;
        })
        .slice(0, 50);
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const row = unwrap(
        await supabase.from("notifications").select("*").eq("id", input.id).maybeSingle(),
        "Notification not found",
      ) as Record<string, unknown>;
      return mapNotification(row);
    }),

  markRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  markAllRead: authedQuery.mutation(async ({ ctx }) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", ctx.user.id);

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
      const { error } = await supabase.from("notifications").delete().eq("id", input.id);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  unreadCount: authedQuery.query(async ({ ctx }) => {
    const rows = unwrapList(
      await supabase.from("notifications").select("id").eq("user_id", ctx.user.id).eq("read", false),
    );
    return rows.length;
  }),
});
