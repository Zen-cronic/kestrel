// Provider interfaces. Every sponsor sits behind one of these so the hero path
// runs end-to-end in PROVIDER_MODE=mock before any key exists, and the live
// implementation is a drop-in. Application code — never the model — decides
// what gets sent or approved.

export type ExtractedLine = {
  kind: "material" | "labour" | "other";
  description: string;
  qty: number;
  unit: string;
  labourHours?: number;
  ambiguous?: boolean;
  note?: string;
};

export type ExtractedRequest = {
  title: string;
  summary: string; // plain-language restatement of the request
  lines: ExtractedLine[];
  scheduleImpactDays: number;
  questions: string[]; // things the contractor must confirm before pricing
};

export interface Llm {
  extractChangeRequest(input: { text: string; projectContext: string }): Promise<ExtractedRequest>;
  draftChangeOrderEmail(input: { summary: string; totalsText: string; approveInstructions: string }): Promise<string>;
  classifyInbound(input: { subject: string; text: string }): Promise<"request" | "quote" | "other">;
}

export type ReferencePrice = {
  description: string;
  unit: string;
  unitPriceCents: number;
  url: string;
  title: string;
  provider: "firecrawl_search" | "firecrawl_scrape" | "demo_catalog";
  fetchedAt: number;
};

export interface Crawl {
  findReferencePrice(input: { description: string; unit: string; region: string }): Promise<ReferencePrice | null>;
}

export interface Mail {
  send(input: { inboxId: string; to: string[]; subject: string; text: string; inReplyToMessageId?: string }): Promise<{ messageId: string }>;
}

export type ProviderMode = "mock" | "live";
export function providerMode(): ProviderMode {
  return process.env.PROVIDER_MODE === "live" ? "live" : "mock";
}
