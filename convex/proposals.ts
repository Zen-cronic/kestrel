import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { proposalStatus } from "./schema";

export const getProposalHistory = query({
  args: { prospectId: v.id("prospects") },
  returns: v.array(
    v.object({
      _id: v.id("proposals"),
      version: v.number(),
      scopeItems: v.array(v.string()),
      priceCents: v.number(),
      timelineDays: v.number(),
      currency: v.string(),
      termsSummary: v.string(),
      status: proposalStatus,
      isCommerciallyBinding: v.boolean(),
      humanDecisionRequired: v.boolean(),
      decidedBy: v.optional(v.string()),
      decidedAt: v.optional(v.number()),
      changeReason: v.optional(v.string()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { prospectId }) => {
    const list = await ctx.db
      .query("proposals")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .order("desc")
      .collect();
    return list.map((pr) => ({
      _id: pr._id,
      version: pr.version,
      scopeItems: pr.scopeItems,
      priceCents: pr.priceCents,
      timelineDays: pr.timelineDays,
      currency: pr.currency,
      termsSummary: pr.termsSummary,
      status: pr.status,
      isCommerciallyBinding: pr.isCommerciallyBinding,
      humanDecisionRequired: pr.humanDecisionRequired,
      decidedBy: pr.decidedBy,
      decidedAt: pr.decidedAt,
      changeReason: pr.changeReason,
      createdAt: pr.createdAt,
    }));
  },
});

export const acceptProposal = mutation({
  args: {
    proposalId: v.id("proposals"),
  },
  returns: v.null(),
  handler: async (ctx, { proposalId }) => {
    const proposal = await ctx.db.get(proposalId);
    if (!proposal) throw new Error("Proposal not found");

    const identity = await ctx.auth.getUserIdentity();
    const actor = identity?.email ?? identity?.name ?? "operator";
    const now = Date.now();

    await ctx.db.patch(proposalId, {
      status: "accepted",
      isCommerciallyBinding: true,
      humanDecisionRequired: false,
      decidedBy: actor,
      decidedAt: now,
    });

    await ctx.db.patch(proposal.prospectId, {
      outreachStatus: "accepted",
      updatedAt: now,
    });

    // Cancel any pending follow-ups
    await ctx.db
      .query("followupSchedules")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", proposal.prospectId))
      .collect()
      .then(async (schedules) => {
        for (const s of schedules) {
          if (s.status === "pending") {
            await ctx.db.patch(s._id, {
              status: "cancelled",
              cancellationReason: "Commercial proposal accepted by operator.",
            });
          }
        }
      });

    await ctx.db.insert("activityLedger", {
      workspaceId: proposal.workspaceId,
      prospectId: proposal.prospectId,
      actor,
      kind: "proposal_accepted_by_operator",
      summary: `Operator accepted proposal v${proposal.version} ($${(proposal.priceCents / 100).toFixed(2)} ${proposal.currency}, ${proposal.timelineDays} days). Terms are now locked and binding.`,
      at: now,
    });

    return null;
  },
});

export const declineProposal = mutation({
  args: {
    proposalId: v.id("proposals"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { proposalId, reason }) => {
    const proposal = await ctx.db.get(proposalId);
    if (!proposal) throw new Error("Proposal not found");

    const identity = await ctx.auth.getUserIdentity();
    const actor = identity?.email ?? identity?.name ?? "operator";
    const now = Date.now();

    await ctx.db.patch(proposalId, {
      status: "declined",
      humanDecisionRequired: false,
      decidedBy: actor,
      decidedAt: now,
      changeReason: reason,
    });

    await ctx.db.patch(proposal.prospectId, {
      outreachStatus: "declined",
      updatedAt: now,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: proposal.workspaceId,
      prospectId: proposal.prospectId,
      actor,
      kind: "proposal_declined_by_operator",
      summary: `Operator declined proposal v${proposal.version}.${reason ? " Reason: " + reason : ""}`,
      at: now,
    });

    return null;
  },
});

export const createRevision = mutation({
  args: {
    prospectId: v.id("prospects"),
    scopeItems: v.array(v.string()),
    priceCents: v.number(),
    timelineDays: v.number(),
    termsSummary: v.string(),
  },
  returns: v.id("proposals"),
  handler: async (ctx, args) => {
    const prospect = await ctx.db.get(args.prospectId);
    if (!prospect) throw new Error("Prospect not found");

    const current = prospect.currentProposalId ? await ctx.db.get(prospect.currentProposalId) : null;
    const version = (current?.version ?? 0) + 1;
    const now = Date.now();

    const newId = await ctx.db.insert("proposals", {
      workspaceId: prospect.workspaceId,
      prospectId: args.prospectId,
      version,
      scopeItems: args.scopeItems,
      priceCents: args.priceCents,
      timelineDays: args.timelineDays,
      currency: current?.currency ?? "CAD",
      termsSummary: args.termsSummary,
      status: "proposed_by_operator",
      isCommerciallyBinding: false,
      humanDecisionRequired: false,
      createdAt: now,
    });

    await ctx.db.patch(args.prospectId, {
      currentProposalId: newId,
      updatedAt: now,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: prospect.workspaceId,
      prospectId: args.prospectId,
      actor: "operator",
      kind: "proposal_revision_created",
      summary: `Operator created proposal revision v${version} ($${(args.priceCents / 100).toFixed(2)} CAD).`,
      at: now,
    });

    return newId;
  },
});
