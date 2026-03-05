import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get cry sessions for a child
export const getByChild = query({
  args: { 
    childId: v.id("children"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    return await ctx.db
      .query("crySessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(limit);
  },
});

// Get recent sessions for a user (across all children)
export const getByUser = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    return await ctx.db
      .query("crySessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Save a cry session
export const save = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    intervalsCompleted: v.number(),
    intervals: v.array(v.number()),
    totalDurationMin: v.number(),
    outcome: v.union(
      v.literal("asleep"),
      v.literal("comforted"),
      v.literal("stopped")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("crySessions", {
      userId: args.userId,
      childId: args.childId,
      startTime: args.startTime,
      endTime: args.endTime,
      intervalsCompleted: args.intervalsCompleted,
      intervals: args.intervals,
      totalDurationMin: args.totalDurationMin,
      outcome: args.outcome,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

// Delete a cry session
export const remove = mutation({
  args: { sessionId: v.id("crySessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
  },
});

// Get stats for cry sessions
export const getStats = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("crySessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(30);

    if (sessions.length === 0) {
      return null;
    }

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    const last7 = sessions.filter(s => s.startTime >= sevenDaysAgo);
    const last30 = sessions;

    const calcStats = (subset: typeof sessions) => {
      if (subset.length === 0) return null;
      
      const totalIntervals = subset.reduce((sum, s) => sum + s.intervalsCompleted, 0);
      const totalDuration = subset.reduce((sum, s) => sum + s.totalDurationMin, 0);
      const asleepCount = subset.filter(s => s.outcome === "asleep").length;

      return {
        sessions: subset.length,
        avgIntervals: Math.round((totalIntervals / subset.length) * 10) / 10,
        avgDurationMin: Math.round(totalDuration / subset.length),
        successRate: Math.round((asleepCount / subset.length) * 100),
        totalSessions: subset.length,
      };
    };

    return {
      last7Days: calcStats(last7),
      last30Days: calcStats(last30),
    };
  },
});
