import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { computeTotals } from "./lib/money";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").order("desc").take(50);
    return projects.map((p) => ({ _id: p._id, name: p.name, address: p.address, isDemo: p.isDemo, inboxId: p.inboxId ?? null }));
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;
    const parties = await ctx.db.query("parties").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect();
    const changeOrders = await ctx.db.query("changeOrders").withIndex("by_project", (q) => q.eq("projectId", projectId)).order("desc").take(100);
    let approvedCents = 0;
    let pendingCents = 0;
    const summaries = [];
    for (const co of changeOrders) {
      const rev = co.currentRevisionId ? await ctx.db.get(co.currentRevisionId) : null;
      const total = rev?.totalCents ?? 0;
      if (co.status === "approved") approvedCents += total;
      else if (co.status === "awaiting_approval" || co.status === "draft") pendingCents += total;
      summaries.push({ _id: co._id, number: co.number, title: co.title, status: co.status, totalCents: total, unpricedCount: rev ? computeTotals(rev.lineItems, rev).unpricedCount : 0, updatedAt: co.updatedAt });
    }
    const overBps = project.estimateTotalCents > 0 ? Math.round((approvedCents * 10_000) / project.estimateTotalCents) : 0;
    return {
      project: { ...project, rateCard: { ...project.rateCard, stockedMaterials: project.rateCard.stockedMaterials.map((m) => ({ ...m })) } },
      parties: parties.map((p) => ({ _id: p._id, role: p.role, name: p.name, email: p.email })),
      changeOrders: summaries,
      meter: { approvedCents, pendingCents, estimateTotalCents: project.estimateTotalCents, overBps, capBps: 1000 },
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    estimateTotalCents: v.number(),
    contractor: v.object({ name: v.string(), email: v.string() }),
    homeowner: v.object({ name: v.string(), email: v.string() }),
    labourRateCentsPerHour: v.number(),
    overheadProfitBps: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      address: args.address,
      currency: "CAD",
      estimateTotalCents: args.estimateTotalCents,
      rateCard: { labourRateCentsPerHour: args.labourRateCentsPerHour, overheadProfitBps: args.overheadProfitBps, wasteFactorBps: 500, taxBps: 1300, stockedMaterials: [] },
      isDemo: false,
      createdAt: now,
    });
    for (const [role, who] of [["contractor", args.contractor], ["homeowner", args.homeowner]] as const) {
      await ctx.db.insert("parties", { projectId, role, name: who.name, email: who.email.toLowerCase(), approvalToken: token() });
    }
    await ctx.db.insert("ledger", { projectId, kind: "project_created", summary: `Project created with a written estimate of ${args.estimateTotalCents / 100}.`, at: now });
    return projectId;
  },
});

export function token(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
