import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { lineItem } from "./schema";
import { computeTotals } from "./lib/money";
import type { Id } from "./_generated/dataModel";

export const get = query({
  args: { changeOrderId: v.id("changeOrders") },
  handler: async (ctx, { changeOrderId }) => {
    const co = await ctx.db.get(changeOrderId);
    if (!co) return null;
    const project = await ctx.db.get(co.projectId);
    const revisions = await ctx.db.query("revisions").withIndex("by_change_order", (q) => q.eq("changeOrderId", changeOrderId)).order("desc").take(20);
    const approvals = await ctx.db.query("approvals").withIndex("by_change_order", (q) => q.eq("changeOrderId", changeOrderId)).collect();
    const parties = await ctx.db.query("parties").withIndex("by_project", (q) => q.eq("projectId", co.projectId)).collect();
    const ledger = await ctx.db.query("ledger").withIndex("by_project_at", (q) => q.eq("projectId", co.projectId)).order("desc").take(50);
    const current = revisions.find((r) => r._id === co.currentRevisionId) ?? revisions[0] ?? null;
    return {
      changeOrder: co,
      project: project ? { _id: project._id, name: project.name, address: project.address, currency: project.currency, inboxId: project.inboxId ?? null, isDemo: project.isDemo } : null,
      current: current ? { ...current, totals: computeTotals(current.lineItems, current) } : null,
      revisions: revisions.map((r) => ({ _id: r._id, version: r.version, totalCents: r.totalCents, createdAt: r.createdAt })),
      approvals: approvals.map((a) => ({ _id: a._id, revisionId: a.revisionId, partyId: a.partyId, decision: a.decision, via: a.via, at: a.at })),
      parties: parties.map((p) => ({ _id: p._id, role: p.role, name: p.name, email: p.email })),
      ledger: ledger.filter((l) => !l.changeOrderId || l.changeOrderId === changeOrderId),
    };
  },
});

// Create a change order + first revision from extracted, priced lines.
export const createFromLines = internalMutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    summary: v.string(),
    lineItems: v.array(lineItem),
    scheduleImpactDays: v.number(),
    sourceMessageId: v.optional(v.string()),
    requestedByPartyId: v.optional(v.id("parties")),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("project not found");
    const existing = await ctx.db.query("changeOrders").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).collect();
    const number = existing.length + 1;
    const now = Date.now();
    const changeOrderId = await ctx.db.insert("changeOrders", { projectId: args.projectId, number, title: args.title, status: "draft", sourceMessageId: args.sourceMessageId, requestedByPartyId: args.requestedByPartyId, createdAt: now, updatedAt: now });
    const revisionId = await insertRevision(ctx, { changeOrderId, projectId: args.projectId, version: 1, lineItems: args.lineItems, project, scheduleImpactDays: args.scheduleImpactDays, summary: args.summary, createdByPartyId: undefined });
    await ctx.db.patch(changeOrderId, { currentRevisionId: revisionId });
    await ctx.db.insert("ledger", { projectId: args.projectId, changeOrderId, revisionId, kind: "draft_created", summary: `CO #${number} "${args.title}" drafted from the request.`, at: now });
    return { changeOrderId, revisionId, number };
  },
});

// Contractor revises prices/lines → new revision; earlier approvals no longer apply.
export const reviseLines = mutation({
  args: { changeOrderId: v.id("changeOrders"), partyId: v.id("parties"), lineItems: v.array(lineItem), summary: v.optional(v.string()), scheduleImpactDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const co = await ctx.db.get(args.changeOrderId);
    if (!co) throw new Error("change order not found");
    const party = await ctx.db.get(args.partyId);
    if (!party || party.projectId !== co.projectId || party.role !== "contractor") throw new Error("only the project's contractor can revise");
    const project = await ctx.db.get(co.projectId);
    if (!project) throw new Error("project not found");
    const prev = co.currentRevisionId ? await ctx.db.get(co.currentRevisionId) : null;
    const version = (prev?.version ?? 0) + 1;
    const revisionId = await insertRevision(ctx, { changeOrderId: co._id, projectId: co.projectId, version, lineItems: args.lineItems, project, scheduleImpactDays: args.scheduleImpactDays ?? prev?.scheduleImpactDays ?? 0, summary: args.summary ?? prev?.summary ?? co.title, createdByPartyId: party._id });
    const now = Date.now();
    await ctx.db.patch(co._id, { currentRevisionId: revisionId, status: "awaiting_approval", updatedAt: now });
    await ctx.db.insert("ledger", { projectId: co.projectId, changeOrderId: co._id, revisionId, kind: "revision_created", summary: `CO #${co.number} revised to v${version} by ${party.name}; earlier approvals no longer apply.`, actorPartyId: party._id, at: now });
    return revisionId;
  },
});

