import { mutation } from "./_generated/server";

// One-time migration: Add owner caregiver records for existing children
export const migrateChildrenToCaregivers = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all children
    const allChildren = await ctx.db.query("children").collect();
    
    let migrated = 0;
    let skipped = 0;
    
    for (const child of allChildren) {
      // Check if caregiver record already exists
      const existing = await ctx.db
        .query("caregivers")
        .withIndex("by_child_user", (q) => 
          q.eq("childId", child._id).eq("userId", child.userId)
        )
        .first();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Create owner caregiver record
      await ctx.db.insert("caregivers", {
        childId: child._id,
        userId: child.userId,
        role: "owner",
        createdAt: Date.now(),
      });
      
      migrated++;
    }
    
    return { migrated, skipped, total: allChildren.length };
  },
});
