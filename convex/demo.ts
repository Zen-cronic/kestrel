import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { token } from "./projects";
import { activeProviders } from "./lib/providers";

// A public, clearly labelled demo project so a judge can play both parties alone.
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = (await ctx.db.query("projects").take(50)).find((p) => p.isDemo);
    if (existing) return existing._id;
    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      name: "Kitchen reno — 41 Maple St (demo)",
      address: "41 Maple St, Toronto, ON",
      inboxId: "kitchen-41maple@demo.local",
      currency: "CAD",
      estimateTotalCents: 1_840_000,
      rateCard: { labourRateCentsPerHour: 9_500, overheadProfitBps: 1_500, wasteFactorBps: 500, taxBps: 1_300, stockedMaterials: [{ key: "drywall patch kit", description: "Drywall patch kit, 8 in (stocked)", unit: "each", unitPriceCents: 1_100 }] },
      isDemo: true,
      demoAutoApproveRole: "contractor",
      createdAt: now,
    });
    await ctx.db.insert("parties", { projectId, role: "contractor", name: "Dana (demo contractor)", email: "dana@demo-contractor.local", approvalToken: token() });
    await ctx.db.insert("parties", { projectId, role: "homeowner", name: "You (homeowner)", email: "homeowner@demo.local", approvalToken: token() });
    await ctx.db.insert("ledger", { projectId, kind: "project_created", summary: "Demo project seeded with a written estimate of $18,400 and a contractor rate card. Prices from the demo catalog are labelled.", at: now });
    return projectId;
  },
});

export const status = query({
  args: {},
  handler: async () => ({ providers: activeProviders() }),
});

// Judge-facing fixture: "send as homeowner" injects a request through the SAME
// inbound path the AgentMail webhook uses (recorded, deduped, processed).
export const sendAsHomeowner = mutation({
  args: { projectId: v.id("projects"), text: v.string() },
  handler: async (ctx, { projectId, text }) => {
    const project = await ctx.db.get(projectId);
    if (!project || !project.isDemo) throw new Error("fixtures are only allowed on the demo project");
    const homeowner = (await ctx.db.query("parties").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect()).find((p) => p.role === "homeowner");
    if (!homeowner) throw new Error("demo homeowner missing");
    const messageId = `demo-${projectId}-${Date.now()}`;
    await ctx.scheduler.runAfter(0, internal.inbound.record, { inboxId: project.inboxId ?? "", messageId, from: homeowner.email, subject: "Re: kitchen reno", text, via: "demo", attachments: [] });
    return messageId;
  },
});

// Judge-facing fixture: reply "approve" as a party through the same inbound path.
export const replyAs = mutation({
  args: { projectId: v.id("projects"), role: v.union(v.literal("contractor"), v.literal("homeowner")), decision: v.union(v.literal("approve"), v.literal("reject")) },
  handler: async (ctx, { projectId, role, decision }) => {
    const project = await ctx.db.get(projectId);
    if (!project || !project.isDemo) throw new Error("fixtures are only allowed on the demo project");
    const party = (await ctx.db.query("parties").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect()).find((p) => p.role === role);
    if (!party) throw new Error("party missing");
    const messageId = `demo-reply-${party._id}-${Date.now()}`;
    await ctx.scheduler.runAfter(0, internal.inbound.record, { inboxId: project.inboxId ?? "", messageId, from: party.email, subject: `Re: Change order [CO-${party.approvalToken}]`, text: `${decision}\n\nSent from my iPhone\n\n> quoted change order text`, via: "demo", attachments: [] });
    return messageId;
  },
});

// The labelled demo contractor approves automatically a few seconds after a CO is sent.
export const autoApprove = internalMutation({
  args: { changeOrderId: v.id("changeOrders"), role: v.union(v.literal("contractor"), v.literal("homeowner"), v.literal("supplier")) },
  handler: async (ctx, { changeOrderId, role }) => {
    const co = await ctx.db.get(changeOrderId);
    if (!co || !co.currentRevisionId || co.status !== "awaiting_approval") return;
    const party = (await ctx.db.query("parties").withIndex("by_project", (q) => q.eq("projectId", co.projectId)).collect()).find((p) => p.role === role);
    if (!party) return;
    await ctx.scheduler.runAfter(0, internal.changeOrders.recordDecision, { changeOrderId, revisionId: co.currentRevisionId, partyId: party._id, decision: "approve", via: "demo" });
  },
});
