import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getOpenAIProvider } from "./lib/providers";
import { replyClassification } from "./schema";

export const getThread = query({
  args: { prospectId: v.id("prospects") },
  returns: v.object({
    thread: v.union(
      v.null(),
      v.object({
        threadId: v.string(),
        subject: v.string(),
        messageCount: v.number(),
        status: v.union(
          v.literal("active"),
          v.literal("paused"),
          v.literal("bounced"),
          v.literal("suppressed"),
          v.literal("closed")
        ),
        lastMessageAt: v.number(),
      })
    ),
    messages: v.array(
      v.object({
        _id: v.id("agentMailMessages"),
        messageId: v.string(),
        direction: v.union(v.literal("outbound"), v.literal("inbound")),
        from: v.string(),
        to: v.array(v.string()),
        subject: v.string(),
        text: v.string(),
        classification: v.optional(replyClassification),
        proposedChanges: v.optional(
          v.object({
            requestedScope: v.optional(v.array(v.string())),
            requestedPriceCents: v.optional(v.number()),
            requestedTimelineDays: v.optional(v.number()),
            notes: v.string(),
          })
        ),
        via: v.union(v.literal("agentmail"), v.literal("fixture")),
        receivedOrSentAt: v.number(),
      })
    ),
  }),
  handler: async (ctx, { prospectId }) => {
    const thread = await ctx.db
      .query("agentMailThreads")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .first();

    const messages = await ctx.db
      .query("agentMailMessages")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .order("asc")
      .collect();

    return {
      thread: thread
        ? {
            threadId: thread.threadId,
            subject: thread.subject,
            messageCount: thread.messageCount,
            status: thread.status,
            lastMessageAt: thread.lastMessageAt,
          }
        : null,
      messages: messages.map((m) => ({
        _id: m._id,
        messageId: m.messageId,
        direction: m.direction,
        from: m.from,
        to: m.to,
        subject: m.subject,
        text: m.text,
        classification: m.classification,
        proposedChanges: m.proposedChanges,
        via: m.via,
        receivedOrSentAt: m.receivedOrSentAt,
      })),
    };
  },
});

export const recordInbound = internalMutation({
  args: {
    messageId: v.string(),
    threadId: v.string(),
    from: v.string(),
    to: v.array(v.string()),
    subject: v.string(),
    text: v.string(),
    via: v.union(v.literal("agentmail"), v.literal("fixture")),
  },
  returns: v.union(v.null(), v.id("agentMailMessages")),
  handler: async (ctx, args) => {
    // 1. Idempotency check on provider messageId
    const dup = await ctx.db
      .query("agentMailMessages")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .first();

    if (dup) {
      return null;
    }

    // 2. Find prospect matching the sender email or threadId
    let prospect = await ctx.db
      .query("prospects")
      .withIndex("by_targetEmail", (q) => q.eq("targetEmail", args.from.toLowerCase()))
      .first();

    if (!prospect) {
      // Fallback search by active thread
      const thread = await ctx.db
        .query("agentMailThreads")
        .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
        .first();

      if (thread) {
        prospect = await ctx.db.get(thread.prospectId);
      }
    }

    if (!prospect) {
      console.warn(`Inbound message received for unknown prospect/thread: ${args.from}`);
      return null;
    }

    const now = Date.now();

    // 3. Immediately cancel all pending followups for this prospect upon reply!
    await ctx.db
      .query("followupSchedules")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospect!._id))
      .collect()
      .then(async (schedules) => {
        for (const s of schedules) {
          if (s.status === "pending") {
            await ctx.db.patch(s._id, {
              status: "cancelled",
              cancellationReason: "Inbound reply received from prospect.",
            });
          }
        }
      });

    // 4. Record message
    const msgId = await ctx.db.insert("agentMailMessages", {
      workspaceId: prospect.workspaceId,
      prospectId: prospect._id,
      threadId: args.threadId,
      messageId: args.messageId,
      direction: "inbound",
      from: args.from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      via: args.via,
      receivedOrSentAt: now,
    });

    // Update thread
    const thread = await ctx.db
      .query("agentMailThreads")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();

    if (thread) {
      await ctx.db.patch(thread._id, {
        lastMessageAt: now,
        messageCount: thread.messageCount + 1,
      });
    }

    await ctx.db.patch(prospect._id, {
      outreachStatus: "replied",
      updatedAt: now,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: prospect.workspaceId,
      campaignId: prospect.campaignId,
      prospectId: prospect._id,
      actor: args.from,
      kind: "inbound_email_received",
      summary: `Inbound reply from ${args.from}: "${args.subject}". All pending follow-ups cancelled.`,
      at: now,
    });

    // Schedule structured classification
    await ctx.scheduler.runAfter(0, internal.threads.classifyAndProcessReply, {
      messageDocId: msgId,
    });

    return msgId;
  },
});

export const getMessageForClassification = internalQuery({
  args: { messageDocId: v.id("agentMailMessages") },
  handler: async (ctx, { messageDocId }) => {
    const msg = await ctx.db.get(messageDocId);
    if (!msg) return null;

    const prospect = await ctx.db.get(msg.prospectId);
    if (!prospect) return null;

    const draft = prospect.currentDraftId ? await ctx.db.get(prospect.currentDraftId) : null;
    const proposal = prospect.currentProposalId ? await ctx.db.get(prospect.currentProposalId) : null;

    return { msg, prospect, draft, proposal };
  },
});

