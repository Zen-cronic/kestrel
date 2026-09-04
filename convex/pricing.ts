import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getCrawl } from "./lib/providers";
import type { ExtractedLine } from "./lib/providers/types";
import { normalizeItemKey } from "./lib/money";
import type { Infer } from "convex/values";
import { lineItem } from "./schema";

type Line = Infer<typeof lineItem>;
const REFERENCE_TTL_MS = 7 * 24 * 3600 * 1000;

// Pricing order (the truth first, the web last):
//   1. labour → the contractor's rate card
//   2. material → a supplier's emailed quote for this project (third party in the inbox)
//   3. material → the contractor's stocked-material price list
//   4. material → cached reference price (Firecrawl search/scrape, with URL + fetched-at + expiry)
//   5. otherwise → unpriced, flagged amber; never guessed
export const priceLines = internalAction({
  args: { projectId: v.id("projects"), lines: v.array(v.any()) },
  handler: async (ctx, { projectId, lines }): Promise<Line[]> => {
    const ctxData = await ctx.runQuery(internal.pricing.pricingContext, { projectId });
    if (!ctxData) throw new Error("project not found");
    const out: Line[] = [];
    for (const raw of lines as ExtractedLine[]) {
      const key = normalizeItemKey(raw.description);
      if (raw.kind === "labour") {
        const hours = raw.labourHours ?? raw.qty;
        out.push({ kind: "labour", description: raw.description, qty: hours, unit: "h", unitPriceCents: ctxData.labourRateCentsPerHour, source: { type: "rate_card" }, flagged: false, note: raw.note });
        continue;
      }
      if (raw.ambiguous) {
        out.push({ kind: raw.kind, description: raw.description, qty: raw.qty, unit: raw.unit, unitPriceCents: null, source: { type: "unpriced" }, flagged: true, note: raw.note ?? "Ambiguous — the contractor must confirm before pricing." });
        continue;
      }
      const quote = ctxData.supplierQuoteItems.find((q) => key.includes(q.key) || q.key.includes(key));
      if (quote) {
        out.push({ kind: raw.kind, description: raw.description, qty: raw.qty, unit: quote.unit, unitPriceCents: quote.unitPriceCents, source: { type: "supplier_quote", quoteMessageId: quote.messageId, fetchedAt: quote.receivedAt }, flagged: false, note: raw.note });
        continue;
      }
      const stocked = ctxData.stockedMaterials.find((m) => key.includes(m.key) || m.key.includes(key));
      if (stocked) {
        out.push({ kind: raw.kind, description: raw.description, qty: raw.qty, unit: stocked.unit, unitPriceCents: stocked.unitPriceCents, source: { type: "rate_card" }, flagged: false, note: raw.note });
        continue;
      }
      const cached = ctxData.referencePrices.find((r) => r.key === key && r.expiresAt > Date.now());
      if (cached) {
        out.push({ kind: raw.kind, description: raw.description, qty: raw.qty, unit: cached.unit, unitPriceCents: cached.unitPriceCents, source: { type: "reference", url: cached.url, title: cached.title, fetchedAt: cached.fetchedAt, expiresAt: cached.expiresAt }, flagged: false, note: raw.note });
        continue;
      }
      const found = await getCrawl().findReferencePrice({ description: raw.description, unit: raw.unit, region: "CA-ON" });
      if (found) {
        const expiresAt = found.fetchedAt + REFERENCE_TTL_MS;
        await ctx.runMutation(internal.pricing.cacheReference, { key, description: found.description, unit: found.unit, unitPriceCents: found.unitPriceCents, url: found.url, title: found.title, provider: found.provider, fetchedAt: found.fetchedAt, expiresAt });
        out.push({ kind: raw.kind, description: raw.description, qty: raw.qty, unit: found.unit, unitPriceCents: found.unitPriceCents, source: { type: found.provider === "demo_catalog" ? "demo_catalog" : "reference", url: found.url, title: found.title, fetchedAt: found.fetchedAt, expiresAt }, flagged: false, note: raw.note });
        continue;
      }
      out.push({ kind: raw.kind, description: raw.description, qty: raw.qty, unit: raw.unit, unitPriceCents: null, source: { type: "unpriced" }, flagged: true, note: "No rate-card, supplier-quote or reference price found — flagged, not guessed." });
    }
    return out;
  },
});

export const pricingContext = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;
    const quotes = await ctx.db.query("supplierQuotes").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect();
    const referencePrices = await ctx.db.query("referencePrices").take(500);
    return {
      labourRateCentsPerHour: project.rateCard.labourRateCentsPerHour,
      stockedMaterials: project.rateCard.stockedMaterials.map((m) => ({ key: normalizeItemKey(m.key), unit: m.unit, unitPriceCents: m.unitPriceCents })),
      supplierQuoteItems: quotes.flatMap((q) => q.items.map((i) => ({ key: normalizeItemKey(i.key), unit: i.unit, unitPriceCents: i.unitPriceCents, messageId: q.messageId, receivedAt: q.receivedAt }))),
      referencePrices: referencePrices.map((r) => ({ key: r.key, unit: r.unit, unitPriceCents: r.unitPriceCents, url: r.url, title: r.title, fetchedAt: r.fetchedAt, expiresAt: r.expiresAt })),
    };
  },
});

export const cacheReference = internalMutation({
  args: { key: v.string(), description: v.string(), unit: v.string(), unitPriceCents: v.number(), url: v.string(), title: v.string(), provider: v.union(v.literal("firecrawl_search"), v.literal("firecrawl_scrape"), v.literal("demo_catalog")), fetchedAt: v.number(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("referencePrices").withIndex("by_key", (q) => q.eq("key", args.key)).first();
    if (existing) await ctx.db.patch(existing._id, args);
    else await ctx.db.insert("referencePrices", args);
  },
});
