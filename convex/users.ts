import { config } from "./config";
import { ConvexError } from "convex/values";
import { z } from "zod";

import { zMutation, zQuery } from ".";
import { getCurrentUser, requireRole } from "./auth";
import type { Id } from "./_generated/dataModel";

export const me = zQuery({
  handler: async (ctx) => {
    return getCurrentUser(ctx);
  },
});

export const bootstrap = zMutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError(config.errors.unauthorized);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (existing) return existing._id;

    const email = identity.email ?? "";
    const [, domain] = email.split("@");
    const isOffDomain = domain !== config.validDomain;

    return ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email,
      name: identity.name ?? email,
      onboardingCompleted: false,
      isOffDomain,
    });
  },
});

export const completeOnboarding = zMutation({
  args: z.object({
    name: z.string().min(2),
    documentType: z.enum(["CC", "CE", "PP"]),
    documentNumber: z.string().min(4),
    role: z.enum(["student", "professor"]),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError(config.errors.unauthorized);

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) throw new ConvexError(config.errors.notFound);

    return ctx.db.patch(user._id, {
      name: args.name,
      documentType: args.documentType,
      documentNumber: args.documentNumber,
      role: args.role,
      onboardingCompleted: true,
    });
  },
});

export const assignRole = zMutation({
  args: z.object({
    userId: z.string().describe("Convex Id<users>"),
    role: z.enum(["student", "professor", "support", "admin"]),
  }),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);

    const userId = args.userId as Id<"users">;
    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError(config.errors.notFound);

    return ctx.db.patch(userId, { role: args.role });
  },
});

export const deleteAccount = zMutation({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError(config.errors.unauthorized);

    const userBookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    await Promise.all(userBookings.map((b) => ctx.db.delete(b._id)));
    return ctx.db.delete(user._id);
  },
});

export const listByRole = zQuery({
  args: z.object({
    role: z.enum(["student", "professor", "support", "admin"]).optional(),
  }),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);

    if (args.role) {
      return ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role))
        .collect();
    }

    return ctx.db.query("users").collect();
  },
});
