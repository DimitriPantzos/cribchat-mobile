import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Save a message
export const save = mutation({
  args: {
    userId: v.id("users"),
    childId: v.optional(v.id("children")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      userId: args.userId,
      childId: args.childId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

// Get recent messages for a user (for current chat session)
export const getRecent = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get all messages grouped by date for history view
export const getGroupedByDate = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Group messages by date
    const grouped: Record<string, typeof messages> = {};
    
    for (const msg of messages) {
      const date = new Date(msg.createdAt).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(msg);
    }

    // Convert to array sorted by date (newest first)
    // Reverse messages within each day to be chronological
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, msgs]) => ({
        date,
        messages: msgs.reverse(),
        messageCount: msgs.length,
        preview: msgs.find(m => m.role === 'user')?.content.slice(0, 100) || '',
      }));
  },
});

// Get messages for a specific date
export const getByDate = query({
  args: { 
    userId: v.id("users"),
    date: v.string(), // ISO date string YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const startOfDay = new Date(args.date).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), startOfDay),
          q.lt(q.field("createdAt"), endOfDay)
        )
      )
      .collect();

    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Clear chat history for a user
export const clear = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  },
});

// Clear messages for a specific date only
export const clearByDate = mutation({
  args: { 
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const startOfDay = new Date(args.date).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), startOfDay),
          q.lt(q.field("createdAt"), endOfDay)
        )
      )
      .collect();
    
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  },
});
