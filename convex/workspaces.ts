import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateDefault = mutation({
  args: {},
  returns: v.object({
    _id: v.id("workspaces"),
    name: v.string(),
    slug: v.string(),
    defaultCurrency: v.string(),
    isDemo: v.boolean(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const ownerId = identity?.tokenIdentifier ?? "demo_operator_default";

    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .first();

    if (!workspace) {
      const now = Date.now();
      const workspaceId = await ctx.db.insert("workspaces", {
        name: "North American SMB Growth Desk",
        slug: "smb-growth-desk",
        ownerId,
        defaultCurrency: "CAD",
        isDemo: true,
        createdAt: now,
      });

      await ctx.db.insert("workspaceMembers", {
        workspaceId,
        tokenIdentifier: ownerId,
        email: identity?.email ?? "operator@storefrontdesk.local",
        name: identity?.name ?? "Primary Desk Operator",
        role: "owner",
        createdAt: now,
      });

      await ctx.db.insert("activityLedger", {
        workspaceId,
        actor: "system",
        kind: "workspace_created",
        summary: "Created default workspace: North American SMB Growth Desk",
        at: now,
      });

      workspace = await ctx.db.get(workspaceId);
    }

    if (!workspace) {
      throw new Error("Failed to initialize workspace");
    }

    return {
      _id: workspace._id,
      name: workspace.name,
      slug: workspace.slug,
      defaultCurrency: workspace.defaultCurrency,
      isDemo: workspace.isDemo,
    };
  },
});

export const get = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("workspaces"),
      name: v.string(),
      slug: v.string(),
      defaultCurrency: v.string(),
      isDemo: v.boolean(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { workspaceId }) => {
    const ws = await ctx.db.get(workspaceId);
    if (!ws) return null;
    return {
      _id: ws._id,
      name: ws.name,
      slug: ws.slug,
      defaultCurrency: ws.defaultCurrency,
      isDemo: ws.isDemo,
      createdAt: ws.createdAt,
    };
  },
});
