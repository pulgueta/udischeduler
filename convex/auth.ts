import type { MutationCtx, QueryCtx } from "./_generated/server";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) return null;

  return ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .first();
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  roles: Array<"student" | "professor" | "support" | "admin">,
) {
  const user = await requireUser(ctx);
  if (!user.role || !roles.includes(user.role)) {
    throw new Error("Insufficient permissions");
  }
  return user;
}
