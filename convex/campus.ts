import { config } from "./config";
import { ConvexError } from "convex/values";
import { z } from "zod";

import { zInternalMutation, zQuery } from ".";
import { requireRole, requireUser } from "./auth";
import { campuses } from "./schema";

export const getAll = zQuery({
  handler: async (ctx) => {
    await requireUser(ctx);
    return ctx.db.query("campuses").collect();
  },
});

export const getById = zQuery({
  args: campuses.tools.id,
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const campus = await ctx.db.get(args.id);
    if (!campus) throw new ConvexError(config.errors.notFound);
    return campus;
  },
});

export const create = zInternalMutation({
  args: campuses.tools.insert,
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    return ctx.db.insert("campuses", args);
  },
});

export const update = zInternalMutation({
  args: campuses.tools.update,
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const campus = await ctx.db.get(args.id);
    if (!campus) throw new ConvexError(config.errors.notFound);
    return ctx.db.patch(args.id, args.data);
  },
});

export const remove = zInternalMutation({
  args: campuses.tools.id,
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    return ctx.db.delete(args.id);
  },
});

export const search = zQuery({
  args: z.object({ query: z.string() }),
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return ctx.db
      .query("campuses")
      .withSearchIndex("by_name", (q) => q.search("name", args.query))
      .collect();
  },
});
