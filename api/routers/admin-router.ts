import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, adminQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import {
  mapGroup,
  mapLoan,
  unwrapList,
} from "../lib/data";

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
      let query = supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (input?.role) query = query.eq("role", input.role);

      const rows = unwrapList(await query);

      const search = input?.search?.toLowerCase() ?? "";
      const filtered = rows.filter((row) => {
        if (!search) return true;
        return (
          (row.full_name as string ?? "").toLowerCase().includes(search) ||
          (row.email as string ?? "").toLowerCase().includes(search)
        );
      });

      return filtered
        .slice(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50))
        .map((row) => ({
          id: row.id,
          name: row.full_name || row.email || "User",
          email: row.email || "",
          role: row.role,
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
        .from("users")
        .update({ role: input.role })
        .eq("id", input.id);

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
    const users = unwrapList(await supabase.from("users").select("id"));
    const groups = unwrapList(await supabase.from("groups").select("*")).map(mapGroup);
    const loans = unwrapList(await supabase.from("loans").select("*")).map(mapLoan);

    return {
      totalUsers: users.length,
      totalGroups: groups.length,
      activeLoans: loans.filter((loan) => loan.status === "active").length,
      pendingLoans: loans.filter((loan) => loan.status === "pending").length,
    };
  }),

  recentActivity: adminQuery.query(async () => {
    const logs = unwrapList(
      await supabase.from("audit_log").select("*, actor:actor_id(full_name)").order("created_at", { ascending: false }).limit(20)
    );
    
    return logs.map(log => ({
      id: log.id,
      action: log.action,
      actorName: log.actor?.full_name || "System",
      createdAt: log.created_at,
    }));
  }),
});
