import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// !! DO NOT MODIFY OR DELETE THIS FILE !!
// These internal helpers are used by the Converge platform to manage
// asset uploads, URL resolution, and file deletion on this backend.
// Removing or editing them will break the Assets feature.

export const generateUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = internalQuery({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const deleteFile = internalMutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
  },
});
