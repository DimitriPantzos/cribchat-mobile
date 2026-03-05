import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Sleep location options (matches bedtime)
const sleepLocation = v.union(
  v.literal("crib"),
  v.literal("arms"),
  v.literal("rocker"),
  v.literal("bed"),
  v.literal("other")
);

// Get active sleep session for a child (baby is currently sleeping)
export const getActive = query({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activeSleepSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
  },
});

// Start a sleep session (called when bedtime is logged, baby is asleep)
export const start = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    bedtimeStr: v.string(), // HH:MM format
    location: v.optional(sleepLocation),
  },
  handler: async (ctx, args) => {
    // Check if there's already an active sleep session
    const existing = await ctx.db
      .query("activeSleepSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (existing) {
      // End the existing session first (shouldn't happen, but handle it)
      await ctx.db.delete(existing._id);
    }
    
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    // Create active sleep session
    const sessionId = await ctx.db.insert("activeSleepSessions", {
      userId: args.userId,
      childId: args.childId,
      startTime: now,
      bedtimeStr: args.bedtimeStr,
      date: today,
      location: args.location,
      createdAt: now,
    });
    
    return { sessionId, startTime: now };
  },
});

// Log a night wake (baby woke up during the night)
export const logNightWake = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    wakeTime: v.optional(v.string()), // HH:MM - if not provided, uses current time
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const currentDate = new Date(now);
    const wakeTimeStr = args.wakeTime || 
      `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
    
    // Get active sleep session
    const sleepSession = await ctx.db
      .query("activeSleepSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (!sleepSession) {
      throw new Error("No active sleep session found");
    }
    
    // Mark the session as having a night wake in progress
    await ctx.db.patch(sleepSession._id, {
      isNightWake: true,
      nightWakeStartTime: now,
    });
    
    // Add to the daily log's nightWakes array
    // Use the date from the sleep session (when baby went to sleep)
    const dailyLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", sleepSession.date)
      )
      .first();
    
    if (dailyLog) {
      const existingNightWakes = dailyLog.nightWakes || [];
      await ctx.db.patch(dailyLog._id, {
        nightWakes: [...existingNightWakes, {
          wakeTime: wakeTimeStr,
          wakeTimestamp: now,
        }],
        updatedAt: now,
      });
    }
    
    return { wakeTime: wakeTimeStr, timestamp: now };
  },
});

// Log baby going back to sleep after a night wake
export const logBackToSleep = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    backToSleepTime: v.optional(v.string()), // HH:MM - if not provided, uses current time
    fed: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const currentDate = new Date(now);
    const backToSleepStr = args.backToSleepTime || 
      `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
    
    // Get active sleep session
    const sleepSession = await ctx.db
      .query("activeSleepSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (!sleepSession) {
      throw new Error("No active sleep session found");
    }
    
    // Clear the night wake state
    await ctx.db.patch(sleepSession._id, {
      isNightWake: false,
      nightWakeStartTime: undefined,
    });
    
    // Update the daily log's last night wake with back to sleep time
    const dailyLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", sleepSession.date)
      )
      .first();
    
    if (dailyLog && dailyLog.nightWakes && dailyLog.nightWakes.length > 0) {
      const updatedNightWakes = [...dailyLog.nightWakes];
      const lastWakeIndex = updatedNightWakes.length - 1;
      const lastWake = updatedNightWakes[lastWakeIndex];
      
      // Calculate duration awake in minutes
      const durationAwake = Math.round((now - (lastWake.wakeTimestamp || now)) / 60000);
      
      updatedNightWakes[lastWakeIndex] = {
        ...lastWake,
        backToSleepTime: backToSleepStr,
        backToSleepTimestamp: now,
        durationAwake,
        fed: args.fed,
        notes: args.notes,
      };
      
      await ctx.db.patch(dailyLog._id, {
        nightWakes: updatedNightWakes,
        updatedAt: now,
      });
    }
    
    return { backToSleepTime: backToSleepStr };
  },
});

