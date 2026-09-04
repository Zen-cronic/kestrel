import type { Crawl, ExtractedRequest, Llm, Mail, ReferencePrice } from "./types";
import { normalizeItemKey } from "../money";

// Deterministic fixtures. Clearly labelled in the UI as demo data.
export const DEMO_CATALOG: Array<Omit<ReferencePrice, "fetchedAt"> & { key: string }> = [
  { key: "gfci outlet 20a", description: "20A GFCI receptacle, tamper-resistant", unit: "each", unitPriceCents: 2497, url: "https://example-supplier.test/catalog/gfci-20a", title: "Demo catalog — 20A GFCI receptacle", provider: "demo_catalog" },
  { key: "14/2 nmd90 cable", description: "14/2 NMD90 cable, 15 m", unit: "each", unitPriceCents: 3140, url: "https://example-supplier.test/catalog/nmd90-14-2-15m", title: "Demo catalog — 14/2 NMD90 15 m", provider: "demo_catalog" },
  { key: "device box single gang", description: "Single-gang device box, old-work", unit: "each", unitPriceCents: 389, url: "https://example-supplier.test/catalog/device-box-1g", title: "Demo catalog — single-gang old-work box", provider: "demo_catalog" },
  { key: "cover plate", description: "Decora cover plate, white", unit: "each", unitPriceCents: 149, url: "https://example-supplier.test/catalog/cover-plate", title: "Demo catalog — Decora cover plate", provider: "demo_catalog" },
  { key: "drywall patch kit", description: "Drywall patch kit, 8 in", unit: "each", unitPriceCents: 1299, url: "https://example-supplier.test/catalog/drywall-patch", title: "Demo catalog — drywall patch kit", provider: "demo_catalog" },
];

export const mockLlm: Llm = {
  async extractChangeRequest({ text }): Promise<ExtractedRequest> {
    const t = text.toLowerCase();
    if (/outlet|receptacle|plug/.test(t)) {
      return {
        title: "Move kitchen outlet",
        summary: "Relocate the existing kitchen counter outlet about 60 cm to the left of the sink and patch the old location.",
        lines: [
          { kind: "material", description: "20A GFCI receptacle, tamper-resistant", qty: 1, unit: "each" },
          { kind: "material", description: "14/2 NMD90 cable, 15 m", qty: 1, unit: "each" },
          { kind: "material", description: "Single-gang device box, old-work", qty: 1, unit: "each" },
          { kind: "material", description: "Decora cover plate, white", qty: 1, unit: "each" },
          { kind: "material", description: "Drywall patch kit, 8 in", qty: 1, unit: "each" },
          { kind: "labour", description: "Electrician — relocate outlet and patch", qty: 1.5, unit: "h", labourHours: 1.5 },
        ],
        scheduleImpactDays: 0,
        questions: ["Confirm the new location is at least 30 cm from the sink edge (code clearance)."],
      };
    }
    return {
      title: text.split(/\r?\n/)[0].slice(0, 60) || "Change request",
      summary: text.slice(0, 240),
      lines: [{ kind: "other", description: text.slice(0, 80), qty: 1, unit: "each", ambiguous: true, note: "Could not extract a priced line — needs the contractor's input." }],
      scheduleImpactDays: 0,
      questions: ["Please confirm scope and quantities."],
    };
  },
  async draftChangeOrderEmail({ summary, totalsText, approveInstructions }) {
    return `Change order proposed\n\n${summary}\n\n${totalsText}\n\n${approveInstructions}\n\nThis message was drafted by Change Order Desk from the request in this thread. Nothing changes until both parties reply.`;
  },
  async classifyInbound({ subject, text }) {
    const t = (subject + " " + text).toLowerCase();
    if (/\bquote\b|\bpricing\b|\bunit price\b/.test(t)) return "quote";
    if (/can we|could you|add|move|change|instead|also|upgrade/.test(t)) return "request";
    return "other";
  },
};

export const mockCrawl: Crawl = {
  async findReferencePrice({ description }) {
    const key = normalizeItemKey(description).replace(/receptacle/g, "outlet");
    const hit = DEMO_CATALOG.find((c) => {
      const tokens = c.key.split(" ").filter((t) => t.length > 1);
      return tokens.filter((t) => key.includes(t)).length >= Math.min(2, tokens.length);
    });
    if (!hit) return null;
    const { key: _k, ...rest } = hit;
    return { ...rest, fetchedAt: Date.now() };
  },
};

export const mockMail: Mail = {
  async send({ subject }) {
    return { messageId: `mock-${Date.now()}-${subject.length}` };
  },
};
