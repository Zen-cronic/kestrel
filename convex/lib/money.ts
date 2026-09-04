// Integer-cent arithmetic for totals two people will argue about. No floats leak out.
import type { Infer } from "convex/values";
import { lineItem } from "../schema";

export type LineItem = Infer<typeof lineItem>;

export function bpsOf(cents: number, bps: number): number {
  return Math.round((cents * bps) / 10_000);
}

export function lineTotalCents(item: LineItem): number {
  if (item.unitPriceCents === null) return 0;
  return Math.round(item.qty * item.unitPriceCents);
}

export function computeTotals(
  items: LineItem[],
  pct: { overheadProfitBps: number; wasteFactorBps: number; taxBps: number },
) {
  const materials = items.filter((i) => i.kind === "material").reduce((s, i) => s + lineTotalCents(i), 0);
  const labour = items.filter((i) => i.kind === "labour").reduce((s, i) => s + lineTotalCents(i), 0);
  const other = items.filter((i) => i.kind === "other").reduce((s, i) => s + lineTotalCents(i), 0);
  const waste = bpsOf(materials, pct.wasteFactorBps);
  const subtotalCents = materials + waste + labour + other;
  const overheadProfitCents = bpsOf(subtotalCents, pct.overheadProfitBps);
  const taxCents = bpsOf(subtotalCents + overheadProfitCents, pct.taxBps);
  const totalCents = subtotalCents + overheadProfitCents + taxCents;
  const unpricedCount = items.filter((i) => i.unitPriceCents === null).length;
  return { materials, waste, labour, other, subtotalCents, overheadProfitCents, taxCents, totalCents, unpricedCount };
}

export function formatCents(cents: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(cents / 100);
}

export function normalizeItemKey(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
