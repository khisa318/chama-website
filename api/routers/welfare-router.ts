import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { mapWelfareClaim, unwrap, unwrapList } from "../lib/data";

export const welfareRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.string().uuid().optional(),
        status: z.enum(["pending", "approved", "rejected", "paid"]).optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      let query = supabase.from("welfare_claims").select("*").order("created_at", { ascending: false });

      if (input?.groupId) query = query.eq("group_id", input.groupId);
      if (input?.status) query = query.eq("status", input.status);

      const rows = unwrapList(await query);
      return rows.map(mapWelfareClaim);
    }),

  getById: authedQuery
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const row = unwrap(
        await supabase.from("welfare_claims").select("*").eq("id", input.id).maybeSingle(),
        "Welfare claim not found",
      ) as Record<string, unknown>;
      return mapWelfareClaim(row);
    }),

  submit: authedQuery
    .input(
      z.object({
        groupId: z.string().uuid(),
        type: z.enum(["medical", "burial", "graduation", "maternity", "other"]),
        description: z.string().max(1000),
        amountRequested: z.number().positive(),
        documentUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const claim = unwrap(
        await supabase
          .from("welfare_claims")
          .insert({
            group_id: input.groupId,
            claimant_id: ctx.user.id,
            type: input.type,
            description: input.description,
            amount_requested: input.amountRequested,
            document_url: input.documentUrl ?? null,
            status: "pending",
          })
          .select("*")
          .single(),
      ) as Record<string, unknown>;

      await supabase.from("audit_log").insert({
        group_id: input.groupId,
        actor_id: ctx.user.id,
        action: "submitted_welfare_claim",
        target_type: "welfare_claim",
        target_id: claim.id as string,
        details: { type: input.type, amount: input.amountRequested },
      });

      return mapWelfareClaim(claim);
    }),

  review: authedQuery
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        amountApproved: z.number().nonnegative().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const claim = unwrap(
        await supabase.from("welfare_claims").select("group_id").eq("id", input.id).single(),
      ) as any;

      const { error } = await supabase
        .from("welfare_claims")
        .update({
          status: input.status,
          amount_approved: input.amountApproved ?? 0,
          reviewed_by: ctx.user.id,
        })
        .eq("id", input.id);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      await supabase.from("audit_log").insert({
        group_id: claim.group_id,
        actor_id: ctx.user.id,
        action: `${input.status}_welfare_claim`,
        target_type: "welfare_claim",
        target_id: input.id,
        details: { status: input.status, amountApproved: input.amountApproved },
      });

      return { success: true };
    }),

  markAsPaid: authedQuery
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("welfare_claims")
        .update({ status: "paid" })
        .eq("id", input.id);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
