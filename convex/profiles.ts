import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return profile;
  },
});

export const create = mutation({
  args: {
    role: v.union(v.literal("student"), v.literal("professor")),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) throw new Error("Profile already exists");

    return await ctx.db.insert("profiles", {
      userId,
      role: args.role,
      department: args.department,
      registered: false,
    });
  },
});

export const register = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    studentId: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found. Complete onboarding first.");

    await ctx.db.patch(profile._id, {
      fullName: args.fullName,
      email: args.email,
      ...(args.studentId !== undefined ? { studentId: args.studentId } : {}),
      ...(args.phone !== undefined ? { phone: args.phone } : {}),
      registered: true,
    });
  },
});

export const listProfessors = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const allProfiles = await ctx.db.query("profiles").collect();
    const professors: Array<{
      userId: string;
      name: string;
      department: string;
    }> = [];

    for (const profile of allProfiles) {
      if (profile.role === "professor" && profile.registered) {
        const user = await ctx.db.get(profile.userId);
        if (user) {
          professors.push({
            userId: profile.userId,
            name: profile.fullName || user.name || user.email || "Unknown Professor",
            department: profile.department,
          });
        }
      }
    }
    return professors;
  },
});

export const searchStudents = query({
  args: {
    searchTerm: v.string(),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    if (!args.searchTerm.trim()) return [];

    const results = await ctx.db
      .query("profiles")
      .withSearchIndex("search_name", (q) =>
        q
          .search("fullName", args.searchTerm)
          .eq("department", args.department)
          .eq("role", "student")
      )
      .take(10);

    const enriched: Array<{
      userId: string;
      fullName: string;
      email: string;
      studentId: string;
      department: string;
    }> = [];

    for (const profile of results) {
      if (!profile.registered) continue;
      const user = await ctx.db.get(profile.userId);
      if (user && profile.userId !== userId) {
        enriched.push({
          userId: profile.userId,
          fullName: profile.fullName || user.name || user.email || "Unknown",
          email: profile.email || user.email || "",
          studentId: profile.studentId || "",
          department: profile.department,
        });
      }
    }
    return enriched;
  },
});

export const searchProfessors = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    if (!args.searchTerm.trim()) return [];

    const results = await ctx.db
      .query("profiles")
      .withSearchIndex("search_name", (q) =>
        q.search("fullName", args.searchTerm).eq("role", "professor")
      )
      .take(10);

    const enriched: Array<{
      userId: string;
      fullName: string;
      email: string;
      department: string;
    }> = [];

    for (const profile of results) {
      if (!profile.registered) continue;
      const user = await ctx.db.get(profile.userId);
      if (user && profile.userId !== userId) {
        enriched.push({
          userId: profile.userId,
          fullName: profile.fullName || user.name || user.email || "Unknown",
          email: profile.email || user.email || "",
          department: profile.department,
        });
      }
    }
    return enriched;
  },
});
