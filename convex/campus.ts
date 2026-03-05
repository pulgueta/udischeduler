import { config } from "@app/config";
import { ConvexError } from "convex/values";
import { z } from "zod";

import { zInternalMutation, zQuery } from ".";
import { getCurrentUser } from "./auth";
import { campuses } from "./schema";

export const getAll = zQuery({
  handler: async (ctx) => {
    const campuses = await ctx.db.query("campuses").collect();

    return campuses;
  },
});

export const create = zInternalMutation({
  args: campuses.tools.insert,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    return await ctx.db.insert("campuses", args);
  },
});

export const update = zInternalMutation({
  args: campuses.tools.update,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    const campus = await ctx.db.get(args.id);

    if (!campus) {
      throw new ConvexError(config.errors.notFound);
    }

    return await ctx.db.patch("campuses", args.id, args.data);
  },
});

export const remove = zInternalMutation({
  args: campuses.tools.id,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    return await ctx.db.delete("campuses", args.id);
  },
});

export const search = zQuery({
  args: z.object({
    query: z.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    const campuses = await ctx.db
      .query("campuses")
      .withSearchIndex("by_name", (q) => q.search("name", args.query))
      .collect();

    return campuses;
  },
});
