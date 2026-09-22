import {
  PlacesProvider,
  FirecrawlProvider,
  OpenAIProvider,
  AgentMailProvider,
  PlaceCandidateData,
  ScrapedSourceData,
  GeneratedBriefOutput,
  GeneratedWebsiteSpecOutput,
  GeneratedOutreachOutput,
  ReplyClassificationOutput,
  ScrapeResult,
  AgentMailMessageItem,
} from "./types";
import OpenAI from "openai";

export class LivePlacesProvider implements PlacesProvider {
  private apiKey: string;
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_PLACES_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY is required for live Places queries.");
    }
  }

  async search(query: string, location: string): Promise<PlaceCandidateData[]> {
    const fullQuery = `${query} in ${location}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fullQuery)}&key=${this.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Places search failed: ${res.statusText}`);
    const data = (await res.json()) as {
      results?: Array<{
        place_id: string;
        name: string;
        formatted_address: string;
        rating?: number;
        user_ratings_total?: number;
        price_level?: number;
        business_status?: string;
        types?: string[];
      }>;
    };

    const candidates: PlaceCandidateData[] = [];
    for (const item of (data.results || []).slice(0, 5)) {
      const details = await this.getDetails(item.place_id).catch(() => null);
      candidates.push(
        details || {
          placeId: item.place_id,
          name: item.name,
          formattedAddress: item.formatted_address,
          rating: item.rating,
          userRatingsTotal: item.user_ratings_total,
          priceLevel: item.price_level,
          category: query,
          businessStatus: item.business_status,
          weakPresenceSignals: ["Audit pending for live Places result"],
        }
      );
    }
    return candidates;
  }

  async getDetails(placeId: string): Promise<PlaceCandidateData | null> {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,price_level,business_status,types&key=${this.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: {
        name: string;
        formatted_address: string;
        formatted_phone_number?: string;
        website?: string;
        rating?: number;
        user_ratings_total?: number;
        price_level?: number;
        business_status?: string;
        types?: string[];
      };
    };
    if (!data.result) return null;
    const r = data.result;
    const signals: string[] = [];
    if (!r.website) {
      signals.push("No website listed on official Google Business listing");
    } else if (r.website.includes("facebook.com") || r.website.includes("instagram.com")) {
      signals.push("Listing points to social media profile rather than owned domain");
    }

    return {
      placeId,
      name: r.name,
      formattedAddress: r.formatted_address,
      phone: r.formatted_phone_number,
      websiteUrl: r.website,
      rating: r.rating,
      userRatingsTotal: r.user_ratings_total,
      priceLevel: r.price_level,
      category: r.types?.[0] || "local business",
      businessStatus: r.business_status,
      weakPresenceSignals: signals.length > 0 ? signals : ["Standard web presence audit recommended"],
    };
  }
}

export class LiveFirecrawlProvider implements FirecrawlProvider {
  private apiKey: string;
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FIRECRAWL_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("FIRECRAWL_API_KEY is required for live web audits.");
    }
  }

  async auditBusiness(businessName: string, domainOrQuery: string, location: string): Promise<ScrapedSourceData[]> {
    const query = domainOrQuery.startsWith("http") ? domainOrQuery : `${businessName} ${location}`;
    const url = "https://api.firecrawl.dev/v1/search";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        limit: 3,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    if (!res.ok) {
      throw new Error(`Firecrawl search failed with status ${res.status}: ${res.statusText}`);
    }
    const data = (await res.json()) as {
      data?: Array<{
        url?: string;
        title?: string;
        markdown?: string;
      }>;
    };

    const sources: ScrapedSourceData[] = [];
    for (const item of data.data || []) {
      const pageUrl = item.url || "https://openweb.example.com";
      const title = item.title || `${businessName} Public Web Page`;
      const snippet = (item.markdown || "").slice(0, 500);

      sources.push({
        url: pageUrl,
        title,
        provider: "firecrawl_search",
        httpStatus: 200,
        contentSnippet: snippet,
        claims: [
          {
            claimKey: "public_record_" + Math.random().toString(36).slice(2, 8),
            category: "identity",
            statement: `Public listing found for ${businessName}: ${title}`,
            rawExcerpt: snippet.slice(0, 150),
            confidence: "medium",
            status: "verified",
          },
        ],
      });
    }

    return sources;
  }

  async scrapeUrl(url: string): Promise<ScrapeResult> {
    const apiUrl = "https://api.firecrawl.dev/v1/scrape";
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "links"],
        onlyMainContent: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Firecrawl scrape failed with status ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as {
      success?: boolean;
      data?: {
        markdown?: string;
        links?: string[];
        metadata?: {
          title?: string;
          description?: string;
          statusCode?: number;
          [key: string]: any;
        };
      };
    };

    const data = json.data || {};
    return {
      url,
      markdown: data.markdown || "",
      title: data.metadata?.title || url,
      description: data.metadata?.description || "",
      links: data.links || [],
      statusCode: data.metadata?.statusCode || res.status,
      metadata: data.metadata,
    };
  }
}

