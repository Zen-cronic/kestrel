export function cents(c: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(c / 100);
}
export function when(t: number): string {
  return new Date(t).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}
