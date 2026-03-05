import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get sleep logs for a child
export const getByChild = query({
  args: { 
    childId: v.id("children"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    return await ctx.db
      .query("sleepLogs")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(limit);
  },
});

// Get a single log by ID
export const get = query({
  args: { logId: v.id("sleepLogs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.logId);
  },
});

// Add a new sleep log
export const add = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    date: v.string(),
    wakeUps: v.array(v.object({
      time: v.string(),
      duration: v.number(),
      fed: v.boolean(),
      notes: v.optional(v.string()),
    })),
    bedtime: v.optional(v.string()),
    wakeTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sleepLogs", {
      userId: args.userId,
      childId: args.childId,
      date: args.date,
      wakeUps: args.wakeUps,
      bedtime: args.bedtime,
      wakeTime: args.wakeTime,
      createdAt: Date.now(),
    });
  },
});

// Update a sleep log
export const update = mutation({
  args: {
    logId: v.id("sleepLogs"),
    wakeUps: v.optional(v.array(v.object({
      time: v.string(),
      duration: v.number(),
      fed: v.boolean(),
      notes: v.optional(v.string()),
    }))),
    bedtime: v.optional(v.string()),
    wakeTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { logId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(logId, filteredUpdates);
  },
});

// Delete a sleep log
export const remove = mutation({
  args: { logId: v.id("sleepLogs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.logId);
  },
});

// Get stats for a child (last 7 and 30 days)
export const getStats = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("sleepLogs")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(30);

    if (logs.length === 0) {
      return null;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const last7 = logs.filter(l => new Date(l.date) >= sevenDaysAgo);
    const last30 = logs;

    const calcStats = (subset: typeof logs) => {
      if (subset.length === 0) return null;
      
      const totalWakeUps = subset.reduce((sum, l) => sum + l.wakeUps.length, 0);
      const totalFeeds = subset.reduce(
        (sum, l) => sum + l.wakeUps.filter(w => w.fed).length, 
        0
      );
      const totalDuration = subset.reduce(
        (sum, l) => sum + l.wakeUps.reduce((s, w) => s + w.duration, 0),
        0
      );

      return {
        nights: subset.length,
        avgWakeUps: Math.round((totalWakeUps / subset.length) * 10) / 10,
        avgFeeds: Math.round((totalFeeds / subset.length) * 10) / 10,
        avgDurationMin: Math.round(totalDuration / subset.length),
        totalWakeUps,
        totalFeeds,
      };
    };

    return {
      last7Days: calcStats(last7),
      last30Days: calcStats(last30),
    };
  },
});
