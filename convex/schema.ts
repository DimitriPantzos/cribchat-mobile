import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Caregiver roles
const caregiverRole = v.union(
  v.literal("owner"),
  v.literal("parent"),
  v.literal("nanny"),
  v.literal("grandparent"),
  v.literal("other")
);

// Subscription status
const subscriptionStatus = v.union(
  v.literal("trialing"),
  v.literal("active"),
  v.literal("canceled"),
  v.literal("past_due"),
  v.literal("unpaid"),
  v.literal("incomplete"),
  v.literal("incomplete_expired")
);

export default defineSchema({
  // User profiles (linked to Clerk user ID)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // Stripe subscriptions
  subscriptions: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    status: subscriptionStatus,
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    trialStart: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),

  // Caregivers - who has access to which child
  caregivers: defineTable({
    childId: v.id("children"),
    userId: v.id("users"),
    role: caregiverRole,
    invitedBy: v.optional(v.id("users")), // null for owner
    createdAt: v.number(),
  })
    .index("by_child", ["childId"])
    .index("by_user", ["userId"])
    .index("by_child_user", ["childId", "userId"]),

  // Invites - shareable links to give access
  invites: defineTable({
    code: v.string(), // unique invite code
    childId: v.id("children"),
    createdBy: v.id("users"),
    role: caregiverRole, // what role the invite grants
    expiresAt: v.number(), // timestamp
    usedBy: v.optional(v.id("users")), // who accepted
    usedAt: v.optional(v.number()), // when accepted
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_child", ["childId"]),

  // Children profiles
  children: defineTable({
    userId: v.id("users"),
    name: v.string(),
    birthDate: v.string(), // ISO date string
    currentSchedule: v.optional(v.object({
      wakeTime: v.string(),
      bedtime: v.string(),
      naps: v.number(),
      feedsPerNight: v.number(),
    })),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Chat messages
  messages: defineTable({
    userId: v.id("users"),
    childId: v.optional(v.id("children")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Sleep logs
  sleepLogs: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    date: v.string(), // ISO date
    wakeUps: v.array(v.object({
      time: v.string(),
      duration: v.number(), // minutes
      fed: v.boolean(),
      notes: v.optional(v.string()),
    })),
    bedtime: v.optional(v.string()),
    wakeTime: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_child", ["childId"]),

  // AI-generated conversation summaries
  summaries: defineTable({
    userId: v.id("users"),
    date: v.string(), // ISO date YYYY-MM-DD
    keyPoints: v.array(v.object({
      type: v.union(
        v.literal("action"), // What they did: "Fed at 2am"
        v.literal("outcome"), // What happened: "Settled after 10 min"
        v.literal("advice"), // AI suggestion: "Try earlier bedtime"
        v.literal("insight") // Pattern/learning: "Overtired from short nap"
      ),
      text: v.string(),
      emoji: v.optional(v.string()),
    })),
    summary: v.optional(v.string()), // One-line summary
    createdAt: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  // Cry Timer sessions (Ferber sleep training)
  crySessions: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    startTime: v.number(), // timestamp when session started
    endTime: v.optional(v.number()), // timestamp when session ended
    intervalsCompleted: v.number(), // how many intervals were completed
    intervals: v.array(v.number()), // the intervals used (in minutes)
    totalDurationMin: v.number(), // total duration in minutes
    outcome: v.union(
      v.literal("asleep"), // baby fell asleep
      v.literal("comforted"), // parent stopped to comfort
      v.literal("stopped") // parent stopped the session
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_child", ["childId"]).index("by_user", ["userId"]),

  // Daily schedule logs (naps, meals, bottles - unified tracking)
  dailyLogs: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    date: v.string(), // ISO date YYYY-MM-DD
    
    // Naps - array of nap entries
    naps: v.array(v.object({
      startTime: v.string(), // HH:MM format
      endTime: v.optional(v.string()), // HH:MM format (optional if nap in progress)
      duration: v.optional(v.number()), // minutes (calculated when ended)
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
    })),
    
    // Solid food meals
    meals: v.array(v.object({
      time: v.string(), // HH:MM format
      type: v.union(
        v.literal("breakfast"),
        v.literal("lunch"),
        v.literal("dinner"),
        v.literal("snack")
      ),
      foods: v.optional(v.array(v.string())), // what they ate
      amount: v.optional(v.union(
        v.literal("full"),
        v.literal("most"),
        v.literal("half"),
        v.literal("little"),
        v.literal("refused")
      )),
      notes: v.optional(v.string()),
    })),
    
    // Bottle/breast feedings
    bottles: v.array(v.object({
      time: v.string(), // HH:MM format
      type: v.union(
        v.literal("bottle"),
        v.literal("breast"),
        v.literal("both")
      ),
      amount: v.optional(v.number()), // oz for bottles
      duration: v.optional(v.number()), // minutes for breastfeeding
      notes: v.optional(v.string()),
    })),
    
    // Diaper changes
    diapers: v.optional(v.array(v.object({
      time: v.string(), // HH:MM format
      type: v.union(
        v.literal("wet"),
        v.literal("dirty"),
        v.literal("both")
      ),
      notes: v.optional(v.string()),
    }))),
    
    // Morning wake time
    wakeTime: v.optional(v.string()),
    
    // Night bedtime
    bedtime: v.optional(v.string()),
    
    // Bedtime routine tracking
    bedtimeRoutineDuration: v.optional(v.number()), // minutes it took to get baby to sleep
    bedtimeLocation: v.optional(v.union(
      v.literal("crib"),
      v.literal("arms"),
      v.literal("rocker"),
      v.literal("bed"),
      v.literal("other")
    )),
    
    // Night wakes (when baby wakes during the night, before morning)
    nightWakes: v.optional(v.array(v.object({
      wakeTime: v.string(), // HH:MM when baby woke
      wakeTimestamp: v.number(), // Unix timestamp for duration calculation
      backToSleepTime: v.optional(v.string()), // HH:MM when went back to sleep
      backToSleepTimestamp: v.optional(v.number()), // Unix timestamp
      durationAwake: v.optional(v.number()), // minutes awake
      fed: v.optional(v.boolean()), // was baby fed during this wake
      notes: v.optional(v.string()),
    }))),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_child_date", ["childId", "date"]).index("by_child", ["childId"]),

  // Active nap sessions (for real-time nap timer persistence)
  activeNapSessions: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    startTime: v.number(), // timestamp when nap started
    location: v.optional(v.union(
      v.literal("crib"),
      v.literal("stroller"),
      v.literal("car"),
      v.literal("carrier"),
      v.literal("contact"),
      v.literal("other")
    )),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_child", ["childId"]).index("by_user", ["userId"]),

  // Active bedtime sessions (for real-time bedtime timer persistence)
  activeBedtimeSessions: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    startTime: v.number(), // timestamp when bedtime routine started
    location: v.optional(v.union(
      v.literal("crib"),
      v.literal("arms"),
      v.literal("rocker"),
      v.literal("bed"),
      v.literal("other")
    )),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_child", ["childId"]).index("by_user", ["userId"]),

  // Active breastfeeding sessions (for real-time feeding timer persistence)
  activeBreastfeedingSessions: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    startTime: v.number(), // timestamp when feeding started
    side: v.optional(v.union(
      v.literal("left"),
      v.literal("right")
    )),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_child", ["childId"]).index("by_user", ["userId"]),

  // Active overnight sleep sessions (baby is sleeping - after bedtime logged, before morning wake)
  activeSleepSessions: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    startTime: v.number(), // timestamp when baby fell asleep (bedtime)
    bedtimeStr: v.string(), // HH:MM format for reference
    date: v.string(), // ISO date when sleep started
    location: v.optional(v.union(
      v.literal("crib"),
      v.literal("arms"),
      v.literal("rocker"),
      v.literal("bed"),
      v.literal("other")
    )),
    // Night wake state (if baby is currently awake during the night)
    isNightWake: v.optional(v.boolean()),
    nightWakeStartTime: v.optional(v.number()), // when the current night wake started
    createdAt: v.number(),
  }).index("by_child", ["childId"]).index("by_user", ["userId"]),

  // Target schedules (what the parent is aiming for)
  targetSchedules: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    
    // Wake/sleep targets
    targetWakeTime: v.string(), // HH:MM
    targetBedtime: v.string(), // HH:MM
    
    // Nap targets
    napCount: v.number(),
    napWindows: v.optional(v.array(v.object({
      earliest: v.string(), // HH:MM
      latest: v.string(), // HH:MM
      targetDuration: v.number(), // minutes
    }))),
    
    // Meal targets
    mealTimes: v.optional(v.object({
      breakfast: v.string(),
      lunch: v.string(),
      dinner: v.string(),
    })),
    
    // Bottle/feeding targets
    bottleCount: v.optional(v.number()),
    bottleTimes: v.optional(v.array(v.string())),
    nightFeeds: v.number(), // how many night feeds expected
    
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_child", ["childId"]),
});
