import { describe, expect, it } from "vitest";
import { computeCommercialTerms, formatCents } from "../convex/lib/money";

describe("Commercial terms and cent arithmetic", () => {
  it("computes basis point percentages in integer cents without float drift", () => {
    // 50% deposit on $1,250.00 CAD
    const terms = computeCommercialTerms(125000, 5000);
    expect(terms.totalCents).toBe(125000);
    expect(terms.depositCents).toBe(62500);
    expect(terms.balanceCents).toBe(62500);
    expect(terms.depositCents + terms.balanceCents).toBe(terms.totalCents);
  });

  it("handles odd cent splits cleanly", () => {
    // 33.33% (3333 bps) on $999.99 CAD (99999 cents)
    const terms = computeCommercialTerms(99999, 3333);
    expect(terms.depositCents).toBe(33330);
    expect(terms.balanceCents).toBe(66669);
    expect(terms.depositCents + terms.balanceCents).toBe(99999);
  });

  it("formats cents into currency display string", () => {
    expect(formatCents(125000, "CAD")).toContain("1,250.00");
    expect(formatCents(100000, "CAD")).toContain("1,000.00");
  });
});
