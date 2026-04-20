import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { unwrap } from "../lib/data";

export const preferenceRouter = createRouter({
  getPreferences: authedQuery.query(async ({ ctx }) => {
    const prefs = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", ctx.user.id)
      .maybeSingle();

    if (prefs.data) {
      return prefs.data;
    }

    // Create default preferences
    const defaults = {
      user_id: ctx.user.id,
      dark_mode: false,
      email_notifications: true,
      sms_notifications: true,
      language: "en",
      theme: "light",
    };

    const created = unwrap(
      await supabase.from("user_preferences").insert(defaults).select("*").single(),
    );

    return created;
  }),

  updatePreferences: authedQuery
    .input(
      z.object({
        darkMode: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        language: z.string().max(10).optional(),
        theme: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, any> = {};

      if (input.darkMode !== undefined) updates.dark_mode = input.darkMode;
      if (input.emailNotifications !== undefined) updates.email_notifications = input.emailNotifications;
      if (input.smsNotifications !== undefined) updates.sms_notifications = input.smsNotifications;
      if (input.language !== undefined) updates.language = input.language;
      if (input.theme !== undefined) updates.theme = input.theme;

      // Check if preferences exist
      const existing = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", ctx.user.id)
        .maybeSingle();

      if (existing.data) {
        return unwrap(
          await supabase
            .from("user_preferences")
            .update(updates)
            .eq("user_id", ctx.user.id)
            .select("*")
            .single(),
        );
      }

      // Create if doesn't exist
      return unwrap(
        await supabase
          .from("user_preferences")
          .insert({ user_id: ctx.user.id, ...updates })
          .select("*")
          .single(),
      );
    }),

  toggleDarkMode: authedQuery
    .input(z.object({ darkMode: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const prefs = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", ctx.user.id)
        .maybeSingle();

      if (prefs.data) {
        return await supabase
          .from("user_preferences")
          .update({ dark_mode: input.darkMode })
          .eq("user_id", ctx.user.id)
          .select("*")
          .single();
      }

      return await supabase
        .from("user_preferences")
        .insert({
          user_id: ctx.user.id,
          dark_mode: input.darkMode,
        })
        .select("*")
        .single();
    }),

  setLanguage: authedQuery
    .input(z.object({ language: z.string().max(10) }))
    .mutation(async ({ ctx, input }) => {
      const prefs = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", ctx.user.id)
        .maybeSingle();

      if (prefs.data) {
        return await supabase
          .from("user_preferences")
          .update({ language: input.language })
          .eq("user_id", ctx.user.id)
          .select("*")
          .single();
      }

      return await supabase
        .from("user_preferences")
        .insert({
          user_id: ctx.user.id,
          language: input.language,
        })
        .select("*")
        .single();
    }),

  setNotificationPreferences: authedQuery
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, any> = {};

      if (input.emailNotifications !== undefined) updates.email_notifications = input.emailNotifications;
      if (input.smsNotifications !== undefined) updates.sms_notifications = input.smsNotifications;

      const prefs = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", ctx.user.id)
        .maybeSingle();

      if (prefs.data) {
        return await supabase
          .from("user_preferences")
          .update(updates)
          .eq("user_id", ctx.user.id)
          .select("*")
          .single();
      }

      return await supabase
        .from("user_preferences")
        .insert({ user_id: ctx.user.id, ...updates })
        .select("*")
        .single();
    }),
});
