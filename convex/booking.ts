import { config } from "@app/config";
import { ConvexError } from "convex/values";
import { z } from "zod";

import { zMutation, zQuery } from ".";
import { getCurrentUser } from "./auth";
import { rateLimit } from "./ratelimiter";
import { bookings, campuses, labs } from "./schema";

export const getByLab = zQuery({
  args: labs.tools.id,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_lab", (q) => q.eq("labId", args.id))
      .collect();

    return bookings;
  },
});

export const getByCampus = zQuery({
  args: campuses.tools.id,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_campus", (q) => q.eq("campusId", args.id))
      .collect();

    return bookings;
  },
});

export const getByUser = zQuery({
  args: z.object({
    userId: z.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user || user._id !== args.userId) {
      throw new ConvexError(config.errors.unauthorized);
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return bookings;
  },
});

export const getById = zQuery({
  args: bookings.tools.id,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError(config.errors.notFound);
    }

    return booking;
  },
});

export const create = zMutation({
  args: bookings.tools.insert,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    await rateLimit(ctx, { name: "createBooking", key: user._id });

    const existingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .filter((q) =>
        q.and(
          q.lt(q.field("startDate"), args.endDate),
          q.gt(q.field("endDate"), args.startDate),
        ),
      )
      .first();

    if (existingBooking) {
      throw new ConvexError(config.errors.overlaps);
    }

    return await ctx.db.insert("bookings", {
      ...args,
      userId: user._id,
    });
  },
});

export const reschedule = zMutation({
  args: bookings.tools.update,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    await rateLimit(ctx, { name: "rescheduleBooking", key: user._id });

    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError(config.errors.notFound);
    }

    if (booking.userId !== user._id) {
      throw new ConvexError(config.errors.unauthorized);
    }

    const overlapping = await ctx.db
      .query("bookings")
      .withIndex("by_lab", (q) => q.eq("labId", booking.labId))
      .filter((q) =>
        q.and(
          q.lt(q.field("startDate"), args.data.endDate ?? 0),
          q.gt(q.field("endDate"), args.data.startDate ?? 0),
        ),
      )
      .first();

    if (overlapping && overlapping._id !== args.id) {
      throw new ConvexError(config.errors.overlaps);
    }

    return await ctx.db.patch(args.id, args.data);
  },
});

export const cancel = zMutation({
  args: bookings.tools.id,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    await rateLimit(ctx, { name: "cancelBooking", key: user._id });

    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError(config.errors.notFound);
    }

    if (booking.userId !== user._id) {
      throw new ConvexError(config.errors.unauthorized);
    }

    return await ctx.db.delete(args.id);
  },
});
