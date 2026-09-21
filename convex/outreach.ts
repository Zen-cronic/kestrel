import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAgentMailProvider, getProviderMode } from "./lib/providers";
import { draftApprovalStatus } from "./schema";

function computeHash(subject: string, bodyText: string, priceCents: number): string {
  const contentToHash = `${subject}|${bodyText}|${priceCents}`;
  let hash = 0;
  for (let i = 0; i < contentToHash.length; i++) {
    hash = (hash << 5) - hash + contentToHash.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}`;
}

export const getDraft = query({
  args: { prospectId: v.id("prospects") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("outreachDrafts"),
      version: v.number(),
      recipientEmail: v.string(),
      subject: v.string(),
      bodyText: v.string(),
      bodyHtml: v.string(),
      shareUrl: v.string(),
      proposedScope: v.array(v.string()),
      proposedPriceCents: v.number(),
      proposedTimelineDays: v.number(),
      currency: v.string(),
      approvalStatus: draftApprovalStatus,
      approvedBy: v.optional(v.string()),
      approvedAt: v.optional(v.number()),
      sentAt: v.optional(v.number()),
      sendError: v.optional(v.string()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { prospectId }) => {
    const prospect = await ctx.db.get(prospectId);
    if (!prospect || !prospect.currentDraftId) return null;

    const draft = await ctx.db.get(prospect.currentDraftId);
    if (!draft) return null;

    return {
      _id: draft._id,
      version: draft.version,
      recipientEmail: draft.recipientEmail,
      subject: draft.subject,
      bodyText: draft.bodyText,
      bodyHtml: draft.bodyHtml,
      shareUrl: draft.shareUrl,
      proposedScope: draft.proposedScope,
      proposedPriceCents: draft.proposedPriceCents,
      proposedTimelineDays: draft.proposedTimelineDays,
      currency: draft.currency,
      approvalStatus: draft.approvalStatus,
      approvedBy: draft.approvedBy,
      approvedAt: draft.approvedAt,
      sentAt: draft.sentAt,
      sendError: draft.sendError,
      createdAt: draft.createdAt,
    };
  },
});

export const updateDraft = mutation({
  args: {
    draftId: v.id("outreachDrafts"),
    subject: v.string(),
    bodyText: v.string(),
    proposedPriceCents: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");

    const newHash = computeHash(args.subject, args.bodyText, args.proposedPriceCents);
    const wasApproved = draft.approvalStatus === "approved";

    // Immediate invalidation rule: Any edit after approval expires the approval
    const newStatus = wasApproved ? "expired_due_to_edit" : draft.approvalStatus;

    await ctx.db.patch(args.draftId, {
      subject: args.subject,
      bodyText: args.bodyText,
      proposedPriceCents: args.proposedPriceCents,
      hashOfContent: newHash,
      approvalStatus: newStatus,
      approvedBy: wasApproved ? undefined : draft.approvedBy,
      approvedAt: wasApproved ? undefined : draft.approvedAt,
    });

    if (wasApproved) {
      await ctx.db.insert("activityLedger", {
        workspaceId: draft.workspaceId,
        prospectId: draft.prospectId,
        actor: "operator",
        kind: "approval_invalidated_by_edit",
        summary: `Prior approval invalidated for outreach draft v${draft.version} due to content edit. Fresh approval required before sending.`,
        at: Date.now(),
      });
    }

    return null;
  },
});

export const approveDraft = mutation({
  args: { draftId: v.id("outreachDrafts") },
  returns: v.null(),
  handler: async (ctx, { draftId }) => {
    const draft = await ctx.db.get(draftId);
    if (!draft) throw new Error("Draft not found");

    const identity = await ctx.auth.getUserIdentity();
    const actor = identity?.email ?? identity?.name ?? "operator";

    const currentHash = computeHash(draft.subject, draft.bodyText, draft.proposedPriceCents);
    await ctx.db.patch(draftId, {
      approvalStatus: "approved",
      approvedBy: actor,
      approvedAt: Date.now(),
      hashOfContent: currentHash,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: draft.workspaceId,
      prospectId: draft.prospectId,
      actor,
      kind: "outreach_draft_approved",
      summary: `Operator approved outreach draft v${draft.version} ("${draft.subject}"). Ready for controlled dispatch.`,
      at: Date.now(),
    });

    return null;
  },
});

export const rejectDraft = mutation({
  args: { draftId: v.id("outreachDrafts") },
  returns: v.null(),
  handler: async (ctx, { draftId }) => {
    const draft = await ctx.db.get(draftId);
    if (!draft) throw new Error("Draft not found");

    await ctx.db.patch(draftId, {
      approvalStatus: "rejected",
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: draft.workspaceId,
      prospectId: draft.prospectId,
      actor: "operator",
      kind: "outreach_draft_rejected",
      summary: `Operator rejected outreach draft v${draft.version}.`,
      at: Date.now(),
    });

    return null;
  },
});

export const getSendContext = internalQuery({
  args: { prospectId: v.id("prospects") },
  handler: async (ctx, { prospectId }) => {
    const prospect = await ctx.db.get(prospectId);
    if (!prospect || !prospect.currentDraftId) return null;

    const draft = await ctx.db.get(prospect.currentDraftId);
    if (!draft) return null;

    const campaign = await ctx.db.get(prospect.campaignId);
    if (!campaign) return null;

    return { prospect, draft, campaign };
  },
});

export const recordSendSuccess = internalMutation({
  args: {
    prospectId: v.id("prospects"),
    draftId: v.id("outreachDrafts"),
    messageId: v.string(),
    threadId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const draft = await ctx.db.get(args.draftId);
    const prospect = await ctx.db.get(args.prospectId);
    if (!draft) return null;

    await ctx.db.patch(args.draftId, {
      sentAt: now,
      agentmailMessageId: args.messageId,
    });

    await ctx.db.patch(args.prospectId, {
      outreachStatus: "sent",
      activeThreadId: args.threadId,
      updatedAt: now,
    });

    // Create AgentMail thread record
    const existingThread = await ctx.db
      .query("agentMailThreads")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();

    if (!existingThread) {
      await ctx.db.insert("agentMailThreads", {
        workspaceId: draft.workspaceId,
        prospectId: args.prospectId,
        threadId: args.threadId,
        inboxId: process.env.AGENTMAIL_INBOX_ID || "inbox_operator_default",
        subject: draft.subject,
        lastMessageAt: now,
        messageCount: 1,
        status: "active",
        createdAt: now,
      });
    }

    // Insert outbound message record
    await ctx.db.insert("agentMailMessages", {
      workspaceId: draft.workspaceId,
      prospectId: args.prospectId,
      threadId: args.threadId,
      messageId: args.messageId,
      direction: "outbound",
      from: "outreach@storefrontdesk.app",
      to: [draft.recipientEmail],
      subject: draft.subject,
      text: draft.bodyText,
      html: draft.bodyHtml,
      via: getProviderMode() === "live" ? "agentmail" : "fixture",
      receivedOrSentAt: now,
      processedAt: now,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: draft.workspaceId,
      campaignId: prospect?.campaignId,
      prospectId: args.prospectId,
      actor: "operator",
      kind: "outreach_email_sent",
      summary: `Sent approved initial pitch to ${draft.recipientEmail} ("${draft.subject}").`,
      at: now,
    });

    return null;
  },
});

export const sendOutreach = action({
  args: { prospectId: v.id("prospects") },
  returns: v.object({
    ok: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, { prospectId }) => {
    const data: any = await ctx.runQuery(internal.outreach.getSendContext, { prospectId });
    if (!data) throw new Error("Prospect or draft not found");

    const { prospect, draft, campaign } = data;

    // Safety checks
    if (prospect.isSuppressed) {
      throw new Error(`Sending refused: Prospect is suppressed (${prospect.suppressionReason}).`);
    }

    if (prospect.approvalStatus !== "approved") {
      throw new Error("Sending refused: Prospect has not been approved by operator.");
    }

    if (draft.approvalStatus !== "approved") {
      throw new Error(`Sending refused: Draft approval status is "${draft.approvalStatus}". Fresh operator approval is required.`);
    }

    // Send-time hash recheck
    const currentHash = computeHash(draft.subject, draft.bodyText, draft.proposedPriceCents);
    if (currentHash !== draft.hashOfContent) {
      throw new Error("Sending refused: Content modified since last approval. Fresh approval required.");
    }

    // Dispatch via AgentMail
    const mail = getAgentMailProvider();
    const inboxId = process.env.AGENTMAIL_INBOX_ID || "inbox_operator_default";
    const result = await mail.sendMessage({
      inboxId,
      to: [draft.recipientEmail],
      subject: draft.subject,
      text: draft.bodyText,
      html: draft.bodyHtml,
    });

    await ctx.runMutation(internal.outreach.recordSendSuccess, {
      prospectId,
      draftId: draft._id,
      messageId: result.messageId,
      threadId: result.threadId,
    });

    // If campaign is in assisted_followups mode, schedule follow-up 1
    if (campaign.mode === "assisted_followups") {
      await ctx.runMutation(internal.followups.scheduleNextFollowup, {
        prospectId,
        campaignId: campaign._id,
      });
    }

    return {
      ok: true,
      message: `Outreach email successfully sent to ${draft.recipientEmail}.`,
    };
  },
});