// End the sleep session (morning wake up)
export const endSleep = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    wakeTime: v.optional(v.string()), // HH:MM - if not provided, uses current time
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const currentDate = new Date(now);
    const wakeTimeStr = args.wakeTime || 
      `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    
    // Get active sleep session
    const sleepSession = await ctx.db
      .query("activeSleepSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (!sleepSession) {
      throw new Error("No active sleep session found");
    }
    
    // Calculate total sleep duration
    const totalSleepMs = now - sleepSession.startTime;
    const totalSleepMin = Math.round(totalSleepMs / 60000);
    
    // Update TODAY's daily log with the wake time
    // (The sleep session might have started yesterday)
    const todayLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    if (todayLog) {
      await ctx.db.patch(todayLog._id, {
        wakeTime: wakeTimeStr,
        updatedAt: now,
      });
    } else {
      // Create today's log with the wake time
      await ctx.db.insert("dailyLogs", {
        userId: args.userId,
        childId: args.childId,
        date: today,
        naps: [],
        meals: [],
        bottles: [],
        wakeTime: wakeTimeStr,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    // Delete the active sleep session
    await ctx.db.delete(sleepSession._id);
    
    return {
      wakeTime: wakeTimeStr,
      totalSleepMinutes: totalSleepMin,
      bedtime: sleepSession.bedtimeStr,
    };
  },
});

// Get sleep summary/insights
export const getSleepInsights = query({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    // Get active sleep session
    const activeSleep = await ctx.db
      .query("activeSleepSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (!activeSleep) {
      return null;
    }
    
    // Get the daily log for sleep stats
    const dailyLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", activeSleep.date)
      )
      .first();
    
    // Get recent sleep data for comparison (last 7 nights)
    const recentLogs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(7);
    
    // Calculate average night wakes
    const logsWithNightWakes = recentLogs.filter(l => l.nightWakes && l.nightWakes.length > 0);
    const avgNightWakes = logsWithNightWakes.length > 0
      ? logsWithNightWakes.reduce((sum, l) => sum + (l.nightWakes?.length || 0), 0) / logsWithNightWakes.length
      : 0;
    
    // Calculate average wake time based on night wakes
    const avgAwakeDurations = recentLogs.flatMap(l => 
      (l.nightWakes || []).filter(nw => nw.durationAwake).map(nw => nw.durationAwake!)
    );
    const avgAwakeDuration = avgAwakeDurations.length > 0
      ? avgAwakeDurations.reduce((a, b) => a + b, 0) / avgAwakeDurations.length
      : 0;
    
    return {
      activeSleep,
      todayNightWakes: dailyLog?.nightWakes || [],
      patterns: {
        avgNightWakes: Math.round(avgNightWakes * 10) / 10,
        avgAwakeDurationMin: Math.round(avgAwakeDuration),
      },
    };
  },
});

// Estimate morning wake time based on typical sleep needs
export const getMorningWakeEstimate = query({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    // Get active sleep session
    const activeSleep = await ctx.db
      .query("activeSleepSessions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .first();
    
    if (!activeSleep) {
      return null;
    }
    
    // Get child for age
    const child = await ctx.db.get(args.childId);
    if (!child) return null;
    
    // Calculate age in months
    const birthDate = new Date(child.birthDate);
    const now = new Date();
    let ageMonths = (now.getFullYear() - birthDate.getFullYear()) * 12;
    ageMonths += now.getMonth() - birthDate.getMonth();
    if (now.getDate() < birthDate.getDate()) ageMonths--;
    ageMonths = Math.max(0, ageMonths);
    
    // Typical night sleep needs by age (in hours)
    // Based on pediatric sleep research
    let targetNightSleepHours: number;
    if (ageMonths <= 3) {
      targetNightSleepHours = 8; // Very variable at this age
    } else if (ageMonths <= 6) {
      targetNightSleepHours = 10;
    } else if (ageMonths <= 12) {
      targetNightSleepHours = 11;
    } else if (ageMonths <= 24) {
      targetNightSleepHours = 11;
    } else {
      targetNightSleepHours = 10.5;
    }
    
    // Calculate estimated wake time
    const targetNightSleepMs = targetNightSleepHours * 60 * 60 * 1000;
    const estimatedWakeTimestamp = activeSleep.startTime + targetNightSleepMs;
    const estimatedWakeDate = new Date(estimatedWakeTimestamp);
    
    const estimatedWakeTime = `${String(estimatedWakeDate.getHours()).padStart(2, '0')}:${String(estimatedWakeDate.getMinutes()).padStart(2, '0')}`;
    
    // Calculate current progress
    const elapsed = Date.now() - activeSleep.startTime;
    const percentComplete = Math.min(100, Math.round((elapsed / targetNightSleepMs) * 100));
    
    return {
      estimatedWakeTime,
      estimatedWakeTimestamp,
      targetNightSleepHours,
      percentComplete,
      ageMonths,
    };
  },
});
