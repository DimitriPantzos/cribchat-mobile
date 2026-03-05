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

// Generate a random invite code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create an invite
export const create = mutation({
  args: {
    childId: v.id("children"),
    createdBy: v.id("users"),
    role: roleValidator,
    expiresInDays: v.optional(v.number()), // defaults to 7
  },
  handler: async (ctx, args) => {
    // Check if user can invite
    const caregiver = await ctx.db
      .query("caregivers")
      .withIndex("by_child_user", (q) =>
        q.eq("childId", args.childId).eq("userId", args.createdBy)
      )
      .first();

    if (!caregiver || (caregiver.role !== "owner" && caregiver.role !== "parent")) {
      throw new Error("You don't have permission to invite caregivers");
    }

    // Can't create owner invites
    if (args.role === "owner") {
      throw new Error("Cannot create an invite for owner role");
    }

    const code = generateCode();
    const daysValid = args.expiresInDays ?? 7;
    const expiresAt = Date.now() + daysValid * 24 * 60 * 60 * 1000;

    await ctx.db.insert("invites", {
      code,
      childId: args.childId,
      createdBy: args.createdBy,
      role: args.role,
      expiresAt,
      createdAt: Date.now(),
    });

    return code;
  },
});

// Get invite by code
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!invite) return null;

    // Get child and creator info
    const child = await ctx.db.get(invite.childId);
    const creator = await ctx.db.get(invite.createdBy);

    return {
      ...invite,
      child: child ? { name: child.name, birthDate: child.birthDate } : null,
      creatorName: creator?.name || creator?.email || "Someone",
      isExpired: invite.expiresAt < Date.now(),
      isUsed: !!invite.usedBy,
    };
  },
});

// Accept an invite
export const accept = mutation({
  args: {
    code: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.usedBy) {
      throw new Error("This invite has already been used");
    }

    if (invite.expiresAt < Date.now()) {
      throw new Error("This invite has expired");
    }

    // Check if user is the creator (can't invite yourself)
    if (invite.createdBy === args.userId) {
      throw new Error("You cannot accept your own invite");
    }

    // Check if user already has access
    const existingAccess = await ctx.db
      .query("caregivers")
      .withIndex("by_child_user", (q) =>
        q.eq("childId", invite.childId).eq("userId", args.userId)
      )
      .first();

    if (existingAccess) {
      throw new Error("You already have access to this child's profile");
    }

    // Add as caregiver
    await ctx.db.insert("caregivers", {
      childId: invite.childId,
      userId: args.userId,
      role: invite.role,
      invitedBy: invite.createdBy,
      createdAt: Date.now(),
    });

    // Mark invite as used
    await ctx.db.patch(invite._id, {
      usedBy: args.userId,
      usedAt: Date.now(),
    });

    return invite.childId;
  },
});

// Get invites for a child
export const getByChild = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(20);

    // Enrich with user info
    const enriched = await Promise.all(
      invites.map(async (invite) => {
        let usedByUser = null;
        if (invite.usedBy) {
          const user = await ctx.db.get(invite.usedBy);
          usedByUser = user ? { name: user.name, email: user.email } : null;
        }
        return {
          ...invite,
          usedByUser,
          isExpired: invite.expiresAt < Date.now(),
          isUsed: !!invite.usedBy,
        };
      })
    );

    return enriched;
  },
});

// Delete/revoke an invite
export const revoke = mutation({
  args: {
    inviteId: v.id("invites"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) return;

    // Check if user has permission (must be owner/parent of child)
    const caregiver = await ctx.db
      .query("caregivers")
      .withIndex("by_child_user", (q) =>
        q.eq("childId", invite.childId).eq("userId", args.userId)
      )
      .first();

    if (!caregiver || (caregiver.role !== "owner" && caregiver.role !== "parent")) {
      throw new Error("You don't have permission to revoke this invite");
    }

    await ctx.db.delete(args.inviteId);
  },
});
