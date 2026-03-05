import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add a child (and make the creator the owner)
export const add = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    birthDate: v.string(),
    currentSchedule: v.optional(v.object({
      wakeTime: v.string(),
      bedtime: v.string(),
      naps: v.number(),
      feedsPerNight: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const childId = await ctx.db.insert("children", {
      userId: args.userId,
      name: args.name,
      birthDate: args.birthDate,
      currentSchedule: args.currentSchedule,
      createdAt: Date.now(),
    });

    // Add creator as owner in caregivers table
    await ctx.db.insert("caregivers", {
      childId,
      userId: args.userId,
      role: "owner",
      createdAt: Date.now(),
    });

    return childId;
  },
});

// Get children for a user (owned + shared)
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all caregiver roles for this user
    const caregiverRoles = await ctx.db
      .query("caregivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all children with role info
    const children = await Promise.all(
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

    return children.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

// Get a single child by ID
export const get = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.childId);
  },
});

// Update a child's info
export const update = mutation({
  args: {
    childId: v.id("children"),
    name: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    currentSchedule: v.optional(v.object({
      wakeTime: v.string(),
      bedtime: v.string(),
      naps: v.number(),
      feedsPerNight: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { childId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(childId, filteredUpdates);
  },
});

// Update child schedule
export const updateSchedule = mutation({
  args: {
    childId: v.id("children"),
    schedule: v.object({
      wakeTime: v.string(),
      bedtime: v.string(),
      naps: v.number(),
      feedsPerNight: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.childId, {
      currentSchedule: args.schedule,
    });
  },
});

// Delete a child
export const remove = mutation({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.childId);
  },
});

// Calculate wake windows based on age in months
export function calculateWakeWindows(ageInMonths: number) {
  if (ageInMonths < 3) {
    return { first: "1:00", second: "1:15", third: "1:15", fourth: "1:30", naps: 4 };
  } else if (ageInMonths < 5) {
    return { first: "1:30", second: "1:45", third: "2:00", fourth: "2:00", naps: 4 };
  } else if (ageInMonths < 7) {
    return { first: "2:00", second: "2:30", third: "2:30", naps: 3 };
  } else if (ageInMonths < 10) {
    return { first: "2:30", second: "3:00", third: "3:00", naps: 2 };
  } else if (ageInMonths < 14) {
    return { first: "3:00", second: "3:30", third: "3:30", naps: 2 };
  } else if (ageInMonths < 18) {
    return { first: "4:00", second: "5:00", naps: 1 };
  } else {
    return { first: "5:00", second: "5:30", naps: 1 };
  }
}

// Get age description from birthdate
export function getAgeFromBirthdate(birthDate: string): { months: number; display: string } {
  const birth = new Date(birthDate);
  const now = new Date();
  
  let months = (now.getFullYear() - birth.getFullYear()) * 12;
  months += now.getMonth() - birth.getMonth();
  
  if (now.getDate() < birth.getDate()) {
    months--;
  }
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years > 0) {
    return {
      months,
      display: years === 1 
        ? `${years} year${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`
        : `${years} years${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`
    };
  }
  return {
    months,
    display: `${months} month${months !== 1 ? 's' : ''}`
  };
}
