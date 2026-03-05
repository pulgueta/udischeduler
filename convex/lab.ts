import { config } from "@app/config";
import { ConvexError } from "convex/values";

import { zInternalMutation, zQuery } from ".";
import { getCurrentUser } from "./auth";
import { labs } from "./schema";

export const getAll = zQuery({
  handler: async (ctx) => {
    const labs = await ctx.db.query("labs").collect();

    return labs;
  },
});

export const create = zInternalMutation({
  args: labs.tools.insert,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    return await ctx.db.insert("labs", args);
  },
});

export const update = zInternalMutation({
  args: labs.tools.update,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    const lab = await ctx.db.get(args.id);

    if (!lab) {
      throw new ConvexError(config.errors.notFound);
    }

    return await ctx.db.patch("labs", args.id, args.data);
  },
});

export const remove = zInternalMutation({
  args: labs.tools.id,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new ConvexError(config.errors.unauthorized);
    }

    return await ctx.db.delete("labs", args.id);
  },
});
