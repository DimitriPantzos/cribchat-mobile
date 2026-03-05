import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get today's log for a child (creates if doesn't exist)
export const getOrCreateToday = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    const existing = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    if (existing) {
      return existing;
    }
    
    // Create new log for today
    const now = Date.now();
    const id = await ctx.db.insert("dailyLogs", {
      userId: args.userId,
      childId: args.childId,
      date: today,
      naps: [],
      meals: [],
      bottles: [],
      createdAt: now,
      updatedAt: now,
    });
    
    return await ctx.db.get(id);
  },
});

// Get log for a specific date
export const getByDate = query({
  args: {
    childId: v.id("children"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", args.date)
      )
      .first();
  },
});

// Get recent logs for a child
export const getRecent = query({
  args: {
    childId: v.id("children"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 7;
    return await ctx.db
      .query("dailyLogs")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(limit);
  },
});

// Log a nap
export const logNap = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    startTime: v.string(),
    endTime: v.optional(v.string()),
    location: v.optional(v.union(
      v.literal("crib"),
      v.literal("stroller"),
      v.literal("car"),
      v.literal("carrier"),
      v.literal("contact"),
      v.literal("other")
    )),
    quality: v.optional(v.union(
      v.literal("great"),
      v.literal("okay"),
      v.literal("rough")
    )),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    let log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    const now = Date.now();
    
    // Calculate duration if end time provided
    let duration: number | undefined;
    if (args.endTime) {
      const [startH, startM] = args.startTime.split(':').map(Number);
      const [endH, endM] = args.endTime.split(':').map(Number);
      duration = (endH * 60 + endM) - (startH * 60 + startM);
      if (duration < 0) duration += 24 * 60; // Handle overnight
    }
    
    const napEntry = {
      startTime: args.startTime,
      endTime: args.endTime,
      duration,
      location: args.location,
      quality: args.quality,
      notes: args.notes,
    };
    
    if (log) {
      await ctx.db.patch(log._id, {
        naps: [...log.naps, napEntry],
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("dailyLogs", {
        userId: args.userId,
        childId: args.childId,
        date: today,
        naps: [napEntry],
        meals: [],
        bottles: [],
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// End an active nap
export const endNap = mutation({
  args: {
    childId: v.id("children"),
    napIndex: v.number(),
    endTime: v.string(),
    quality: v.optional(v.union(
      v.literal("great"),
      v.literal("okay"),
      v.literal("rough")
    )),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    const log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    if (!log || !log.naps[args.napIndex]) return;
    
    const nap = log.naps[args.napIndex];
    const [startH, startM] = nap.startTime.split(':').map(Number);
    const [endH, endM] = args.endTime.split(':').map(Number);
    let duration = (endH * 60 + endM) - (startH * 60 + startM);
    if (duration < 0) duration += 24 * 60;
    
    const updatedNaps = [...log.naps];
    updatedNaps[args.napIndex] = {
      ...nap,
      endTime: args.endTime,
      duration,
      quality: args.quality || nap.quality,
    };
    
    await ctx.db.patch(log._id, {
      naps: updatedNaps,
      updatedAt: Date.now(),
    });
  },
});

// Log a meal
export const logMeal = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    time: v.string(),
    type: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner"),
      v.literal("snack")
    ),
    foods: v.optional(v.array(v.string())),
    amount: v.optional(v.union(
      v.literal("full"),
      v.literal("most"),
      v.literal("half"),
      v.literal("little"),
      v.literal("refused")
    )),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    let log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    const now = Date.now();
    
    const mealEntry = {
      time: args.time,
      type: args.type,
      foods: args.foods,
      amount: args.amount,
      notes: args.notes,
    };
    
    if (log) {
      await ctx.db.patch(log._id, {
        meals: [...log.meals, mealEntry],
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("dailyLogs", {
        userId: args.userId,
        childId: args.childId,
        date: today,
        naps: [],
        meals: [mealEntry],
        bottles: [],
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Log a bottle/feeding
export const logBottle = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    time: v.string(),
    type: v.union(
      v.literal("bottle"),
      v.literal("breast"),
      v.literal("both")
    ),
    amount: v.optional(v.number()), // oz
    duration: v.optional(v.number()), // minutes
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    let log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    const now = Date.now();
    
    const bottleEntry = {
      time: args.time,
      type: args.type,
      amount: args.amount,
      duration: args.duration,
      notes: args.notes,
    };
    
    if (log) {
      await ctx.db.patch(log._id, {
        bottles: [...log.bottles, bottleEntry],
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("dailyLogs", {
        userId: args.userId,
        childId: args.childId,
        date: today,
        naps: [],
        meals: [],
        bottles: [bottleEntry],
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Log a diaper change
export const logDiaper = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    time: v.string(),
    type: v.union(
      v.literal("wet"),
      v.literal("dirty"),
      v.literal("both")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    let log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    const now = Date.now();
    
    const diaperEntry = {
      time: args.time,
      type: args.type,
      notes: args.notes,
    };
    
    if (log) {
      const existingDiapers = log.diapers || [];
      await ctx.db.patch(log._id, {
        diapers: [...existingDiapers, diaperEntry],
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("dailyLogs", {
        userId: args.userId,
        childId: args.childId,
        date: today,
        naps: [],
        meals: [],
        bottles: [],
        diapers: [diaperEntry],
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Set wake time
export const setWakeTime = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    wakeTime: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    let log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    const now = Date.now();
    
    if (log) {
      await ctx.db.patch(log._id, {
        wakeTime: args.wakeTime,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("dailyLogs", {
        userId: args.userId,
        childId: args.childId,
        date: today,
        naps: [],
        meals: [],
        bottles: [],
        wakeTime: args.wakeTime,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Set bedtime
export const setBedtime = mutation({
  args: {
    userId: v.id("users"),
    childId: v.id("children"),
    bedtime: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    let log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    const now = Date.now();
    
    if (log) {
      await ctx.db.patch(log._id, {
        bedtime: args.bedtime,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("dailyLogs", {
        userId: args.userId,
        childId: args.childId,
        date: today,
        naps: [],
        meals: [],
        bottles: [],
        bedtime: args.bedtime,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Delete an entry
export const deleteEntry = mutation({
  args: {
    childId: v.id("children"),
    entryType: v.union(v.literal("nap"), v.literal("meal"), v.literal("bottle"), v.literal("diaper")),
    index: v.number(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    const log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    if (!log) return;
    
    const updates: Record<string, unknown[]> = {};
    
    if (args.entryType === "nap") {
      updates.naps = log.naps.filter((_, i) => i !== args.index);
    } else if (args.entryType === "meal") {
      updates.meals = log.meals.filter((_, i) => i !== args.index);
    } else if (args.entryType === "bottle") {
      updates.bottles = log.bottles.filter((_, i) => i !== args.index);
    } else if (args.entryType === "diaper") {
      updates.diapers = (log.diapers || []).filter((_, i) => i !== args.index);
    }
    
    await ctx.db.patch(log._id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Update an entry
export const updateEntry = mutation({
  args: {
    childId: v.id("children"),
    entryType: v.union(v.literal("nap"), v.literal("meal"), v.literal("bottle"), v.literal("diaper")),
    index: v.number(),
    updates: v.object({
      // Nap fields
      startTime: v.optional(v.string()),
      endTime: v.optional(v.string()),
      location: v.optional(v.union(
        v.literal("crib"),
        v.literal("stroller"),
        v.literal("car"),
        v.literal("carrier"),
        v.literal("contact"),
        v.literal("other")
      )),
      quality: v.optional(v.union(
        v.literal("great"),
        v.literal("okay"),
        v.literal("rough")
      )),
      // Meal fields
      type: v.optional(v.string()),
      foods: v.optional(v.array(v.string())),
      // Bottle fields
      amount: v.optional(v.number()),
      // Common
      time: v.optional(v.string()),
      notes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    const log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    if (!log) return;
    
    const now = Date.now();
    
    if (args.entryType === "nap" && log.naps[args.index]) {
      const updatedNaps = [...log.naps];
      const nap = { ...updatedNaps[args.index] };
      
      if (args.updates.startTime !== undefined) nap.startTime = args.updates.startTime;
      if (args.updates.endTime !== undefined) nap.endTime = args.updates.endTime;
      if (args.updates.location !== undefined) nap.location = args.updates.location;
      if (args.updates.quality !== undefined) nap.quality = args.updates.quality;
      if (args.updates.notes !== undefined) nap.notes = args.updates.notes;
      
      // Recalculate duration if times changed
      if (nap.startTime && nap.endTime) {
        const [startH, startM] = nap.startTime.split(':').map(Number);
        const [endH, endM] = nap.endTime.split(':').map(Number);
        let duration = (endH * 60 + endM) - (startH * 60 + startM);
        if (duration < 0) duration += 24 * 60;
        nap.duration = duration;
      }
      
      updatedNaps[args.index] = nap;
      await ctx.db.patch(log._id, { naps: updatedNaps, updatedAt: now });
      
    } else if (args.entryType === "bottle" && log.bottles[args.index]) {
      const updatedBottles = [...log.bottles];
      const bottle = { ...updatedBottles[args.index] };
      
      if (args.updates.time !== undefined) bottle.time = args.updates.time;
      if (args.updates.amount !== undefined) bottle.amount = args.updates.amount;
      if (args.updates.type !== undefined) bottle.type = args.updates.type as "bottle" | "breast" | "both";
      if (args.updates.notes !== undefined) bottle.notes = args.updates.notes;
      
      updatedBottles[args.index] = bottle;
      await ctx.db.patch(log._id, { bottles: updatedBottles, updatedAt: now });
      
    } else if (args.entryType === "meal" && log.meals[args.index]) {
      const updatedMeals = [...log.meals];
      const meal = { ...updatedMeals[args.index] };
      
      if (args.updates.time !== undefined) meal.time = args.updates.time;
      if (args.updates.type !== undefined) meal.type = args.updates.type as "breakfast" | "lunch" | "dinner" | "snack";
      if (args.updates.foods !== undefined) meal.foods = args.updates.foods;
      if (args.updates.notes !== undefined) meal.notes = args.updates.notes;
      
      updatedMeals[args.index] = meal;
      await ctx.db.patch(log._id, { meals: updatedMeals, updatedAt: now });
      
    } else if (args.entryType === "diaper" && log.diapers?.[args.index]) {
      const updatedDiapers = [...(log.diapers || [])];
      const diaper = { ...updatedDiapers[args.index] };
      
      if (args.updates.time !== undefined) diaper.time = args.updates.time;
      if (args.updates.type !== undefined) diaper.type = args.updates.type as "wet" | "dirty" | "both";
      if (args.updates.notes !== undefined) diaper.notes = args.updates.notes;
      
      updatedDiapers[args.index] = diaper;
      await ctx.db.patch(log._id, { diapers: updatedDiapers, updatedAt: now });
    }
  },
});

// Get schedule summary for AI context
export const getScheduleSummary = query({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    const todayLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child_date", (q) => 
        q.eq("childId", args.childId).eq("date", today)
      )
      .first();
    
    // Get last 7 days for patterns
    const recentLogs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(7);
    
    // Calculate averages
    const logsWithNaps = recentLogs.filter(l => l.naps.length > 0);
    const avgNapCount = logsWithNaps.length > 0
      ? logsWithNaps.reduce((sum, l) => sum + l.naps.length, 0) / logsWithNaps.length
      : 0;
    
    const allNapDurations = recentLogs.flatMap(l => 
      l.naps.filter(n => n.duration).map(n => n.duration!)
    );
    const avgNapDuration = allNapDurations.length > 0
      ? allNapDurations.reduce((a, b) => a + b, 0) / allNapDurations.length
      : 0;
    
    const logsWithBottles = recentLogs.filter(l => l.bottles.length > 0);
    const avgBottleCount = logsWithBottles.length > 0
      ? logsWithBottles.reduce((sum, l) => sum + l.bottles.length, 0) / logsWithBottles.length
      : 0;
    
    return {
      today: todayLog,
      patterns: {
        avgNapCount: Math.round(avgNapCount * 10) / 10,
        avgNapDurationMin: Math.round(avgNapDuration),
        avgBottleCount: Math.round(avgBottleCount * 10) / 10,
        daysTracked: recentLogs.length,
      },
    };
  },
});
