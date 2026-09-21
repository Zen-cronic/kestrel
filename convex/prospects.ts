import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { outreachStatus, prospectApprovalStatus } from "./schema";

export const listByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  returns: v.array(
    v.object({
      _id: v.id("prospects"),
      name: v.string(),
      vertical: v.string(),
      address: v.string(),
      phone: v.optional(v.string()),
      targetEmail: v.string(),
      contactName: v.optional(v.string()),
      approvalStatus: prospectApprovalStatus,
      outreachStatus: outreachStatus,
      currentBriefId: v.optional(v.id("businessBriefs")),
      currentWebsiteSpecId: v.optional(v.id("websiteSpecs")),
      currentDraftId: v.optional(v.id("outreachDrafts")),
      currentProposalId: v.optional(v.id("proposals")),
      followupCount: v.number(),
      isSuppressed: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { campaignId }) => {
    const list = await ctx.db
      .query("prospects")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", campaignId))
      .order("desc")
      .take(50);
    return list.map((p) => ({
      _id: p._id,
      name: p.name,
      vertical: p.vertical,
      address: p.address,
      phone: p.phone,
      targetEmail: p.targetEmail,
      contactName: p.contactName,
      approvalStatus: p.approvalStatus,
      outreachStatus: p.outreachStatus,
      currentBriefId: p.currentBriefId,
      currentWebsiteSpecId: p.currentWebsiteSpecId,
      currentDraftId: p.currentDraftId,
      currentProposalId: p.currentProposalId,
      followupCount: p.followupCount,
      isSuppressed: p.isSuppressed,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  },
});

export const get = query({
  args: { prospectId: v.id("prospects") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("prospects"),
      workspaceId: v.id("workspaces"),
      campaignId: v.id("campaigns"),
      name: v.string(),
      vertical: v.string(),
      address: v.string(),
      phone: v.optional(v.string()),
      targetEmail: v.string(),
      contactName: v.optional(v.string()),
      approvalStatus: prospectApprovalStatus,
      outreachStatus: outreachStatus,
      currentBriefId: v.optional(v.id("businessBriefs")),
      currentWebsiteSpecId: v.optional(v.id("websiteSpecs")),
      currentDraftId: v.optional(v.id("outreachDrafts")),
      currentProposalId: v.optional(v.id("proposals")),
      activeThreadId: v.optional(v.string()),
      followupCount: v.number(),
      isSuppressed: v.boolean(),
      suppressionReason: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { prospectId }) => {
    const p = await ctx.db.get(prospectId);
    if (!p) return null;
    return {
      _id: p._id,
      workspaceId: p.workspaceId,
      campaignId: p.campaignId,
      name: p.name,
      vertical: p.vertical,
      address: p.address,
      phone: p.phone,
      targetEmail: p.targetEmail,
      contactName: p.contactName,
      approvalStatus: p.approvalStatus,
      outreachStatus: p.outreachStatus,
      currentBriefId: p.currentBriefId,
      currentWebsiteSpecId: p.currentWebsiteSpecId,
      currentDraftId: p.currentDraftId,
      currentProposalId: p.currentProposalId,
      activeThreadId: p.activeThreadId,
      followupCount: p.followupCount,
      isSuppressed: p.isSuppressed,
      suppressionReason: p.suppressionReason,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  },
});

export const pauseOutreach = mutation({
  args: { prospectId: v.id("prospects") },
  returns: v.null(),
  handler: async (ctx, { prospectId }) => {
    const p = await ctx.db.get(prospectId);
    if (!p) throw new Error("Prospect not found");

    const now = Date.now();
    await ctx.db.patch(prospectId, {
      approvalStatus: "paused",
      updatedAt: now,
    });

    // Cancel pending followups
    await ctx.db
      .query("followupSchedules")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .collect()
      .then(async (schedules) => {
        for (const s of schedules) {
          if (s.status === "pending") {
            await ctx.db.patch(s._id, {
              status: "cancelled",
              cancellationReason: "Manual operator pause.",
            });
          }
        }
      });

    await ctx.db.insert("activityLedger", {
      workspaceId: p.workspaceId,
      campaignId: p.campaignId,
      prospectId,
      actor: "operator",
      kind: "prospect_outreach_paused",
      summary: `Operator paused outreach for ${p.name}. All scheduled follow-ups suspended.`,
      at: now,
    });

    return null;
  },
});

export const suppressProspect = mutation({
  args: {
    prospectId: v.id("prospects"),
    reason: v.union(v.literal("unsubscribe"), v.literal("manual_operator"), v.literal("decline"), v.literal("bounce")),
  },
  returns: v.null(),
  handler: async (ctx, { prospectId, reason }) => {
    const p = await ctx.db.get(prospectId);
    if (!p) throw new Error("Prospect not found");

    const now = Date.now();
    await ctx.db.patch(prospectId, {
      isSuppressed: true,
      suppressionReason: reason,
      outreachStatus: "suppressed",
      updatedAt: now,
    });

    await ctx.db.insert("suppressions", {
      workspaceId: p.workspaceId,
      email: p.targetEmail,
      reason,
      suppressedAt: now,
    });

    // Cancel pending followups
    await ctx.db
      .query("followupSchedules")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .collect()
      .then(async (schedules) => {
        for (const s of schedules) {
          if (s.status === "pending") {
            await ctx.db.patch(s._id, {
              status: "cancelled",
              cancellationReason: `Prospect suppressed: ${reason}`,
            });
          }
        }
      });

    await ctx.db.insert("activityLedger", {
      workspaceId: p.workspaceId,
      campaignId: p.campaignId,
      prospectId,
      actor: "operator",
      kind: "prospect_suppressed",
      summary: `Operator added ${p.targetEmail} to suppression list (${reason}). All future sends blocked.`,
      at: now,
    });

    return null;
  },
});
