// Strip quoted history and signatures from an email reply so "approve" on a
// top-posted mobile reply is read as the reply, not the quoted change order.
const QUOTE_MARKERS = [
  /^On .+ wrote:\s*$/im,
  /^-{2,}\s*Original Message\s*-{2,}$/im,
  /^From: .+$/im,
  /^Sent from my (iPhone|Android|Galaxy|Pixel).*$/im,
  /^>/m,
  /^_{5,}$/m,
  /^-- $/m,
];

export function stripQuotedHistory(text: string): string {
  let cut = text.length;
  for (const marker of QUOTE_MARKERS) {
    const m = marker.exec(text);
    if (m && m.index < cut && m.index > 0) cut = m.index;
  }
  return text.slice(0, cut).trim();
}

export type ReplyIntent = "approve" | "reject" | "none";

// Deterministic intent detection for approvals. The LLM never gates money:
// only an explicit approve/reject word in the stripped reply body counts, and
// the approval token (in the subject or body) must match the party's token.
export function detectIntent(strippedText: string): ReplyIntent {
  const head = strippedText.split(/\r?\n/).slice(0, 6).join(" ").toLowerCase();
  if (/\b(reject|decline|do not approve|don't approve|no thanks|not approved)\b/.test(head)) return "reject";
  if (/\b(approve|approved|approve it|looks good|lgtm|ok to proceed|go ahead)\b/.test(head)) return "approve";
  return "none";
}

export function findToken(subject: string, body: string): string | null {
  const m = /\bCO-([A-Z0-9]{6})\b/i.exec(subject + "\n" + body);
  return m ? m[1].toUpperCase() : null;
}
