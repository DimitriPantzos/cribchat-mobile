import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get active breastfeeding session for a child
export const getActive = query({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activeBreastfeedingSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
  },
});

// Start a breastfeeding session
export const start = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    side: v.optional(v.union(v.literal("left"), v.literal("right"))),
  },
  handler: async (ctx, args) => {
    // Check if there's already an active session
    const existing = await ctx.db
      .query("activeBreastfeedingSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();

    if (existing) {
      throw new Error("Already an active breastfeeding session");
    }

    const now = Date.now();
    return await ctx.db.insert("activeBreastfeedingSessions", {
      userId: args.userId,
      childId: args.childId,
      startTime: now,
      side: args.side,
      createdAt: now,
    });
  },
});

// Update the side during feeding
export const updateSide = mutation({
  args: {
    childId: v.id("children"),
    side: v.union(v.literal("left"), v.literal("right")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("activeBreastfeedingSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();

    if (!session) {
      throw new Error("No active breastfeeding session");
    }

    await ctx.db.patch(session._id, { side: args.side });
  },
});

// Stop and log the breastfeeding session
export const stop = mutation({
  args: {
    childId: v.id("children"),
    timezoneOffset: v.number(), // minutes offset from UTC
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("activeBreastfeedingSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();

    if (!session) {
      throw new Error("No active breastfeeding session");
    }

    const now = Date.now();
    const durationMs = now - session.startTime;
    const durationMin = Math.round(durationMs / 60000);

    // Calculate start time in local timezone
    const startDate = new Date(session.startTime - args.timezoneOffset * 60000);
    const startTimeStr = `${String(startDate.getUTCHours()).padStart(2, '0')}:${String(startDate.getUTCMinutes()).padStart(2, '0')}`;

    // Get today's date in local timezone
    const localNow = new Date(now - args.timezoneOffset * 60000);
    const today = localNow.toISOString().split('T')[0];

    // Find or create today's log
    let log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) =>
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();

    const bottleEntry = {
      time: startTimeStr,
      type: "breast" as const,
      duration: durationMin,
      notes: session.side ? `${session.side} side` : undefined,
    };

    if (log) {
      await ctx.db.patch(log._id, {
        bottles: [...log.bottles, bottleEntry],
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("dailyLogs", {
        userId: session.userId,
        childId: args.childId,
        date: today,
        naps: [],
        meals: [],
        bottles: [bottleEntry],
        createdAt: now,
        updatedAt: now,
      });
    }

    // Delete the active session
    await ctx.db.delete(session._id);

    return { duration: durationMin };
  },
});

// Cancel without logging
export const cancel = mutation({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("activeBreastfeedingSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});
