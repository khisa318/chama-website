import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { unwrap } from "../lib/data";

export const userRouter = createRouter({
  update: authedQuery
    .input(
      z.object({
        fullName: z.string().min(1).max(255).optional(),
        phone: z.string().max(20).optional(),
        avatarUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (input.fullName !== undefined) updates.full_name = input.fullName;
      if (input.phone !== undefined) updates.phone = input.phone;
      if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl;

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Also update Auth metadata if full_name changed
      if (input.fullName) {
        await supabase.auth.updateUser({
          data: { full_name: input.fullName }
        });
      }

      return { success: true };
    }),

  getProfile: authedQuery.query(async ({ ctx }) => {
    const user = unwrap(
      await supabase.from("users").select("*").eq("id", ctx.user.id).maybeSingle(),
      "User not found"
    );
    return user;
  }),
});
