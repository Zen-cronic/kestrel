// Provider interfaces for Storefront Desk
// Every sponsor sits behind a typed interface with deterministic fixture and live implementations.
// Application code and human operators — never the model — make binding decisions and trigger real sends.

export type ProviderMode = "fixture" | "live" | "mock";

export function getProviderMode(): "fixture" | "live" {
  const env = process.env.PROVIDER_MODE?.toLowerCase();
  if (env === "live") return "live";
  return "fixture"; // Default to deterministic fixture mode
}

export type PlaceCandidateData = {
  placeId: string;
  name: string;
  formattedAddress: string;
  phone?: string;
  websiteUrl?: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  category: string;
  businessStatus?: string;
  weakPresenceSignals: string[];
};

export interface PlacesProvider {
  search(query: string, location: string): Promise<PlaceCandidateData[]>;
  getDetails(placeId: string): Promise<PlaceCandidateData | null>;
}

export type ScrapedSourceData = {
  url: string;
  title: string;
  provider: "firecrawl_search" | "firecrawl_scrape";
  httpStatus: number;
  contentSnippet: string;
  claims: Array<{
    claimKey: string;
    category: "identity" | "hours" | "menu" | "services" | "location" | "weakness" | "reputation";
    statement: string;
    rawExcerpt: string;
    confidence: "official" | "high" | "medium" | "needs_confirmation";
    status: "verified" | "flagged_unknown" | "unsupported";
  }>;
};

export interface FirecrawlProvider {
  auditBusiness(businessName: string, domainOrQuery: string, location: string): Promise<ScrapedSourceData[]>;
}

export type GeneratedBriefOutput = {
  headline: string;
  summary: string;
  diagnosis: {
    missingWebsite: boolean;
    staleContent: boolean;
    mobileIssues: boolean;
    missingMenuPdf: boolean;
    opportunities: string[];
  };
  strengths: Array<{ title: string; claimKeyReference?: string }>;
  unknowns: string[];
  operatorNotes?: string;
};

export type GeneratedWebsiteSpecOutput = {
  businessIdentity: {
    name: string;
    tagline: string;
    vertical: string;
    neighborhood: string;
    city: string;
  };
  theme: {
    primaryColor: string;
    accentColor: string;
    fontHeading: string;
    fontBody: string;
    styleVariant: string;
  };
  navigation: Array<{ label: string; anchor: string }>;
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    primaryCta: { label: string; action: string };
    secondaryCta?: { label: string; action: string };
    citedClaimKeys: string[];
  };
  aboutSection: {
    title: string;
    storyParagraphs: string[];
    highlights: string[];
    citedClaimKeys: string[];
  };
  offeringsSection: {
    title: string;
    description: string;
    items: Array<{
      name: string;
      description: string;
      priceDisplay?: string;
      badge?: string;
      citedClaimKey?: string;
    }>;
    citedClaimKeys: string[];
  };
  hoursAndLocation: {
    address: string;
    hours: Array<{ days: string; open: string; close: string }>;
    note?: string;
    citedClaimKeys: string[];
  };
  contactSection: {
    email: string;
    phone?: string;
    reservationNotice: string;
    citedClaimKeys: string[];
  };
  unknownItems: string[];
};

export type GeneratedOutreachOutput = {
  subject: string;
  bodyText: string;
  bodyHtml: string;
  proposedScope: string[];
  proposedPriceCents: number;
  proposedTimelineDays: number;
};

export type ReplyClassificationOutput = {
  classification:
    | "reply_received"
    | "interested"
    | "question"
    | "requested_site_change"
    | "requested_scope_change"
    | "requested_price_change"
    | "requested_timeline_change"
    | "requested_terms_change"
    | "decline"
    | "unsubscribe"
    | "out_of_office"
    | "ambiguous";
  confidenceScore: number;
  proposedChanges?: {
    requestedScope?: string[];
    requestedPriceCents?: number;
    requestedTimelineDays?: number;
    notes: string;
  };
  reasoning: string;
};

export interface OpenAIProvider {
  generateBusinessBrief(input: {
    businessName: string;
    address: string;
    category: string;
    evidence: Array<{ claimKey: string; statement: string; category: string }>;
  }): Promise<GeneratedBriefOutput>;

  generateWebsiteSpec(input: {
    businessName: string;
    brief: GeneratedBriefOutput;
    evidence: Array<{ claimKey: string; statement: string; category: string }>;
  }): Promise<GeneratedWebsiteSpecOutput>;

  generateOutreachDraft(input: {
    businessName: string;
    ownerName?: string;
    brief: GeneratedBriefOutput;
    shareUrl: string;
  }): Promise<GeneratedOutreachOutput>;

  classifyReply(input: {
    originalSubject: string;
    originalBody: string;
    replySubject: string;
    replyText: string;
  }): Promise<ReplyClassificationOutput>;
}

export interface AgentMailProvider {
  sendMessage(input: {
    inboxId: string;
    to: string[];
    subject: string;
    text: string;
    html?: string;
    inReplyToMessageId?: string;
  }): Promise<{ messageId: string; threadId: string }>;
}
