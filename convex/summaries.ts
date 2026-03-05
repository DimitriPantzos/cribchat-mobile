import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get summary for a specific date
export const getByDate = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("summaries")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();
  },
});

// Get all summaries for a user (for overview)
export const getAll = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    const summaries = await ctx.db
      .query("summaries")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);
    return summaries;
  },
});

// Save or update a summary
export const save = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    keyPoints: v.array(v.object({
      type: v.union(
        v.literal("action"),
        v.literal("outcome"),
        v.literal("advice"),
        v.literal("insight")
      ),
      text: v.string(),
      emoji: v.optional(v.string()),
    })),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if summary already exists for this date
    const existing = await ctx.db
      .query("summaries")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        keyPoints: args.keyPoints,
        summary: args.summary,
        createdAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("summaries", {
        userId: args.userId,
        date: args.date,
        keyPoints: args.keyPoints,
        summary: args.summary,
        createdAt: Date.now(),
      });
    }
  },
});

// Delete a summary
export const remove = mutation({
  args: { 
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("summaries")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();
    
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
