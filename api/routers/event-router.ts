import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { supabase } from "../lib/supabase";
import { unwrap, unwrapList } from "../lib/data";

export const eventRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const rows = unwrapList(
        await supabase
          .from("events")
          .select("*")
          .eq("group_id", input.groupId)
          .order("start_date", { ascending: true }),
      );

      return rows.filter((row) => {
        if (input.status && row.status !== input.status) return false;
        return true;
      });
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const event = unwrap(
        await supabase.from("events").select("*").eq("id", input.id).maybeSingle(),
        "Event not found",
      );

      const rsvps = unwrapList(
        await supabase
          .from("event_rsvps")
          .select("*, member:member_id(*, user:user_id(*))")
          .eq("event_id", input.id),
      );

      return { ...event, rsvps };
    }),

  create: authedQuery
    .input(
      z.object({
        groupId: z.number(),
        title: z.string().max(255),
        description: z.string().max(2000).optional(),
        eventType: z.enum(["meeting", "announcement", "celebration", "training"]),
        startDate: z.date(),
        endDate: z.date().optional(),
        location: z.string().max(255).optional(),
        imageUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = unwrap(
        await supabase
          .from("events")
          .insert({
            group_id: input.groupId,
            title: input.title,
            description: input.description ?? null,
            event_type: input.eventType,
            start_date: input.startDate.toISOString(),
            end_date: input.endDate?.toISOString() ?? null,
            location: input.location ?? null,
            image_url: input.imageUrl ?? null,
            created_by: ctx.user.id,
            status: "scheduled",
          })
          .select("*")
          .single(),
      );

      // Notify all group members
      const members = unwrapList(
        await supabase.from("group_members").select("user_id").eq("group_id", input.groupId),
      );

      for (const member of members) {
        await supabase.from("notifications").insert({
          user_id: member.user_id,
          group_id: input.groupId,
          type: "event",
          title: `New Event: ${input.title}`,
          message: input.description || input.title,
        });
      }

      // Create audit log
      await supabase.from("audit_logs").insert({
        group_id: input.groupId,
        user_id: ctx.user.id,
        action: "created_event",
        entity_type: "event",
        entity_id: event.id,
        details: `Created event: ${input.title}`,
      });

      return event;
    }),

  updateEvent: authedQuery
    .input(
      z.object({
        id: z.number(),
        groupId: z.number(),
        title: z.string().max(255).optional(),
        description: z.string().max(2000).optional(),
        status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]).optional(),
        location: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = unwrap(
        await supabase.from("events").select("*").eq("id", input.id).maybeSingle(),
      );

      if (event.created_by !== ctx.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const updated = unwrap(
        await supabase
          .from("events")
          .update({
            title: input.title ?? event.title,
            description: input.description ?? event.description,
            status: input.status ?? event.status,
            location: input.location ?? event.location,
          })
          .eq("id", input.id)
          .select("*")
          .single(),
      );

      return updated;
    }),

  rsvp: authedQuery
    .input(
      z.object({
        eventId: z.number(),
        groupId: z.number(),
        status: z.enum(["attending", "not_attending", "maybe"]),
        guestCount: z.number().int().nonnegative().default(0),
        notes: z.string().max(500).optional(),
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

      // Check if already RSVP'd
      const existing = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", input.eventId)
        .eq("member_id", member.id)
        .maybeSingle();

      if (existing.data) {
        // Update existing RSVP
        return await supabase
          .from("event_rsvps")
          .update({
            status: input.status,
            guest_count: input.guestCount,
            notes: input.notes ?? null,
          })
          .eq("id", existing.data.id)
          .select("*")
          .single();
      }

      // Create new RSVP
      return unwrap(
        await supabase
          .from("event_rsvps")
          .insert({
            event_id: input.eventId,
            member_id: member.id,
            status: input.status,
            guest_count: input.guestCount,
            notes: input.notes ?? null,
          })
          .select("*")
          .single(),
      );
    }),

  getAttendance: authedQuery
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const rsvps = unwrapList(
        await supabase
          .from("event_rsvps")
          .select("*")
          .eq("event_id", input.eventId),
      );

      return {
        attending: rsvps.filter((r) => r.status === "attending").length,
        notAttending: rsvps.filter((r) => r.status === "not_attending").length,
        maybe: rsvps.filter((r) => r.status === "maybe").length,
        total: rsvps.length,
      };
    }),

  deleteEvent: authedQuery
    .input(z.object({ id: z.number(), groupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const event = unwrap(
        await supabase.from("events").select("*").eq("id", input.id).maybeSingle(),
      );

      if (event.created_by !== ctx.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await supabase.from("events").delete().eq("id", input.id);

      // Create audit log
      await supabase.from("audit_logs").insert({
        group_id: input.groupId,
        user_id: ctx.user.id,
        action: "deleted_event",
        entity_type: "event",
        entity_id: input.id,
        details: `Deleted event: ${event.title}`,
      });

      return { success: true };
    }),
});
