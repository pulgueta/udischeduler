import { config } from "@app/config";
import { ConvexError } from "convex/values";
import { z } from "zod";

import { zMutation, zQuery } from ".";
import { getCurrentUser } from "./auth";
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

export const create = zMutation({
  args: bookings.tools.insert,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    const existingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .filter((q) =>
        q.and(
          q.lte(q.field("startDate"), args.startDate),
          q.gte(q.field("endDate"), args.endDate),
        ),
      )
      .first();

    if (existingBooking) {
      throw new ConvexError(config.errors.overlaps);
    }

    return await ctx.db.insert("bookings", args);
  },
});