export const sendForApproval = mutation({
  args: { changeOrderId: v.id("changeOrders"), partyId: v.id("parties") },
  handler: async (ctx, { changeOrderId, partyId }) => {
    const co = await ctx.db.get(changeOrderId);
    if (!co || !co.currentRevisionId) throw new Error("change order not ready");
    const party = await ctx.db.get(partyId);
    if (!party || party.projectId !== co.projectId || party.role !== "contractor") throw new Error("only the contractor sends a change order for approval");
    const now = Date.now();
    await ctx.db.patch(changeOrderId, { status: "awaiting_approval", updatedAt: now });
    await ctx.db.insert("ledger", { projectId: co.projectId, changeOrderId, revisionId: co.currentRevisionId, kind: "sent_for_approval", summary: `CO #${co.number} sent to both parties for written approval.`, actorPartyId: partyId, at: now });
    await ctx.scheduler.runAfter(0, internal.mail.sendChangeOrderForApproval, { changeOrderId });
    const project = await ctx.db.get(co.projectId);
    if (project?.isDemo && project.demoAutoApproveRole) {
      await ctx.scheduler.runAfter(10_000, internal.demo.autoApprove, { changeOrderId, role: project.demoAutoApproveRole });
    }
    await ctx.scheduler.runAfter(3 * 24 * 3600 * 1000, internal.mail.reminderIfStillPending, { changeOrderId, revisionId: co.currentRevisionId });
  },
});

