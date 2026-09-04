import { describe, expect, it } from "vitest";
import { computeTotals } from "../convex/lib/money";
import { detectIntent, findToken, stripQuotedHistory } from "../convex/lib/replyText";

describe("computeTotals", () => {
  it("applies waste to materials only, then OH&P, then tax, in integer cents", () => {
    const t = computeTotals(
      [
        { kind: "material", description: "outlet", qty: 1, unit: "each", unitPriceCents: 2497, source: { type: "demo_catalog" }, flagged: false },
        { kind: "labour", description: "electrician", qty: 1.5, unit: "h", unitPriceCents: 9500, source: { type: "rate_card" }, flagged: false },
        { kind: "material", description: "mystery", qty: 1, unit: "each", unitPriceCents: null, source: { type: "unpriced" }, flagged: true },
      ],
      { overheadProfitBps: 1500, wasteFactorBps: 500, taxBps: 1300 },
    );
    expect(t.materials).toBe(2497);
    expect(t.waste).toBe(125);
    expect(t.labour).toBe(14250);
    expect(t.subtotalCents).toBe(16872);
    expect(t.overheadProfitCents).toBe(2531);
    expect(t.taxCents).toBe(2522);
    expect(t.totalCents).toBe(21925);
    expect(t.unpricedCount).toBe(1);
  });
});

describe("reply parsing", () => {
  it("strips quoted history and reads a top-posted approval", () => {
    const body = "Approve\n\nSent from my iPhone\n\n> On Sep 4, Dana wrote:\n> Change order #1 …";
    expect(stripQuotedHistory(body)).toBe("Approve");
    expect(detectIntent(stripQuotedHistory(body))).toBe("approve");
  });
  it("does not read an approval word inside the quoted change order", () => {
    const body = "Can you also add a dimmer?\n\nOn Sep 4, Dana wrote:\nTo approve, reply approve";
    expect(detectIntent(stripQuotedHistory(body))).toBe("none");
  });
  it("finds the party token in the subject", () => {
    expect(findToken("Re: Change order #1 [CO-AB23CD]", "approve")).toBe("AB23CD");
    expect(findToken("Re: hi", "no token here")).toBeNull();
  });
});
