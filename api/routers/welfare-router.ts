import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapWelfareClaim, unwrap, unwrapList } from "../lib/data";

export const welfareRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.number().optional(),
        status: z.enum(["pending", "approved", "rejected", "paid"]).optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(
        await supabase.from("welfare_claims").select("*").order("created_at", { ascending: false }),
      );

      return rows
        .filter((row) => {
          if (input?.groupId && row.group_id !== input.groupId) return false;
          if (input?.status && row.status !== input.status) return false;
          return true;
        });
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const row = unwrap(
        await supabase.from("welfare_claims").select("*").eq("id", input.id).maybeSingle(),
        "Welfare claim not found",
      );
      return row;
    }),

  submit: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        claimType: z.enum(["medical", "burial", "graduation", "emergency", "other"]),
        description: z.string().max(1000),
        amount: z.number().positive(),
        documentUrl: z.string().url().optional(),
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
        "You are not a member of this group",
      );

      const claim = unwrap(
        await supabase
          .from("welfare_claims")
          .insert({
            group_id: input.groupId,
            member_id: member.id,
            claim_type: input.claimType,
            description: input.description,
            amount: input.amount,
            document_url: input.documentUrl ?? null,
            status: "pending",
          })
          .select("*")
          .single(),
      );

      // Create audit log
      await supabase.from("audit_logs").insert({
        group_id: input.groupId,
        user_id: ctx.user.id,
        action: "submitted_welfare_claim",
        entity_type: "welfare",
        entity_id: claim.id,
        details: `Submitted ${input.claimType} welfare claim for KES ${input.amount}`,
      });

      return claim;
    }),

  approve: authedQuery
    .input(
      z.object({
        id: z.number(),
        groupId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is treasurer or chairperson
      const member = unwrap(
        await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("user_id", ctx.user.id)
          .maybeSingle(),
        "Not authorized",
      );

      if (!["treasurer", "chairperson", "admin"].includes(member.role)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const claim = unwrap(
        await supabase
          .from("welfare_claims")
          .update({
            status: "approved",
            approved_by: ctx.user.id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", input.id)
          .select("*")
          .single(),
      );

      // Create audit log
      await supabase.from("audit_logs").insert({
        group_id: input.groupId,
        user_id: ctx.user.id,
        action: "approved_welfare_claim",
        entity_type: "welfare",
        entity_id: input.id,
        details: `Approved welfare claim for KES ${claim.amount}`,
      });

      return claim;
    }),

  reject: authedQuery
    .input(
      z.object({
        id: z.number(),
        groupId: z.number(),
        reason: z.string().max(500),
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
        "Not authorized",
      );

      if (!["treasurer", "chairperson", "admin"].includes(member.role)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const claim = unwrap(
        await supabase
          .from("welfare_claims")
          .update({
            status: "rejected",
            rejection_reason: input.reason,
            approved_by: ctx.user.id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", input.id)
          .select("*")
          .single(),
      );

      // Create audit log
      await supabase.from("audit_logs").insert({
        group_id: input.groupId,
        user_id: ctx.user.id,
        action: "rejected_welfare_claim",
        entity_type: "welfare",
        entity_id: input.id,
        details: `Rejected welfare claim: ${input.reason}`,
      });

      return claim;
    }),

  markAsPaid: authedQuery
    .input(z.object({ id: z.number(), groupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const member = unwrap(
        await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("user_id", ctx.user.id)
          .maybeSingle(),
        "Not authorized",
      );

      if (!["treasurer", "chairperson", "admin"].includes(member.role)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const claim = unwrap(
        await supabase
          .from("welfare_claims")
          .update({ status: "paid" })
          .eq("id", input.id)
          .select("*")
          .single(),
      );

      return claim;
    }),
});