// One transaction records a decision for (revision, party). Stale revisions are
// rejected; duplicates are idempotent; the second approval flips the order.
export const recordDecision = internalMutation({
  args: {
    changeOrderId: v.id("changeOrders"),
    revisionId: v.id("revisions"),
    partyId: v.id("parties"),
    decision: v.union(v.literal("approve"), v.literal("reject")),
    via: v.union(v.literal("email"), v.literal("app"), v.literal("demo")),
    messageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => recordDecisionImpl(ctx, args),
});

export const decideInApp = mutation({
  args: { changeOrderId: v.id("changeOrders"), partyId: v.id("parties"), decision: v.union(v.literal("approve"), v.literal("reject")) },
  handler: async (ctx, { changeOrderId, partyId, decision }) => {
    const co = await ctx.db.get(changeOrderId);
    if (!co || !co.currentRevisionId) throw new Error("change order not ready");
    const party = await ctx.db.get(partyId);
    if (!party || party.projectId !== co.projectId) throw new Error("not a party to this project");
    return recordDecisionImpl(ctx, { changeOrderId, revisionId: co.currentRevisionId, partyId, decision, via: "app" });
  },
});

type Ctx = MutationCtx;

async function recordDecisionImpl(
  ctx: Ctx,
  args: { changeOrderId: Id<"changeOrders">; revisionId: Id<"revisions">; partyId: Id<"parties">; decision: "approve" | "reject"; via: "email" | "app" | "demo"; messageId?: string },
) {
  const co = await ctx.db.get(args.changeOrderId);
  if (!co) throw new Error("change order not found");
  const party = await ctx.db.get(args.partyId);
  if (!party || party.projectId !== co.projectId) throw new Error("party is not on this project");
  if (co.currentRevisionId !== args.revisionId) {
    await ctx.db.insert("ledger", { projectId: co.projectId, changeOrderId: co._id, revisionId: args.revisionId, kind: "stale_decision_rejected", summary: `${party.name} replied to an older revision of CO #${co.number}; not recorded. The current revision must be approved.`, actorPartyId: party._id, at: Date.now() });
    return { recorded: false, reason: "stale_revision" as const };
  }
  const existing = await ctx.db.query("approvals").withIndex("by_revision_party", (q) => q.eq("revisionId", args.revisionId).eq("partyId", args.partyId)).unique();
  if (existing) return { recorded: false, reason: "duplicate" as const };
  const now = Date.now();
  await ctx.db.insert("approvals", { projectId: co.projectId, changeOrderId: co._id, revisionId: args.revisionId, partyId: args.partyId, decision: args.decision, via: args.via, messageId: args.messageId, at: now });
  await ctx.db.insert("ledger", { projectId: co.projectId, changeOrderId: co._id, revisionId: args.revisionId, kind: args.decision === "approve" ? "approval_recorded" : "rejection_recorded", summary: `${party.name} (${party.role}) ${args.decision === "approve" ? "approved" : "rejected"} CO #${co.number} v${(await ctx.db.get(args.revisionId))?.version ?? "?"} by ${args.via === "email" ? "email reply" : args.via === "app" ? "in-app decision" : "demo fixture"}. Written ${args.decision === "approve" ? "approval" : "rejection"} recorded.`, actorPartyId: party._id, at: now });
  if (args.decision === "reject") {
    await ctx.db.patch(co._id, { status: "rejected", updatedAt: now });
    return { recorded: true, status: "rejected" as const };
  }
  const parties = await ctx.db.query("parties").withIndex("by_project", (q) => q.eq("projectId", co.projectId)).collect();
  const required = parties.filter((p) => p.role === "contractor" || p.role === "homeowner").map((p) => p._id);
  const approvals = await ctx.db.query("approvals").withIndex("by_change_order", (q) => q.eq("changeOrderId", co._id)).collect();
  const approvedParties = new Set(approvals.filter((a) => a.revisionId === args.revisionId && a.decision === "approve").map((a) => a.partyId));
  const complete = required.every((id) => approvedParties.has(id));
  if (complete) {
    await ctx.db.patch(co._id, { status: "approved", updatedAt: now });
    await ctx.db.insert("ledger", { projectId: co.projectId, changeOrderId: co._id, revisionId: args.revisionId, kind: "change_order_approved", summary: `CO #${co.number} approved in writing by both parties. Scope, price and schedule are now part of the record.`, at: now });
    await ctx.scheduler.runAfter(0, internal.mail.sendApprovedNotice, { changeOrderId: co._id });
  }
  return { recorded: true, status: complete ? ("approved" as const) : ("awaiting_approval" as const) };
}

async function insertRevision(
  ctx: Ctx,
  input: { changeOrderId: Id<"changeOrders">; projectId: Id<"projects">; version: number; lineItems: Array<Parameters<typeof computeTotals>[0][number]>; project: { rateCard: { overheadProfitBps: number; wasteFactorBps: number; taxBps: number } }; scheduleImpactDays: number; summary: string; createdByPartyId: Id<"parties"> | undefined },
) {
  const pct = { overheadProfitBps: input.project.rateCard.overheadProfitBps, wasteFactorBps: input.project.rateCard.wasteFactorBps, taxBps: input.project.rateCard.taxBps };
  const t = computeTotals(input.lineItems, pct);
  return ctx.db.insert("revisions", { changeOrderId: input.changeOrderId, projectId: input.projectId, version: input.version, lineItems: input.lineItems, ...pct, subtotalCents: t.subtotalCents, overheadProfitCents: t.overheadProfitCents, taxCents: t.taxCents, totalCents: t.totalCents, scheduleImpactDays: input.scheduleImpactDays, summary: input.summary, createdByPartyId: input.createdByPartyId, createdAt: Date.now() });
}
