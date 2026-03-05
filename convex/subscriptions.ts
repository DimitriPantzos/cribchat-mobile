import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Subscription status type
const subscriptionStatus = v.union(
  v.literal("trialing"),
  v.literal("active"),
  v.literal("canceled"),
  v.literal("past_due"),
  v.literal("unpaid"),
  v.literal("incomplete"),
  v.literal("incomplete_expired")
);

// Get subscription by user ID
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get subscription by Stripe customer ID
export const getByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();
  },
});

// Get subscription by Stripe subscription ID
export const getByStripeSubscriptionId = query({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .first();
  },
});

// Check if user has active subscription (including trial)
export const isSubscribed = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) return false;

    // Active statuses
    const activeStatuses = ["trialing", "active"];
    if (!activeStatuses.includes(subscription.status)) return false;

    // Check if subscription is still valid (not past period end)
    const now = Date.now();
    if (subscription.currentPeriodEnd < now && subscription.status !== "trialing") {
      return false;
    }

    return true;
  },
});

// Create or update subscription from Stripe webhook
export const upsert = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        stripePriceId: args.stripePriceId,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        trialStart: args.trialStart,
        trialEnd: args.trialEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("subscriptions", {
      userId: args.userId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      trialStart: args.trialStart,
      trialEnd: args.trialEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update subscription status (for webhook events)
export const updateStatus = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: subscriptionStatus,
    cancelAtPeriodEnd: v.optional(v.boolean()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .first();

    if (!subscription) {
      throw new Error(`Subscription not found: ${args.stripeSubscriptionId}`);
    }

    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.cancelAtPeriodEnd !== undefined) {
      updates.cancelAtPeriodEnd = args.cancelAtPeriodEnd;
    }

    if (args.currentPeriodEnd !== undefined) {
      updates.currentPeriodEnd = args.currentPeriodEnd;
    }

    await ctx.db.patch(subscription._id, updates);
    return subscription._id;
  },
});

// Delete subscription (for subscription.deleted events)
export const remove = mutation({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .first();

    if (subscription) {
      await ctx.db.delete(subscription._id);
    }
  },
});

// Get user's subscription with user info (for API routes)
export const getSubscriptionWithUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return null;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return { user, subscription };
  },
});

// Check subscription status by Clerk ID (for middleware/client)
export const checkSubscriptionStatus = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return { hasAccess: false, status: null, isNewUser: true };
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!subscription) {
      return { hasAccess: false, status: null, isNewUser: false, userId: user._id };
    }

    const activeStatuses = ["trialing", "active"];
    const hasAccess = activeStatuses.includes(subscription.status);

    return {
      hasAccess,
      status: subscription.status,
      isNewUser: false,
      userId: user._id,
      trialEnd: subscription.trialEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  },
});

// Store Stripe customer ID for a user
export const setStripeCustomerId = mutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    // For now, we store this in the subscription record when created
    // This is just a helper if we need to update it
    return args.stripeCustomerId;
  },
});

// Get user by stripe customer ID (for webhook handling)
export const getUserByStripeCustomer = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (!subscription) return null;

    const user = await ctx.db.get(subscription.userId);
    return user;
  },
});

// Internal mutation for RevenueCat webhook updates
import { internalMutation } from "./_generated/server";

export const updateFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    status: v.string(),
    provider: v.string(),
    providerSubscriptionId: v.string(),
    productId: v.string(),
    expiresAt: v.optional(v.union(v.number(), v.null())),
    originalPurchaseDate: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      console.error("User not found for clerkId:", args.clerkId);
      return;
    }

    // Find existing subscription
    const existingSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const now = Date.now();
    const subData = {
      userId: user._id,
      status: args.status as "active" | "canceled" | "past_due" | "unpaid" | "incomplete" | "incomplete_expired" | "trialing",
      provider: args.provider,
      providerSubscriptionId: args.providerSubscriptionId,
      productId: args.productId,
      currentPeriodEnd: args.expiresAt || now + 30 * 24 * 60 * 60 * 1000,
      updatedAt: now,
    };

    if (existingSub) {
      await ctx.db.patch(existingSub._id, subData);
    } else {
      await ctx.db.insert("subscriptions", {
        ...subData,
        stripeCustomerId: "", // Not using Stripe for this subscription
        stripeSubscriptionId: args.providerSubscriptionId,
        stripePriceId: args.productId,
        currentPeriodStart: args.originalPurchaseDate || now,
        cancelAtPeriodEnd: args.status === "canceled",
        createdAt: now,
      });
    }
  },
});

// Internal mutation for Apple StoreKit updates
export const updateFromApple = internalMutation({
  args: {
    clerkId: v.string(),
    productId: v.string(),
    originalTransactionId: v.string(),
    expiresAt: v.number(),
    isTrialPeriod: v.boolean(),
    environment: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      console.error("User not found for clerkId:", args.clerkId);
      return;
    }

    // Find existing subscription
    const existingSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const now = Date.now();
    const status = args.isTrialPeriod ? "trialing" : "active";

    const subData = {
      userId: user._id,
      status: status as "active" | "trialing",
      provider: "apple",
      stripeSubscriptionId: args.originalTransactionId,
      stripePriceId: args.productId,
      stripeCustomerId: args.originalTransactionId,
      currentPeriodEnd: args.expiresAt,
      currentPeriodStart: now,
      cancelAtPeriodEnd: false,
      updatedAt: now,
    };

    if (existingSub) {
      await ctx.db.patch(existingSub._id, subData);
    } else {
      await ctx.db.insert("subscriptions", {
        ...subData,
        createdAt: now,
      });
    }

    console.log(`Subscription updated for user ${args.clerkId}: ${status}`);
  },
});
