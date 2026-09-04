import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { detectIntent, findToken, stripQuotedHistory } from "./lib/replyText";
import { getLlm } from "./lib/providers";

// Idempotent on provider message id. Returns the row id or null when already seen.
export const record = internalMutation({
  args: {
    inboxId: v.string(), messageId: v.string(), threadId: v.optional(v.string()), from: v.string(), subject: v.string(), text: v.string(),
    via: v.union(v.literal("agentmail"), v.literal("demo")),
    attachments: v.optional(v.array(v.object({ storageId: v.optional(v.id("_storage")), filename: v.string(), contentType: v.string() }))),
  },
  handler: async (ctx, args) => {
    const dup = await ctx.db.query("inboundMessages").withIndex("by_message_id", (q) => q.eq("messageId", args.messageId)).unique();
    if (dup) return null;
    const project = await ctx.db.query("projects").withIndex("by_inbox", (q) => q.eq("inboxId", args.inboxId)).unique();
    const id = await ctx.db.insert("inboundMessages", { projectId: project?._id, inboxId: args.inboxId, messageId: args.messageId, threadId: args.threadId, from: args.from.toLowerCase(), subject: args.subject, text: stripQuotedHistory(args.text), receivedAt: Date.now(), via: args.via, attachments: args.attachments ?? [] });
    if (project) await ctx.db.insert("ledger", { projectId: project._id, kind: "request_received", summary: `Email received from ${args.from}: "${args.subject}".`, at: Date.now() });
    await ctx.scheduler.runAfter(0, internal.inbound.process, { inboundId: id });
    return id;
  },
});

export const getForProcessing = internalQuery({
  args: { inboundId: v.id("inboundMessages") },
  handler: async (ctx, { inboundId }) => {
    const msg = await ctx.db.get(inboundId);
    if (!msg || !msg.projectId) return null;
    const project = await ctx.db.get(msg.projectId);
    if (!project) return null;
    const parties = await ctx.db.query("parties").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect();
    const open = await ctx.db.query("changeOrders").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect();
    return { msg, project: { _id: project._id, name: project.name, address: project.address }, parties: parties.map((p) => ({ _id: p._id, role: p.role, email: p.email, approvalToken: p.approvalToken })), openChangeOrders: open.filter((c) => c.status === "awaiting_approval").map((c) => ({ _id: c._id, currentRevisionId: c.currentRevisionId })) };
  },
});

export const markProcessed = internalMutation({
  args: { inboundId: v.id("inboundMessages"), classification: v.union(v.literal("request"), v.literal("approval"), v.literal("rejection"), v.literal("quote"), v.literal("other")), error: v.optional(v.string()) },
  handler: async (ctx, { inboundId, classification, error }) => {
    await ctx.db.patch(inboundId, { classification, processedAt: Date.now(), error });
  },
});

// Routing: approval/rejection is decided deterministically (explicit word + the
// party's token + sender on the project); only genuine requests reach the LLM.
export const process = internalAction({
  args: { inboundId: v.id("inboundMessages") },
  handler: async (ctx, { inboundId }) => {
    const data = await ctx.runQuery(internal.inbound.getForProcessing, { inboundId });
    if (!data) { await ctx.runMutation(internal.inbound.markProcessed, { inboundId, classification: "other", error: "no project for inbox" }); return; }
    const { msg, parties, openChangeOrders } = data;
    const sender = parties.find((p) => p.email === msg.from);
    const intent = detectIntent(msg.text);
    const token = findToken(msg.subject, msg.text);
    if (sender && intent !== "none" && token && token === sender.approvalToken && openChangeOrders.length > 0) {
      // Approve the most recent awaiting change order; the mutation rejects stale revisions and duplicates.
      const target = openChangeOrders[openChangeOrders.length - 1];
      if (target.currentRevisionId) {
        await ctx.runMutation(internal.changeOrders.recordDecision, { changeOrderId: target._id, revisionId: target.currentRevisionId, partyId: sender._id, decision: intent === "approve" ? "approve" : "reject", via: msg.via === "demo" ? "demo" : "email", messageId: msg.messageId });
        await ctx.runMutation(internal.inbound.markProcessed, { inboundId, classification: intent === "approve" ? "approval" : "rejection" });
        return;
      }
    }
    if (sender && intent !== "none" && (!token || token !== sender.approvalToken)) {
      await ctx.runMutation(internal.inbound.markProcessed, { inboundId, classification: "other", error: "approval word without a valid token — not recorded" });
      return;
    }
    const kind = await getLlm().classifyInbound({ subject: msg.subject, text: msg.text });
    if (kind === "request") {
      const extracted = await getLlm().extractChangeRequest({ text: msg.text, projectContext: `${data.project.name} at ${data.project.address}` });
      const priced = await ctx.runAction(internal.pricing.priceLines, { projectId: data.project._id, lines: extracted.lines });
      await ctx.runMutation(internal.changeOrders.createFromLines, { projectId: data.project._id, title: extracted.title, summary: extracted.summary, lineItems: priced, scheduleImpactDays: extracted.scheduleImpactDays, sourceMessageId: msg.messageId, requestedByPartyId: sender?._id });
      await ctx.runMutation(internal.inbound.markProcessed, { inboundId, classification: "request" });
      return;
    }
    await ctx.runMutation(internal.inbound.markProcessed, { inboundId, classification: kind === "quote" ? "quote" : "other" });
  },
});
