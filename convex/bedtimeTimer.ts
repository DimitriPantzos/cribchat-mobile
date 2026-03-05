import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Bedtime location options
const bedtimeLocation = v.union(
  v.literal("crib"),
  v.literal("arms"),
  v.literal("rocker"),
  v.literal("bed"),
  v.literal("other")
);

// Get active bedtime session for a child
export const getActive = query({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activeBedtimeSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
  },
});

// Start a new bedtime timer
export const start = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    location: v.optional(bedtimeLocation),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if there's already an active session
    const existing = await ctx.db
      .query("activeBedtimeSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (existing) {
      throw new Error("There's already an active bedtime session for this child");
    }
    
    const now = Date.now();
    
    // Create active bedtime session
    const sessionId = await ctx.db.insert("activeBedtimeSessions", {
      userId: args.userId,
      childId: args.childId,
      startTime: now,
      location: args.location,
      notes: args.notes,
      createdAt: now,
    });
    
    return { sessionId, startTime: now };
  },
});

// Stop bedtime timer and log to dailyLogs
export const stop = mutation({
  args: {
    childId: v.id("children"),
    timezoneOffset: v.optional(v.number()), // minutes offset from UTC (e.g., 300 for EST)
  },
  handler: async (ctx, args) => {
    // Get the active session
    const session = await ctx.db
      .query("activeBedtimeSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (!session) {
      throw new Error("No active bedtime session found");
    }
    
    const endTime = Date.now();
    const durationMs = endTime - session.startTime;
    const durationMin = Math.round(durationMs / 60000);
    
    // Format bedtime for dailyLogs (apply timezone offset if provided)
    // timezoneOffset is in minutes from UTC (positive for west of UTC, e.g., 300 for EST)
    const offsetMs = (args.timezoneOffset ?? 0) * 60 * 1000;
    const startDate = new Date(session.startTime - offsetMs);
    const bedtimeStr = `${String(startDate.getUTCHours()).padStart(2, '0')}:${String(startDate.getUTCMinutes()).padStart(2, '0')}`;
    
    // Get today's date in user's timezone
    const todayDate = new Date(endTime - offsetMs);
    const today = `${todayDate.getUTCFullYear()}-${String(todayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(todayDate.getUTCDate()).padStart(2, '0')}`;
    
    // Get or create daily log
    let dailyLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    const now = Date.now();
    
    if (dailyLog) {
      // Update existing log with bedtime and routine duration
      await ctx.db.patch(dailyLog._id, {
        bedtime: bedtimeStr,
        bedtimeRoutineDuration: durationMin,
        bedtimeLocation: session.location,
        updatedAt: now,
      });
    } else {
      // Create new daily log with the bedtime
      await ctx.db.insert("dailyLogs", {
        userId: session.userId,
        childId: session.childId,
        date: today,
        naps: [],
        meals: [],
        bottles: [],
        bedtime: bedtimeStr,
        bedtimeRoutineDuration: durationMin,
        bedtimeLocation: session.location,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    // Start an active sleep session (baby is now sleeping for the night)
    // Check if there's already one and delete it
    const existingSleep = await ctx.db
      .query("activeSleepSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (existingSleep) {
      await ctx.db.delete(existingSleep._id);
    }
    
    await ctx.db.insert("activeSleepSessions", {
      userId: session.userId,
      childId: session.childId,
      startTime: now, // Baby fell asleep now
      bedtimeStr: bedtimeStr,
      date: today,
      location: session.location,
      createdAt: now,
    });
    
    // Delete the active bedtime session
    await ctx.db.delete(session._id);
    
    return {
      duration: durationMin,
      bedtime: bedtimeStr,
    };
  },
});

// Cancel bedtime timer without logging
export const cancel = mutation({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("activeBedtimeSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// Update location for an active bedtime session
export const updateLocation = mutation({
  args: {
    childId: v.id("children"),
    location: bedtimeLocation,
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("activeBedtimeSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (session) {
      await ctx.db.patch(session._id, { location: args.location });
    }
  },
});
