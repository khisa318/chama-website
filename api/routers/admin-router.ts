import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, adminQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import {
  mapContact,
  mapGroup,
  mapLoan,
  mapMessage,
  mapTransaction,
  unwrapList,
} from "../lib/data";

type ProfileRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: "user" | "admin";
  created_at: string;
};

export const adminRouter = createRouter({
  userList: adminQuery
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(["user", "admin"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(
        await supabase
          .from("profiles")
          .select("user_id, email, full_name, role, created_at")
          .order("created_at", { ascending: false }),
      ) as ProfileRow[];

      const search = input?.search?.toLowerCase() ?? "";
      const filtered = rows.filter((row) => {
        if (input?.role && row.role !== input.role) return false;
        if (!search) return true;
        return (
          (row.full_name ?? "").toLowerCase().includes(search) ||
          (row.email ?? "").toLowerCase().includes(search)
        );
      });

      return filtered
        .slice(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50))
        .map((row) => ({
          id: row.user_id,
          name: row.full_name || row.email || "User",
          email: row.email || "",
          role: row.role,
          authType: "supabase" as const,
          createdAt: row.created_at,
        }));
    }),

  userUpdate: adminQuery
    .input(
      z.object({
        id: z.string().uuid(),
        role: z.enum(["user", "admin"]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role: input.role })
        .eq("user_id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  userDelete: adminQuery
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.auth.admin.deleteUser(input.id);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  stats: adminQuery.query(async () => {
    const profiles = unwrapList(await supabase.from("profiles").select("user_id"));
    const groups = unwrapList(await supabase.from("groups").select("*")).map(mapGroup);
    const loans = unwrapList(await supabase.from("loans").select("*")).map(mapLoan);
    const contacts = unwrapList(await supabase.from("contacts").select("*")).map(mapContact);
    const messages = unwrapList(await supabase.from("messages").select("*")).map(mapMessage);

    return {
      totalUsers: profiles.length,
      totalGroups: groups.length,
      totalSavings: groups.reduce((sum, group) => sum + group.balance, 0),
      activeLoans: loans.filter((loan) => loan.status === "active").length,
      pendingLoans: loans.filter((loan) => loan.status === "pending").length,
      pendingContacts: contacts.filter((contact) => contact.status === "new").length,
      totalMessages: messages.length,
    };
  }),

  recentActivity: adminQuery.query(async () => {
    return unwrapList(
      await supabase.from("transactions").select("*").order("created_at", { ascending: false }),
    )
      .map(mapTransaction)
      .slice(0, 20);
  }),
});
