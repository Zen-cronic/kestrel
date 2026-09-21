// Integer-cent arithmetic for commercial proposals and contracts. No floats leak out.

export function bpsOf(cents: number, bps: number): number {
  return Math.round((cents * bps) / 10_000);
}

export function computeCommercialTerms(
  totalCents: number,
  depositPctBps = 5000 // Default 50% deposit
) {
  const depositCents = bpsOf(totalCents, depositPctBps);
  const balanceCents = totalCents - depositCents;
  return {
    totalCents,
    depositCents,
    balanceCents,
  };
}

export function formatCents(cents: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(cents / 100);
}
