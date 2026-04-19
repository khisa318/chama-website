import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapMessage, unwrap, unwrapList } from "../lib/data";

export const messageRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(
        await supabase.from("messages").select("*").order("created_at", { ascending: false }),
      );

      return rows
        .map(mapMessage)
        .slice(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50));
    }),

  create: authedQuery
    .input(z.object({ content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const row = unwrap(
        await supabase
          .from("messages")
          .insert({
            user_id: ctx.user.id,
            user_name: ctx.user.name,
            user_avatar: ctx.user.avatar,
            content: input.content,
          })
          .select("*")
          .single(),
      ) as Record<string, unknown>;

      return mapMessage(row);
    }),

  like: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const message = unwrap(
        await supabase.from("messages").select("*").eq("id", input.id).single(),
      ) as Record<string, unknown>;
      const { error } = await supabase
        .from("messages")
        .update({ likes: Number(message.likes ?? 0) + 1 })
        .eq("id", input.id);

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
    .mutation(async ({ ctx, input }) => {
      const message = unwrap(
        await supabase.from("messages").select("*").eq("id", input.id).maybeSingle(),
        "Message not found",
      ) as Record<string, unknown>;

      if (message.user_id !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own messages",
        });
      }

      const { error } = await supabase.from("messages").delete().eq("id", input.id);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),
});
