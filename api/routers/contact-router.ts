import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapContact, unwrapList } from "../lib/data";

export const contactRouter = createRouter({
  submit: publicQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email(),
        subject: z.string().min(1).max(255),
        message: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
        })
        .select("*")
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message || "Failed to submit contact form",
        });
      }

      return mapContact(data);
    }),

  list: adminQuery
    .input(
      z.object({
        status: z.enum(["new", "read", "replied"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(
        await supabase.from("contacts").select("*").order("created_at", { ascending: false }),
      ).map(mapContact);

      const filtered = input?.status
        ? rows.filter((row) => row.status === input.status)
        : rows;

      return {
        rows: filtered.slice(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50)),
        total: filtered.length,
      };
    }),

  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "read", "replied"]),
      }),
    )
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("contacts")
        .update({ status: input.status })
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("contacts").delete().eq("id", input.id);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),
});
