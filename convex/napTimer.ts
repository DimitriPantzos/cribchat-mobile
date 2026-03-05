import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get active nap session for a child
export const getActive = query({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activeNapSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
  },
});

// Start a new nap timer
export const start = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    location: v.optional(v.union(
      v.literal("crib"),
      v.literal("stroller"),
      v.literal("car"),
      v.literal("carrier"),
      v.literal("contact"),
      v.literal("other")
    )),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if there's already an active session
    const existing = await ctx.db
      .query("activeNapSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (existing) {
      throw new Error("There's already an active nap session for this child");
    }
    
    const now = Date.now();
    
    // Create active nap session
    const sessionId = await ctx.db.insert("activeNapSessions", {
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

// Stop nap timer and log to dailyLogs
export const stop = mutation({
  args: {
    childId: v.id("children"),
    quality: v.optional(v.union(
      v.literal("great"),
      v.literal("okay"),
      v.literal("rough")
    )),
    timezoneOffset: v.optional(v.number()), // minutes offset from UTC (e.g., -300 for EST)
  },
  handler: async (ctx, args) => {
    // Get the active session
    const session = await ctx.db
      .query("activeNapSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (!session) {
      throw new Error("No active nap session found");
    }
    
    const endTime = Date.now();
    const durationMs = endTime - session.startTime;
    const durationMin = Math.round(durationMs / 60000);
    
    // Format times for dailyLogs (apply timezone offset if provided)
    // timezoneOffset is in minutes from UTC (negative for west of UTC, e.g., -300 for EST)
    const offsetMs = (args.timezoneOffset ?? 0) * 60 * 1000;
    const startDate = new Date(session.startTime - offsetMs);
    const endDate = new Date(endTime - offsetMs);
    const startTimeStr = `${String(startDate.getUTCHours()).padStart(2, '0')}:${String(startDate.getUTCMinutes()).padStart(2, '0')}`;
    const endTimeStr = `${String(endDate.getUTCHours()).padStart(2, '0')}:${String(endDate.getUTCMinutes()).padStart(2, '0')}`;
    
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
    
    const napEntry = {
      startTime: startTimeStr,
      endTime: endTimeStr,
      duration: durationMin,
      location: session.location,
      quality: args.quality,
      notes: session.notes,
    };
    
    const now = Date.now();
    
    if (dailyLog) {
      // Add nap to existing log
      await ctx.db.patch(dailyLog._id, {
        naps: [...dailyLog.naps, napEntry],
        updatedAt: now,
      });
    } else {
      // Create new daily log with the nap
      await ctx.db.insert("dailyLogs", {
        userId: session.userId,
        childId: session.childId,
        date: today,
        naps: [napEntry],
        meals: [],
        bottles: [],
        createdAt: now,
        updatedAt: now,
      });
    }
    
    // Delete the active session
    await ctx.db.delete(session._id);
    
    return {
      duration: durationMin,
      startTime: startTimeStr,
      endTime: endTimeStr,
    };
  },
});

// Cancel nap timer without logging
export const cancel = mutation({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("activeNapSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// Update location for an active nap
export const updateLocation = mutation({
  args: {
    childId: v.id("children"),
    location: v.union(
      v.literal("crib"),
      v.literal("stroller"),
      v.literal("car"),
      v.literal("carrier"),
      v.literal("contact"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("activeNapSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (session) {
      await ctx.db.patch(session._id, { location: args.location });
    }
  },
});
