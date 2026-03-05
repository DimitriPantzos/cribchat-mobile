import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Caregiver role type
const roleValidator = v.union(
  v.literal("owner"),
  v.literal("parent"),
  v.literal("nanny"),
  v.literal("grandparent"),
  v.literal("other")
);

// Get all caregivers for a child
export const getByChild = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const caregivers = await ctx.db
      .query("caregivers")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();

    // Enrich with user info
    const enriched = await Promise.all(
      caregivers.map(async (caregiver) => {
        const user = await ctx.db.get(caregiver.userId);
        return {
          ...caregiver,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );

    return enriched;
  },
});

// Get all children a user has access to (owned + shared)
export const getChildrenForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const caregiverRoles = await ctx.db
      .query("caregivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all children with their roles
    const childrenWithRoles = await Promise.all(
      caregiverRoles.map(async (role) => {
        const child = await ctx.db.get(role.childId);
        if (!child) return null;

        // Get owner info if this is a shared child
        let ownerName: string | null = null;
        if (role.role !== "owner") {
          const ownerRole = await ctx.db
            .query("caregivers")
            .withIndex("by_child", (q) => q.eq("childId", role.childId))
            .filter((q) => q.eq(q.field("role"), "owner"))
            .first();
          if (ownerRole) {
            const owner = await ctx.db.get(ownerRole.userId);
            ownerName = owner?.name || owner?.email || null;
          }
        }

        return {
          ...child,
          myRole: role.role,
          ownerName,
          isShared: role.role !== "owner",
        };
      })
    );

    return childrenWithRoles.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

// Check if user has access to a child and return their role
export const getUserRole = query({
  args: {
    childId: v.id("children"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const caregiver = await ctx.db
      .query("caregivers")
      .withIndex("by_child_user", (q) =>
        q.eq("childId", args.childId).eq("userId", args.userId)
      )
      .first();

    return caregiver?.role || null;
  },
});

// Add a caregiver (used when accepting invite or creating child)
export const add = mutation({
  args: {
    childId: v.id("children"),
    userId: v.id("users"),
    role: roleValidator,
    invitedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check if already exists
    const existing = await ctx.db
      .query("caregivers")
      .withIndex("by_child_user", (q) =>
        q.eq("childId", args.childId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("caregivers", {
      childId: args.childId,
      userId: args.userId,
      role: args.role,
      invitedBy: args.invitedBy,
      createdAt: Date.now(),
    });
  },
});

// Remove a caregiver (owner only)
export const remove = mutation({
  args: {
    childId: v.id("children"),
    caregiverId: v.id("caregivers"),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if requester is owner
    const requesterRole = await ctx.db
      .query("caregivers")
      .withIndex("by_child_user", (q) =>
        q.eq("childId", args.childId).eq("userId", args.requestingUserId)
      )
      .first();

    if (!requesterRole || requesterRole.role !== "owner") {
      throw new Error("Only the owner can remove caregivers");
    }

    // Can't remove self if owner
    const toRemove = await ctx.db.get(args.caregiverId);
    if (toRemove?.role === "owner") {
      throw new Error("Cannot remove the owner");
    }

    await ctx.db.delete(args.caregiverId);
  },
});

// Check permissions helper
export const canInvite = query({
  args: {
    childId: v.id("children"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const caregiver = await ctx.db
      .query("caregivers")
      .withIndex("by_child_user", (q) =>
        q.eq("childId", args.childId).eq("userId", args.userId)
      )
      .first();

    // Owner and parent can invite
    return caregiver?.role === "owner" || caregiver?.role === "parent";
  },
});

// Can delete child (owner only)
export const canDelete = query({
  args: {
    childId: v.id("children"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const caregiver = await ctx.db
      .query("caregivers")
      .withIndex("by_child_user", (q) =>
        q.eq("childId", args.childId).eq("userId", args.userId)
      )
      .first();

    return caregiver?.role === "owner";
  },
});

// Role display helper
export const getRoleEmoji = (role: string): string => {
  switch (role) {
    case "owner":
      return "👑";
    case "parent":
      return "👨‍👩‍👧";
    case "nanny":
      return "👩‍🍼";
    case "grandparent":
      return "👴";
    default:
      return "👤";
  }
};

export const getRoleLabel = (role: string): string => {
  switch (role) {
    case "owner":
      return "Owner";
    case "parent":
      return "Parent";
    case "nanny":
      return "Nanny";
    case "grandparent":
      return "Grandparent";
    default:
      return "Caregiver";
  }
};
