import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getLlm, getMail } from "./lib/providers";
import { computeTotals, formatCents } from "./lib/money";

export const outboundContext = internalQuery({
  args: { changeOrderId: v.id("changeOrders") },
  handler: async (ctx, { changeOrderId }) => {
    const co = await ctx.db.get(changeOrderId);
    if (!co || !co.currentRevisionId) return null;
    const rev = await ctx.db.get(co.currentRevisionId);
    const project = await ctx.db.get(co.projectId);
    const parties = await ctx.db.query("parties").withIndex("by_project", (q) => q.eq("projectId", co.projectId)).collect();
    if (!rev || !project) return null;
    return { co, rev, project: { inboxId: project.inboxId ?? null, currency: project.currency, name: project.name }, parties: parties.filter((p) => p.role !== "supplier").map((p) => ({ _id: p._id, role: p.role, name: p.name, email: p.email, approvalToken: p.approvalToken })) };
  },
});

export const recordSent = internalMutation({
  args: { projectId: v.id("projects"), changeOrderId: v.id("changeOrders"), summary: v.string() },
  handler: async (ctx, { projectId, changeOrderId, summary }) => {
    await ctx.db.insert("ledger", { projectId, changeOrderId, kind: "email_sent", summary, at: Date.now() });
  },
});

export const sendChangeOrderForApproval = internalAction({
  args: { changeOrderId: v.id("changeOrders") },
  handler: async (ctx, { changeOrderId }) => {
    const data = await ctx.runQuery(internal.mail.outboundContext, { changeOrderId });
    if (!data) return;
    const totals = computeTotals(data.rev.lineItems, data.rev);
    const lines = data.rev.lineItems.map((l) => `- ${l.description}: ${l.qty} ${l.unit}${l.unitPriceCents === null ? " — UNPRICED (needs confirmation)" : ` × ${formatCents(l.unitPriceCents, data.project.currency)} [${l.source.type}${l.source.url ? " " + l.source.url : ""}]`}`).join("\n");
    const totalsText = `${lines}\nSubtotal ${formatCents(totals.subtotalCents)} · OH&P ${formatCents(totals.overheadProfitCents)} · Tax ${formatCents(totals.taxCents)} · Total ${formatCents(totals.totalCents)}${totals.unpricedCount ? ` (${totals.unpricedCount} unpriced line(s))` : ""}`;
    for (const party of data.parties) {
      const subject = `Change order #${data.co.number}: ${data.co.title} [CO-${party.approvalToken}]`;
      const approveInstructions = `To approve, reply to this email with the word "approve". To decline, reply "reject". Your reply is recorded as written approval for revision v${data.rev.version} only.`;
      const body = await getLlm().draftChangeOrderEmail({ summary: data.rev.summary, totalsText, approveInstructions });
      await getMail().send({ inboxId: data.project.inboxId ?? "demo-inbox", to: [party.email], subject, text: body });
      await ctx.runMutation(internal.mail.recordSent, { projectId: data.co.projectId, changeOrderId, summary: `CO #${data.co.number} v${data.rev.version} emailed to ${party.name} (${party.role}) for written approval.` });
    }
  },
});

export const sendApprovedNotice = internalAction({
  args: { changeOrderId: v.id("changeOrders") },
  handler: async (ctx, { changeOrderId }) => {
    const data = await ctx.runQuery(internal.mail.outboundContext, { changeOrderId });
    if (!data) return;
    for (const party of data.parties) {
      await getMail().send({ inboxId: data.project.inboxId ?? "demo-inbox", to: [party.email], subject: `Approved: change order #${data.co.number} — ${data.co.title}`, text: `Both parties have approved change order #${data.co.number} (v${data.rev.version}) for ${formatCents(data.rev.totalCents, data.project.currency)}. It is now part of the project record.` });
    }
    await ctx.runMutation(internal.mail.recordSent, { projectId: data.co.projectId, changeOrderId, summary: `Approved notice emailed to both parties.` });
  },
});

// Reminder only if the same revision is still awaiting approval — cancelled by state, not by id.
export const reminderIfStillPending = internalAction({
  args: { changeOrderId: v.id("changeOrders"), revisionId: v.id("revisions") },
  handler: async (ctx, { changeOrderId, revisionId }) => {
    const data = await ctx.runQuery(internal.mail.outboundContext, { changeOrderId });
    if (!data || data.co.status !== "awaiting_approval" || data.co.currentRevisionId !== revisionId) return;
    for (const party of data.parties) {
      await getMail().send({ inboxId: data.project.inboxId ?? "demo-inbox", to: [party.email], subject: `Reminder: change order #${data.co.number} is waiting for your reply [CO-${party.approvalToken}]`, text: `Change order #${data.co.number} (${data.co.title}) is still awaiting written approval. Reply "approve" or "reject".` });
    }
    await ctx.runMutation(internal.mail.recordSent, { projectId: data.co.projectId, changeOrderId, summary: `Reminder emailed: CO #${data.co.number} still awaiting approval.` });
  },
});