export const applyClassificationResults = internalMutation({
  args: {
    messageDocId: v.id("agentMailMessages"),
    classification: replyClassification,
    proposedChanges: v.optional(
      v.object({
        requestedScope: v.optional(v.array(v.string())),
        requestedPriceCents: v.optional(v.number()),
        requestedTimelineDays: v.optional(v.number()),
        notes: v.string(),
      })
    ),
    reasoning: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageDocId);
    if (!msg) return null;

    const prospect = await ctx.db.get(msg.prospectId);
    if (!prospect) return null;

    const now = Date.now();

    await ctx.db.patch(args.messageDocId, {
      classification: args.classification,
      proposedChanges: args.proposedChanges,
      processedAt: now,
    });

    // Handle unsubscribe
    if (args.classification === "unsubscribe") {
      await ctx.db.patch(prospect._id, {
        isSuppressed: true,
        suppressionReason: "Unsubscribe requested by prospect.",
        outreachStatus: "suppressed",
        updatedAt: now,
      });

      await ctx.db.insert("suppressions", {
        workspaceId: prospect.workspaceId,
        email: prospect.targetEmail,
        reason: "unsubscribe",
        suppressedAt: now,
      });

      await ctx.db.insert("activityLedger", {
        workspaceId: prospect.workspaceId,
        campaignId: prospect.campaignId,
        prospectId: prospect._id,
        actor: "system",
        kind: "prospect_suppressed",
        summary: `Prospect ${prospect.targetEmail} unsubscribed. Placed on workspace suppression list; all future outreach barred.`,
        at: now,
      });

      return null;
    }

    // Handle commercial scope / price / timeline changes
    if (
      args.classification === "requested_price_change" ||
      args.classification === "requested_scope_change" ||
      args.classification === "requested_timeline_change" ||
      args.classification === "requested_terms_change"
    ) {
      const currentProposal = prospect.currentProposalId ? await ctx.db.get(prospect.currentProposalId) : null;
      const nextVersion = (currentProposal?.version ?? 1) + 1;

      const newProposalId = await ctx.db.insert("proposals", {
        workspaceId: prospect.workspaceId,
        prospectId: prospect._id,
        version: nextVersion,
        scopeItems:
          args.proposedChanges?.requestedScope ??
          currentProposal?.scopeItems ?? ["Responsive 5-page digital storefront"],
        priceCents: args.proposedChanges?.requestedPriceCents ?? currentProposal?.priceCents ?? 100000,
        timelineDays: args.proposedChanges?.requestedTimelineDays ?? currentProposal?.timelineDays ?? 10,
        currency: currentProposal?.currency ?? "CAD",
        termsSummary:
          args.proposedChanges?.notes ??
          "Client counter-proposal. Requires operator review and binding approval.",
        status: "counter_proposed_by_client",
        isCommerciallyBinding: false, // Invariant: Counteroffers are NEVER binding until human approval!
        humanDecisionRequired: true, // Invariant: Human must explicitly accept or decline!
        changeReason: args.reasoning,
        sourceMessageId: msg.messageId,
        createdAt: now,
      });

      await ctx.db.patch(prospect._id, {
        currentProposalId: newProposalId,
        outreachStatus: "negotiating",
        updatedAt: now,
      });

      await ctx.db.insert("activityLedger", {
        workspaceId: prospect.workspaceId,
        campaignId: prospect.campaignId,
        prospectId: prospect._id,
        actor: "openai_classifier",
        kind: "commercial_terms_counter_received",
        summary: `Client proposed commercial changes: v${nextVersion} created ($${((args.proposedChanges?.requestedPriceCents ?? 100000) / 100).toFixed(2)} CAD). Human operator approval strictly required.`,
        at: now,
      });

      return null;
    }

    // Otherwise standard reply
    await ctx.db.patch(prospect._id, {
      outreachStatus: "replied",
      updatedAt: now,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: prospect.workspaceId,
      campaignId: prospect.campaignId,
      prospectId: prospect._id,
      actor: "openai_classifier",
      kind: "reply_classified",
      summary: `Inbound reply classified as "${args.classification}". Reasoning: ${args.reasoning}`,
      at: now,
    });

    return null;
  },
});

export const classifyAndProcessReply = internalAction({
  args: { messageDocId: v.id("agentMailMessages") },
  handler: async (ctx, { messageDocId }) => {
    const data = await ctx.runQuery(internal.threads.getMessageForClassification, { messageDocId });
    if (!data) return;

    const { msg, draft } = data;
    const ai = getOpenAIProvider();

    const classificationResult = await ai.classifyReply({
      originalSubject: draft?.subject ?? "Website Preview",
      originalBody: draft?.bodyText ?? "",
      replySubject: msg.subject,
      replyText: msg.text,
    });

    await ctx.runMutation(internal.threads.applyClassificationResults, {
      messageDocId,
      classification: classificationResult.classification,
      proposedChanges: classificationResult.proposedChanges,
      reasoning: classificationResult.reasoning,
    });
  },
});

export const simulateInboundReply = mutation({
  args: {
    prospectId: v.id("prospects"),
    text: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const prospect = await ctx.db.get(args.prospectId);
    if (!prospect) throw new Error("Prospect not found");

    const replyBody =
      args.text ||
      "Thanks for putting together the preview—the photos and coffee notes look great. We want to move forward, but we definitely need our wholesale coffee bean subscription page included in scope, and our budget is firm at $1,000 CAD with delivery in 10 days. Can you do that?";

    const threadId = prospect.activeThreadId || "thread_fixture_demo";
    const messageId = "msg_sim_" + Date.now();

    await ctx.scheduler.runAfter(0, internal.threads.recordInbound, {
      messageId,
      threadId,
      from: prospect.targetEmail,
      to: ["outreach@storefrontdesk.app"],
      subject: "Re: Built a website preview for " + prospect.name,
      text: replyBody,
      via: "fixture",
    });

    return null;
  },
});
