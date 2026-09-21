import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(
    v.object({
      _id: v.id("activityLedger"),
      actor: v.string(),
      kind: v.string(),
      summary: v.string(),
      details: v.optional(v.string()),
      at: v.number(),
    })
  ),
  handler: async (ctx, { workspaceId }) => {
    const events = await ctx.db
      .query("activityLedger")
      .withIndex("by_workspaceId_and_at", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(100);

    return events.map((e) => ({
      _id: e._id,
      actor: e.actor,
      kind: e.kind,
      summary: e.summary,
      details: e.details,
      at: e.at,
    }));
  },
});

export const listByProspect = query({
  args: { prospectId: v.id("prospects") },
  returns: v.array(
    v.object({
      _id: v.id("activityLedger"),
      actor: v.string(),
      kind: v.string(),
      summary: v.string(),
      details: v.optional(v.string()),
      at: v.number(),
    })
  ),
  handler: async (ctx, { prospectId }) => {
    const events = await ctx.db
      .query("activityLedger")
      .withIndex("by_prospectId_and_at", (q) => q.eq("prospectId", prospectId))
      .order("desc")
      .take(50);

    return events.map((e) => ({
      _id: e._id,
      actor: e.actor,
      kind: e.kind,
      summary: e.summary,
      details: e.details,
      at: e.at,
    }));
  },
});

export const recordEvent = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    prospectId: v.optional(v.id("prospects")),
    campaignId: v.optional(v.id("campaigns")),
    actor: v.string(),
    kind: v.string(),
    summary: v.string(),
    details: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("activityLedger", {
      workspaceId: args.workspaceId,
      prospectId: args.prospectId,
      campaignId: args.campaignId,
      actor: args.actor,
      kind: args.kind,
      summary: args.summary,
      details: args.details,
      at: Date.now(),
    });
    return null;
  },
});
