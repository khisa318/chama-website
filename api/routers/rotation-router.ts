import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { unwrap, unwrapList } from "../lib/data";

export const rotationRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        status: z.enum(["active", "completed", "paused"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(
        await supabase
          .from("rotations")
          .select("*")
          .eq("group_id", input.groupId)
          .order("created_at", { ascending: false }),
      );

      return rows.filter((row) => {
        if (input.status && row.status !== input.status) return false;
        return true;
      });
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const rotation = unwrap(
        await supabase.from("rotations").select("*").eq("id", input.id).maybeSingle(),
        "Rotation not found",
      );

      const schedule = unwrapList(
        await supabase
          .from("rotation_schedule")
          .select("*, member:member_id(*)")
          .eq("rotation_id", input.id)
          .order("sequence_number"),
      );

      return { ...rotation, schedule };
    }),

  create: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        name: z.string().max(255),
        description: z.string().max(1000).optional(),
        rotationAmount: z.number().positive(),
        frequency: z.enum(["weekly", "biweekly", "monthly"]),
        startDate: z.date(),
        memberIds: z.array(z.number()).min(2),
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

      const rotation = unwrap(
        await supabase
          .from("rotations")
          .insert({
            group_id: input.groupId,
            name: input.name,
            description: input.description ?? null,
            rotation_amount: input.rotationAmount,
            frequency: input.frequency,
            start_date: input.startDate.toISOString(),
            created_by: ctx.user.id,
            status: "active",
          })
          .select("*")
          .single(),
      );

      // Create schedule for each member
      const scheduleEntries = input.memberIds.map((memberId, index) => ({
        rotation_id: rotation.id,
        member_id: memberId,
        sequence_number: index + 1,
        status: "pending",
      }));

      await supabase.from("rotation_schedule").insert(scheduleEntries);

      // Create audit log
      await supabase.from("audit_logs").insert({
        group_id: input.groupId,
        user_id: ctx.user.id,
        action: "created_rotation",
        entity_type: "rotation",
        entity_id: rotation.id,
        details: `Created rotation: ${input.name} with ${input.memberIds.length} members`,
      });

      return rotation;
    }),

  markCompleted: authedQuery
    .input(
      z.object({
        scheduleId: z.number(),
        groupId: z.number(),
        payoutAmount: z.number().positive(),
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

      const scheduleItem = unwrap(
        await supabase
          .from("rotation_schedule")
          .update({
            status: "completed",
            payout_amount: input.payoutAmount,
            payout_date: new Date().toISOString(),
          })
          .eq("id", input.scheduleId)
          .select("*")
          .single(),
      );

      // Create transaction record
      await supabase.from("transactions").insert({
        group_id: input.groupId,
        type: "rotation_payout",
        amount: input.payoutAmount,
        description: "Rotation payout",
        category: "rotation",
        date: new Date().toISOString(),
        status: "completed",
        created_by: ctx.user.id,
      });

      return scheduleItem;
    }),

  pauseRotation: authedQuery
    .input(z.object({ id: z.number(), groupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const member = unwrap(
        await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("user_id", ctx.user.id)
          .maybeSingle(),
      );

      if (!["treasurer", "chairperson", "admin"].includes(member.role)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const rotation = unwrap(
        await supabase
          .from("rotations")
          .update({ status: "paused" })
          .eq("id", input.id)
          .select("*")
          .single(),
      );

      return rotation;
    }),

  resumeRotation: authedQuery
    .input(z.object({ id: z.number(), groupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const member = unwrap(
        await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", input.groupId)
          .eq("user_id", ctx.user.id)
          .maybeSingle(),
      );

      if (!["treasurer", "chairperson", "admin"].includes(member.role)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const rotation = unwrap(
        await supabase
          .from("rotations")
          .update({ status: "active" })
          .eq("id", input.id)
          .select("*")
          .single(),
      );

      return rotation;
    }),
});