export class LiveOpenAIProvider implements OpenAIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("OPENAI_API_KEY is required for live AI generation.");
    }
    this.client = new OpenAI({ apiKey: key });
    this.model = model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async generateBusinessBrief(input: {
    businessName: string;
    address: string;
    category: string;
    evidence: Array<{ claimKey: string; statement: string; category: string }>;
  }): Promise<GeneratedBriefOutput> {
    const prompt = `You are an expert SMB digital growth analyst. Based on this verified evidence:
Business: ${input.businessName} (${input.category})
Address: ${input.address}
Evidence claims:
${JSON.stringify(input.evidence, null, 2)}

Produce a grounded, factual brief. Do not invent facts, hours, awards, or services not in the evidence.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: "You output strictly valid JSON matching the requested schema." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return {
      headline: parsed.headline || `${input.businessName} Growth Opportunity`,
      summary: parsed.summary || "Summary generated from verified evidence.",
      diagnosis: parsed.diagnosis || {
        missingWebsite: true,
        staleContent: false,
        mobileIssues: true,
        missingMenuPdf: true,
        opportunities: ["Modern responsive storefront", "Direct order capture"],
      },
      strengths: parsed.strengths || [],
      unknowns: parsed.unknowns || ["Catering availability unconfirmed"],
      operatorNotes: parsed.operatorNotes,
    };
  }

  async generateWebsiteSpec(input: {
    businessName: string;
    brief: GeneratedBriefOutput;
    evidence: Array<{ claimKey: string; statement: string; category: string }>;
  }): Promise<GeneratedWebsiteSpecOutput> {
    const prompt = `Generate a typed website specification for ${input.businessName} based on:
Brief: ${JSON.stringify(input.brief, null, 2)}
Evidence: ${JSON.stringify(input.evidence, null, 2)}

Every factual claim in hero, about, offerings, and hours must cite existing evidence claimKey. Any unconfirmed details must go to unknownItems. Output strictly valid JSON.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: "Output strictly valid JSON conforming to website spec." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}") as GeneratedWebsiteSpecOutput;
  }

  async generateOutreachDraft(input: {
    businessName: string;
    ownerName?: string;
    brief: GeneratedBriefOutput;
    shareUrl: string;
  }): Promise<GeneratedOutreachOutput> {
    const prompt = `Draft a concise, warm, professional cold email to ${input.businessName} offering a digital storefront. Include the live preview link ${input.shareUrl}. The proposed price is $1,250 CAD for a 7-day turnaround. Output JSON with subject, bodyText, bodyHtml, proposedScope, proposedPriceCents (125000), proposedTimelineDays (7).`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: "Output strictly JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}") as GeneratedOutreachOutput;
  }

  async classifyReply(input: {
    originalSubject: string;
    originalBody: string;
    replySubject: string;
    replyText: string;
  }): Promise<ReplyClassificationOutput> {
    const prompt = `Classify this inbound email reply from a business owner:
Subject: ${input.replySubject}
Body: ${input.replyText}

Output JSON with:
- classification (reply_received, interested, question, requested_site_change, requested_scope_change, requested_price_change, requested_timeline_change, requested_terms_change, decline, unsubscribe, out_of_office, ambiguous)
- confidenceScore (0 to 1)
- proposedChanges (object with optional requestedScope, requestedPriceCents, requestedTimelineDays, notes)
- reasoning (string)`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: "Output strictly JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}") as ReplyClassificationOutput;
  }
}

export class LiveAgentMailProvider implements AgentMailProvider {
  private apiKey: string;
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.AGENTMAIL_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("AGENTMAIL_API_KEY is required for live AgentMail sends.");
    }
  }

  async sendMessage(input: {
    inboxId: string;
    to: string[];
    subject: string;
    text: string;
    html?: string;
    inReplyToMessageId?: string;
  }): Promise<{ messageId: string; threadId: string }> {
    let url = `https://api.agentmail.to/inboxes/${encodeURIComponent(input.inboxId)}/messages/send`;
    if (input.inReplyToMessageId && !input.inReplyToMessageId.startsWith("<")) {
      url = `https://api.agentmail.to/inboxes/${encodeURIComponent(input.inboxId)}/messages/${encodeURIComponent(input.inReplyToMessageId)}/reply`;
    }

    let res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!res.ok && url.includes("/reply")) {
      // Fallback to direct send if specific message ID not found on remote
      const fallbackUrl = `https://api.agentmail.to/inboxes/${encodeURIComponent(input.inboxId)}/messages/send`;
      res = await fetch(fallbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          to: input.to,
          subject: input.subject,
          text: input.text,
          html: input.html,
        }),
      });
    }

    if (!res.ok) {
      throw new Error(`AgentMail send failed with status ${res.status}: ${res.statusText}`);
    }
    const data = (await res.json()) as { message_id?: string; thread_id?: string };
    return {
      messageId: data.message_id || "msg_live_" + Date.now(),
      threadId: data.thread_id || "thread_live_" + Date.now(),
    };
  }

  async listMessages(inboxId: string): Promise<AgentMailMessageItem[]> {
    const url = `https://api.agentmail.to/inboxes/${encodeURIComponent(inboxId)}/messages`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`AgentMail list messages failed with status ${res.status}: ${res.statusText}`);
    }

    const data = (await res.json()) as {
      messages?: Array<{
        messageId?: string;
        message_id?: string;
        threadId?: string;
        thread_id?: string;
        from?: string;
        to?: string[];
        subject?: string;
        preview?: string;
        text?: string;
        createdAt?: string;
      }>;
    };

    return (data.messages || []).map((m) => ({
      messageId: m.messageId || m.message_id || "msg_live_" + Math.random().toString(36).substring(2, 9),
      threadId: m.threadId || m.thread_id || "thread_live_" + Math.random().toString(36).substring(2, 9),
      from: m.from || "",
      to: m.to || [],
      subject: m.subject || "",
      text: m.text || m.preview || "",
      createdAt: m.createdAt || new Date().toISOString(),
    }));
  }
}
