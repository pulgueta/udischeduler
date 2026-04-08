import { ConvexError } from "convex/values";
import { z } from "zod";

import { zMutation, zQuery } from ".";
import type { Id } from "./_generated/dataModel";
import { getCurrentUser, requireUser } from "./auth";
import { config } from "./config";
import { rateLimit } from "./ratelimiter";
import { bookings, campuses, labs } from "./schema";

export const getByLab = zQuery({
  args: labs.tools.id,
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return ctx.db
      .query("bookings")
      .withIndex("by_lab", (q) => q.eq("labId", args.id))
      .collect();
  },
});

export const getByCampus = zQuery({
  args: campuses.tools.id,
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return ctx.db
      .query("bookings")
      .withIndex("by_campus", (q) => q.eq("campusId", args.id))
      .collect();
  },
});

export const getMyBookings = zQuery({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getById = zQuery({
  args: bookings.tools.id,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.id);
    if (!booking) throw new ConvexError(config.errors.notFound);
    if (booking.userId !== user._id && user.role !== "admin") {
      throw new ConvexError(config.errors.unauthorized);
    }
    return booking;
  },
});

export const create = zMutation({
  args: z.object({
    labId: z.string().describe("Convex Id<labs>"),
    campusId: z.string().describe("Convex Id<campuses>"),
    name: z.string().min(3),
    startDate: z.number(),
    endDate: z.number(),
    participants: z
      .array(z.object({ name: z.string(), email: z.string() }))
      .default([]),
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await rateLimit(ctx, { name: "createBooking", key: user._id });

    const labId = args.labId as Id<"labs">;
    const campusId = args.campusId as Id<"campuses">;

    const existing = await ctx.db
      .query("bookings")
      .withIndex("by_lab", (q) => q.eq("labId", labId))
      .filter((q) =>
        q.and(
          q.lt(q.field("startDate"), args.endDate),
          q.gt(q.field("endDate"), args.startDate),
        ),
      )
      .first();

    if (existing) throw new ConvexError(config.errors.overlaps);

    return ctx.db.insert("bookings", {
      labId,
      campusId,
      userId: user._id,
      name: args.name,
      startDate: args.startDate,
      endDate: args.endDate,
      participants: args.participants,
    });
  },
});

export const reschedule = zMutation({
  args: z.object({
    id: z.string().describe("Convex Id<bookings>"),
    startDate: z.number().optional(),
    endDate: z.number().optional(),
    name: z.string().optional(),
    participants: z
      .array(z.object({ name: z.string(), email: z.string() }))
      .optional(),
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await rateLimit(ctx, { name: "rescheduleBooking", key: user._id });

    const bookingId = args.id as Id<"bookings">;
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new ConvexError(config.errors.notFound);
    if (booking.userId !== user._id)
      throw new ConvexError(config.errors.unauthorized);

    const { id: _id, ...data } = args;

    if (data.startDate !== undefined || data.endDate !== undefined) {
      const overlapping = await ctx.db
        .query("bookings")
        .withIndex("by_lab", (q) => q.eq("labId", booking.labId))
        .filter((q) =>
          q.and(
            q.lt(q.field("startDate"), data.endDate ?? booking.endDate),
            q.gt(q.field("endDate"), data.startDate ?? booking.startDate),
          ),
        )
        .first();

      if (overlapping && overlapping._id !== bookingId) {
        throw new ConvexError(config.errors.overlaps);
      }
    }

    return ctx.db.patch(bookingId, data);
  },
});

export const cancel = zMutation({
  args: bookings.tools.id,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await rateLimit(ctx, { name: "cancelBooking", key: user._id });

    const booking = await ctx.db.get(args.id);
    if (!booking) throw new ConvexError(config.errors.notFound);
    if (booking.userId !== user._id && user.role !== "admin") {
      throw new ConvexError(config.errors.unauthorized);
    }

    return ctx.db.delete(args.id);
  },
});

export const getByUser = zQuery({
  args: z.object({ userId: z.string() }),
  handler: async (ctx, args) => {
    const requestingUser = await getCurrentUser(ctx);
    const isAdmin = requestingUser?.role === "admin";

    if (!requestingUser || (requestingUser._id !== args.userId && !isAdmin)) {
      throw new ConvexError(config.errors.unauthorized);
    }

    return ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
