import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapNotification, unwrap, unwrapList } from "../lib/data";

export const notificationRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        read: z.boolean().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false });

      if (input?.read !== undefined) query = query.eq("read", input.read);

      const rows = unwrapList(await query);
      return rows.map(mapNotification).slice(0, 50);
    }),

  getById: authedQuery
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const row = unwrap(
        await supabase.from("notifications").select("*").eq("id", input.id).maybeSingle(),
        "Notification not found",
      ) as Record<string, unknown>;
      return mapNotification(row);
    }),

  markRead: authedQuery
    .input(z.object({ id: z.string().uuid() }))
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
    .input(z.object({ id: z.string().uuid() }))
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
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", ctx.user.id)
      .eq("read", false);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return count || 0;
  }),
});

