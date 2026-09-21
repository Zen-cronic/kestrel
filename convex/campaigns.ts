import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { campaignMode, campaignStatus } from "./schema";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(
    v.object({
      _id: v.id("campaigns"),
      name: v.string(),
      category: v.string(),
      location: v.string(),
      mode: campaignMode,
      status: campaignStatus,
      maxFollowups: v.number(),
      followupDelayDays: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { workspaceId }) => {
    const list = await ctx.db
      .query("campaigns")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(50);
    return list.map((c) => ({
      _id: c._id,
      name: c.name,
      category: c.category,
      location: c.location,
      mode: c.mode,
      status: c.status,
      maxFollowups: c.maxFollowups,
      followupDelayDays: c.followupDelayDays,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  },
});

export const get = query({
  args: { campaignId: v.id("campaigns") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("campaigns"),
      workspaceId: v.id("workspaces"),
      name: v.string(),
      category: v.string(),
      location: v.string(),
      mode: campaignMode,
      status: campaignStatus,
      maxFollowups: v.number(),
      followupDelayDays: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { campaignId }) => {
    const c = await ctx.db.get(campaignId);
    if (!c) return null;
    return {
      _id: c._id,
      workspaceId: c.workspaceId,
      name: c.name,
      category: c.category,
      location: c.location,
      mode: c.mode,
      status: c.status,
      maxFollowups: c.maxFollowups,
      followupDelayDays: c.followupDelayDays,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    category: v.string(),
    location: v.string(),
    mode: campaignMode,
  },
  returns: v.id("campaigns"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const campaignId = await ctx.db.insert("campaigns", {
      workspaceId: args.workspaceId,
      name: args.name,
      category: args.category,
      location: args.location,
      mode: args.mode,
      status: "active",
      maxFollowups: 2, // Hard ceiling of 2 followups
      followupDelayDays: 3,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: args.workspaceId,
      campaignId,
      actor: "operator",
      kind: "campaign_created",
      summary: `Created campaign "${args.name}" (${args.category} in ${args.location}) in ${args.mode} mode.`,
      at: now,
    });

    return campaignId;
  },
});

export const updateMode = mutation({
  args: {
    campaignId: v.id("campaigns"),
    mode: campaignMode,
  },
  returns: v.null(),
  handler: async (ctx, { campaignId, mode }) => {
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const prevMode = campaign.mode;
    if (prevMode === mode) return null;

    const now = Date.now();
    await ctx.db.patch(campaignId, {
      mode,
      updatedAt: now,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: campaign.workspaceId,
      campaignId,
      actor: "operator",
      kind: "campaign_mode_changed",
      summary: `Switched campaign mode from ${prevMode} to ${mode}. Policy active: ${
        mode === "manual"
          ? "Every outbound message requires explicit human approval."
          : "Assisted followups active (max 2 non-binding followups, automated cancellation on reply/pause)."
      }`,
      at: now,
    });

    return null;
  },
});
