import { config } from "./config";
import { ConvexError } from "convex/values";

import { zInternalMutation, zQuery } from ".";
import { requireRole, requireUser } from "./auth";
import { campuses, labs } from "./schema";

export const getAll = zQuery({
  handler: async (ctx) => {
    await requireUser(ctx);
    return ctx.db.query("labs").collect();
  },
});

export const getByCampus = zQuery({
  args: campuses.tools.id,
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return ctx.db
      .query("labs")
      .withIndex("by_campus", (q) => q.eq("campusId", args.id))
      .collect();
  },
});

export const getById = zQuery({
  args: labs.tools.id,
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const lab = await ctx.db.get(args.id);
    if (!lab) throw new ConvexError(config.errors.notFound);
    return lab;
  },
});

export const create = zInternalMutation({
  args: labs.tools.insert,
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    return ctx.db.insert("labs", args);
  },
});

export const update = zInternalMutation({
  args: labs.tools.update,
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "support"]);
    const lab = await ctx.db.get(args.id);
    if (!lab) throw new ConvexError(config.errors.notFound);
    return ctx.db.patch(args.id, args.data);
  },
});

export const remove = zInternalMutation({
  args: labs.tools.id,
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    return ctx.db.delete(args.id);
  },
});
