import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { unwrap, unwrapList } from "../lib/data";

const DEFAULT_PERMISSIONS = {
  member: ["view_dashboard", "view_transactions", "submit_welfare_claim", "rsvp_events", "view_reports"],
  treasurer: [
    "view_dashboard",
    "manage_transactions",
    "approve_loans",
    "approve_welfare_claims",
    "create_bills",
    "manage_members",
    "create_investments",
    "view_audit_logs",
  ],
  secretary: [
    "view_dashboard",
    "view_transactions",
    "create_events",
    "manage_announcements",
    "send_messages",
    "create_reports",
  ],
  chairperson: [
    "view_dashboard",
    "manage_transactions",
    "approve_loans",
    "approve_welfare_claims",
    "manage_members",
    "manage_group",
    "create_investments",
    "view_audit_logs",
    "delete_events",
  ],
  admin: ["*"], // All permissions
};

export const permissionRouter = createRouter({
  getGroupRoles: authedQuery
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const roles = unwrapList(
        await supabase
          .from("role_permissions")
          .select("*")
          .eq("group_id", input.groupId),
      );

      return roles.map((role) => ({
        ...role,
        permissions: JSON.parse(role.permissions),
      }));
    }),

  getGroupPermissions: authedQuery
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const roles = unwrapList(
        await supabase
          .from("role_permissions")
          .select("*")
          .eq("group_id", input.groupId),
      );

      const permissionsMap: Record<string, string[]> = {};
      roles.forEach((role) => {
        permissionsMap[role.role_name] = JSON.parse(role.permissions);
      });

      return permissionsMap;
    }),

  getUserPermissions: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        userId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;

      const member = unwrap(
        await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("user_id", userId)
          .maybeSingle(),
        "Member not found",
      );

      const rolePerms = await supabase
        .from("role_permissions")
        .select("permissions")
        .eq("group_id", input.groupId)
        .eq("role_name", member.role)
        .maybeSingle();

      const permissions = rolePerms.data ? JSON.parse(rolePerms.data.permissions) : [];

      return {
        role: member.role,
        permissions,
        hasPermission: (perm: string) => permissions.includes("*") || permissions.includes(perm),
      };
    }),

  canPerformAction: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        action: z.string(),
        userId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;

      const member = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", input.groupId)
        .eq("user_id", userId)
        .maybeSingle();

      if (!member.data) return false;

      const rolePerms = await supabase
        .from("role_permissions")
        .select("permissions")
        .eq("group_id", input.groupId)
        .eq("role_name", member.data.role)
        .maybeSingle();

      const permissions = rolePerms.data ? JSON.parse(rolePerms.data.permissions) : [];

      return permissions.includes("*") || permissions.includes(input.action);
    }),

  createCustomRole: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        roleName: z.string().max(50),
        description: z.string().max(500).optional(),
        permissions: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is admin/chairperson
      const member = unwrap(
        await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("user_id", ctx.user.id)
          .maybeSingle(),
      );

      if (!["chairperson", "admin"].includes(member.role)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const role = unwrap(
        await supabase
          .from("role_permissions")
          .insert({
            group_id: input.groupId,
            role_name: input.roleName,
            permissions: JSON.stringify(input.permissions),
            description: input.description ?? null,
          })
          .select("*")
          .single(),
      );

      return {
        ...role,
        permissions: JSON.parse(role.permissions),
      };
    }),

  updateRole: authedQuery
    .input(
      z.object({
        id: z.number(),
        groupId: z.number(),
        permissions: z.array(z.string()),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = unwrap(
        await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("user_id", ctx.user.id)
          .maybeSingle(),
      );

      if (!["chairperson", "admin"].includes(member.role)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const role = unwrap(
        await supabase
          .from("role_permissions")
          .update({
            permissions: JSON.stringify(input.permissions),
            description: input.description ?? null,
          })
          .eq("id", input.id)
          .select("*")
          .single(),
      );

      // Create audit log
      await supabase.from("audit_logs").insert({
        group_id: input.groupId,
        user_id: ctx.user.id,
        action: "updated_role_permissions",
        entity_type: "role",
        entity_id: input.id,
        details: `Updated permissions for role`,
      });

      return {
        ...role,
        permissions: JSON.parse(role.permissions),
      };
    }),

  getDefaultPermissions: authedQuery
    .input(z.object({ role: z.string() }))
    .query(async ({ input }) => {
      return (DEFAULT_PERMISSIONS as any)[input.role] || [];
    }),

  getAllPermissions: authedQuery.query(() => {
    return [
      "view_dashboard",
      "manage_transactions",
      "view_transactions",
      "approve_loans",
      "request_loans",
      "approve_welfare_claims",
      "submit_welfare_claim",
      "create_bills",
      "manage_members",
      "manage_group",
      "create_investments",
      "manage_investments",
      "view_audit_logs",
      "create_events",
      "manage_announcements",
      "delete_events",
      "send_messages",
      "create_reports",
      "rsvp_events",
      "manage_rotations",
    ];
  }),
});
