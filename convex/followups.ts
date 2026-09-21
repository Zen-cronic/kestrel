import { internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAgentMailProvider, getProviderMode } from "./lib/providers";

export const getSchedules = query({
  args: { prospectId: v.id("prospects") },
  returns: v.array(
    v.object({
      _id: v.id("followupSchedules"),
      attemptNumber: v.number(),
      scheduledTime: v.number(),
      status: v.union(
        v.literal("pending"),
        v.literal("cancelled"),
        v.literal("sent"),
        v.literal("skipped")
      ),
      cancellationReason: v.optional(v.string()),
      executedAt: v.optional(v.number()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { prospectId }) => {
    const list = await ctx.db
      .query("followupSchedules")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .order("asc")
      .collect();
    return list.map((s) => ({
      _id: s._id,
      attemptNumber: s.attemptNumber,
      scheduledTime: s.scheduledTime,
      status: s.status,
      cancellationReason: s.cancellationReason,
      executedAt: s.executedAt,
      createdAt: s.createdAt,
    }));
  },
});

export const scheduleNextFollowup = internalMutation({
  args: {
    prospectId: v.id("prospects"),
    campaignId: v.id("campaigns"),
  },
  returns: v.union(v.null(), v.id("followupSchedules")),
  handler: async (ctx, args) => {
    const prospect = await ctx.db.get(args.prospectId);
    if (!prospect || prospect.isSuppressed || prospect.outreachStatus !== "sent") {
      return null;
    }

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.mode !== "assisted_followups" || campaign.status !== "active") {
      return null;
    }

    // Hard ceiling check: at most TWO followups allowed!
    if (prospect.followupCount >= 2) {
      return null;
    }

    const nextAttempt = prospect.followupCount + 1;
    const now = Date.now();
    // 3 days delay in production; for test/demo mode use 30 seconds
    const delayMs = 3 * 24 * 60 * 60 * 1000;
    const scheduledTime = now + delayMs;

    const scheduleId = await ctx.db.insert("followupSchedules", {
      workspaceId: prospect.workspaceId,
      prospectId: args.prospectId,
      campaignId: args.campaignId,
      attemptNumber: nextAttempt,
      scheduledTime,
      status: "pending",
      createdAt: now,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: prospect.workspaceId,
      campaignId: args.campaignId,
      prospectId: args.prospectId,
      actor: "scheduler",
      kind: "followup_scheduled",
      summary: `Automated non-binding follow-up #${nextAttempt} of 2 scheduled for ${new Date(scheduledTime).toISOString().slice(0, 10)}.`,
      at: now,
    });

    return scheduleId;
  },
});

export const cancelPendingFollowups = internalMutation({
  args: {
    prospectId: v.id("prospects"),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { prospectId, reason }) => {
    const schedules = await ctx.db
      .query("followupSchedules")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .collect();

    for (const s of schedules) {
      if (s.status === "pending") {
        await ctx.db.patch(s._id, {
          status: "cancelled",
          cancellationReason: reason,
        });
      }
    }

    return null;
  },
});

export const getRecheckContext = internalQuery({
  args: { scheduleId: v.id("followupSchedules") },
  handler: async (ctx, { scheduleId }) => {
    const schedule = await ctx.db.get(scheduleId);
    if (!schedule) return null;

    const prospect = await ctx.db.get(schedule.prospectId);
    if (!prospect) return null;

    const campaign = await ctx.db.get(schedule.campaignId);
    if (!campaign) return null;

    const draft = prospect.currentDraftId ? await ctx.db.get(prospect.currentDraftId) : null;

    return { schedule, prospect, campaign, draft };
  },
});

export const executeFollowup = internalAction({
  args: { scheduleId: v.id("followupSchedules") },
  handler: async (ctx, { scheduleId }) => {
    const data = await ctx.runQuery(internal.followups.getRecheckContext, { scheduleId });
    if (!data) return;

    const { schedule, prospect, campaign, draft } = data;

    // Send-time race & cancellation recheck
    if (schedule.status !== "pending") return;
    if (prospect.isSuppressed) {
      await ctx.runMutation(internal.followups.cancelPendingFollowups, {
        prospectId: prospect._id,
        reason: "Prospect suppressed before dispatch.",
      });
      return;
    }
    if (prospect.outreachStatus !== "sent") {
      // Reply arrived or prospect was paused
      await ctx.runMutation(internal.followups.cancelPendingFollowups, {
        prospectId: prospect._id,
        reason: `Prospect status is ${prospect.outreachStatus}, cancelling automated follow-up.`,
      });
      return;
    }
    if (campaign.mode !== "assisted_followups" || campaign.status !== "active") {
      await ctx.runMutation(internal.followups.cancelPendingFollowups, {
        prospectId: prospect._id,
        reason: "Campaign mode changed to manual or campaign paused.",
      });
      return;
    }

    // Attempt ceiling
    if (schedule.attemptNumber > 2) {
      return;
    }

    const shareUrl = draft?.shareUrl || `/preview/${prospect.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-preview-v1`;
    const subject = `Following up: Website preview for ${prospect.name}`;
    const bodyText = `Hi ${prospect.contactName || "there"},

Just wanted to float this back to the top of your inbox in case you were in the middle of service earlier this week.

We have your website preview live here with your signature roasts and bakery items:
${shareUrl}

Let us know if you'd like to make any adjustments or chat about next steps.

Best regards,
Storefront Desk Team`;

    const mail = getAgentMailProvider();
    const inboxId = process.env.AGENTMAIL_INBOX_ID || "inbox_operator_default";
    const result = await mail.sendMessage({
      inboxId,
      to: [prospect.targetEmail],
      subject,
      text: bodyText,
    });

    const now = Date.now();
    await ctx.runMutation(internal.followups.recordFollowupSent, {
      scheduleId,
      prospectId: prospect._id,
      campaignId: campaign._id,
      attemptNumber: schedule.attemptNumber,
      messageId: result.messageId,
      threadId: result.threadId,
      subject,
      text: bodyText,
      at: now,
    });
  },
});

export const recordFollowupSent = internalMutation({
  args: {
    scheduleId: v.id("followupSchedules"),
    prospectId: v.id("prospects"),
    campaignId: v.id("campaigns"),
    attemptNumber: v.number(),
    messageId: v.string(),
    threadId: v.string(),
    subject: v.string(),
    text: v.string(),
    at: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const prospect = await ctx.db.get(args.prospectId);
    if (!prospect) return null;

    await ctx.db.patch(args.scheduleId, {
      status: "sent",
      executedAt: args.at,
    });

    await ctx.db.patch(args.prospectId, {
      followupCount: args.attemptNumber,
      updatedAt: args.at,
    });

    await ctx.db.insert("agentMailMessages", {
      workspaceId: prospect.workspaceId,
      prospectId: args.prospectId,
      threadId: args.threadId,
      messageId: args.messageId,
      direction: "outbound",
      from: "outreach@storefrontdesk.app",
      to: [prospect.targetEmail],
      subject: args.subject,
      text: args.text,
      via: getProviderMode() === "live" ? "agentmail" : "fixture",
      receivedOrSentAt: args.at,
      processedAt: args.at,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: prospect.workspaceId,
      campaignId: args.campaignId,
      prospectId: args.prospectId,
      actor: "scheduler",
      kind: "automated_followup_sent",
      summary: `Automated non-binding follow-up #${args.attemptNumber} of 2 sent to ${prospect.targetEmail}.`,
      at: args.at,
    });

    // If attempt was 1, schedule attempt 2
    if (args.attemptNumber === 1) {
      await ctx.scheduler.runAfter(0, internal.followups.scheduleNextFollowup, {
        prospectId: args.prospectId,
        campaignId: args.campaignId,
      });
    }

    return null;
  },
});
