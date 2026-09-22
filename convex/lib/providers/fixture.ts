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

export const FIXTURE_PLACE_CANDIDATES: PlaceCandidateData[] = [
  {
    placeId: "fixture-place-rustic-kettle-01",
    name: "The Rustic Kettle Café & Roastery",
    formattedAddress: "784 Queen St W, Toronto, ON M6J 1E9, Canada",
    phone: "+1 (416) 555-0194",
    websiteUrl: undefined, // Missing website!
    rating: 4.6,
    userRatingsTotal: 187,
    priceLevel: 2,
    category: "independent café",
    businessStatus: "OPERATIONAL",
    weakPresenceSignals: [
      "No active website domain on Google listing",
      "Menu only available as a low-res photo on social media",
      "Conflicting opening hours between Google listing and Instagram bio",
    ],
  },
  {
    placeId: "fixture-place-junction-press-02",
    name: "Junction Press & Roastery",
    formattedAddress: "2984 Dundas St W, Toronto, ON M6P 1Y8, Canada",
    phone: "+1 (416) 555-0182",
    websiteUrl: "http://junctionpress.example.ca",
    rating: 4.3,
    userRatingsTotal: 92,
    priceLevel: 2,
    category: "independent café",
    businessStatus: "OPERATIONAL",
    weakPresenceSignals: [
      "Existing site is not mobile-responsive (fails viewport test)",
      "SSL certificate expired 140 days ago",
    ],
  },
  {
    placeId: "fixture-place-maple-hearth-03",
    name: "Maple Hearth Coffee & Treats",
    formattedAddress: "142 Danforth Ave, Toronto, ON M4K 1N1, Canada",
    phone: "+1 (416) 555-0143",
    websiteUrl: undefined,
    rating: 4.8,
    userRatingsTotal: 215,
    priceLevel: 2,
    category: "independent café",
    businessStatus: "OPERATIONAL",
    weakPresenceSignals: [
      "No official first-party website",
      "Heavy reliance on third-party delivery apps with 30% commission cuts",
    ],
  },
];

export const FIXTURE_SCRAPED_SOURCES: ScrapedSourceData[] = [
  {
    url: "https://instagram.example.ca/rustickettletoronto",
    title: "The Rustic Kettle (@rustickettletoronto) • Instagram profile",
    provider: "firecrawl_scrape",
    httpStatus: 200,
    contentSnippet:
      "West Queen West specialty coffee roastery. Small-batch Ethiopian & Colombian single-origins. Fresh cardamom sourdough buns baked every morning at 6:30 AM. Dog-friendly heated patio.",
    claims: [
      {
        claimKey: "specialty_coffee",
        category: "menu",
        statement: "Roasts small-batch direct-trade Ethiopian and Colombian single-origin beans in-house.",
        rawExcerpt: "Small-batch Ethiopian & Colombian single-origins roasted weekly on Queen West.",
        confidence: "high",
        status: "verified",
      },
      {
        claimKey: "baked_goods",
        category: "menu",
        statement: "Bakes fresh Scandinavian cardamom sourdough buns daily from scratch.",
        rawExcerpt: "Fresh cardamom sourdough buns baked every morning at 6:30 AM.",
        confidence: "high",
        status: "verified",
      },
      {
        claimKey: "dog_friendly_patio",
        category: "services",
        statement: "Features a dog-friendly heated sidewalk patio open year-round.",
        rawExcerpt: "Dog-friendly heated patio.",
        confidence: "high",
        status: "verified",
      },
    ],
  },
  {
    url: "https://blogto.example.ca/cafes/rustic-kettle-toronto",
    title: "The Rustic Kettle Café - Toronto Neighbourhood Guide",
    provider: "firecrawl_search",
    httpStatus: 200,
    contentSnippet:
      "Opened in 2018 by barista-turned-roaster Marcus Vance. Known for cozy exposed-brick interior, communal harvest table, and weekend line-ups for their oat milk cortados and salted chocolate rye cookies.",
    claims: [
      {
        claimKey: "founding_story",
        category: "identity",
        statement: "Founded in 2018 by head roaster Marcus Vance on Queen Street West.",
        rawExcerpt: "Opened in 2018 by barista-turned-roaster Marcus Vance.",
        confidence: "official",
        status: "verified",
      },
      {
        claimKey: "atmosphere_details",
        category: "reputation",
        statement: "Beloved neighborhood community spot with exposed-brick interior and communal harvest table.",
        rawExcerpt: "Known for cozy exposed-brick interior, communal harvest table.",
        confidence: "high",
        status: "verified",
      },
      {
        claimKey: "unconfirmed_catering",
        category: "services",
        statement: "Large group catering and custom birthday cake orders.",
        rawExcerpt: "Notice: Catering availability not listed or verifiable on open web.",
        confidence: "needs_confirmation",
        status: "flagged_unknown", // Missing / unverified!
      },
    ],
  },
];

export class FixturePlacesProvider implements PlacesProvider {
  async search(_query: string, _location: string): Promise<PlaceCandidateData[]> {
    return FIXTURE_PLACE_CANDIDATES;
  }
  async getDetails(placeId: string): Promise<PlaceCandidateData | null> {
    return FIXTURE_PLACE_CANDIDATES.find((c) => c.placeId === placeId) ?? null;
  }
}

export class FixtureFirecrawlProvider implements FirecrawlProvider {
  async auditBusiness(_businessName: string, _domainOrQuery: string, _location: string): Promise<ScrapedSourceData[]> {
    return FIXTURE_SCRAPED_SOURCES;
  }

  async scrapeUrl(url: string): Promise<ScrapeResult> {
    return {
      url,
      title: "The Rustic Kettle Café & Roastery",
      description: "Queen West specialty roaster, single-origin coffees, and Scandinavian baked goods in Toronto.",
      markdown: `# The Rustic Kettle Café & Roastery
784 Queen St W, Toronto, ON M6J 1E9

Small-batch Ethiopian & Colombian single-origins roasted weekly on Queen West. Fresh Scandinavian cardamom sourdough buns baked every morning at 6:30 AM. Heated dog-friendly sidewalk patio.

## Hours of Operation
- Monday – Friday: 7:00 AM – 6:00 PM
- Saturday – Sunday: 8:00 AM – 5:00 PM

## Contact
Email: owner@rustickettle-example.ca
Phone: +1 (416) 555-0194

© 2019 The Rustic Kettle. All Rights Reserved.`,
      links: [
        "https://rustickettle-example.ca/menu",
        "https://rustickettle-example.ca/about",
        "https://rustickettle-example.ca/contact",
      ],
      statusCode: 200,
      metadata: {
        title: "The Rustic Kettle Café & Roastery",
        description: "Queen West specialty roaster, single-origin coffees, and Scandinavian baked goods.",
        statusCode: 200,
      },
    };
  }
}

export class FixtureOpenAIProvider implements OpenAIProvider {
  async generateBusinessBrief(_input: {
    businessName: string;
    address: string;
    category: string;
    evidence: Array<{ claimKey: string; statement: string; category: string }>;
  }): Promise<GeneratedBriefOutput> {
    return {
      headline: "The Rustic Kettle: West Queen West Specialty Roaster with High Foot Traffic but No Digital Storefront",
      summary:
        "The Rustic Kettle is an acclaimed independent coffee roaster and bakery operating at 784 Queen St West since 2018. Despite stellar reviews (4.6 stars, 187 reviews) and cult-favorite pastries, they have no first-party website. They currently lose high-margin bean sales and mobile takeout orders to nearby competitors.",
      diagnosis: {
        missingWebsite: true,
        staleContent: true,
        mobileIssues: true,
        missingMenuPdf: true,
        opportunities: [
          "Direct-to-consumer bagged coffee sales without wholesale middleman cuts",
          "Mobile-first daily pastry and coffee pre-ordering to reduce morning counter bottlenecks",
          "Search-optimized neighborhood presence for Queen West foot traffic and tourists",
        ],
      },
      strengths: [
        { title: "Direct-trade micro-roasting in house", claimKeyReference: "specialty_coffee" },
        { title: "Signature scratch-made cardamom buns", claimKeyReference: "baked_goods" },
        { title: "Dog-friendly heated outdoor seating", claimKeyReference: "dog_friendly_patio" },
      ],
      unknowns: [
        "Corporate catering packages — not confirmed on public web; labeled as needs operator confirmation.",
      ],
      operatorNotes:
        "Opportunity is high. Emphasize that the preview site is already live and loaded with their authentic coffee beans and pastry offerings.",
    };
  }

  async generateWebsiteSpec(_input: {
    businessName: string;
    brief: GeneratedBriefOutput;
    evidence: Array<{ claimKey: string; statement: string; category: string }>;
  }): Promise<GeneratedWebsiteSpecOutput> {
    return {
      businessIdentity: {
        name: "The Rustic Kettle Café & Roastery",
        tagline: "Small-Batch Roastery & Scratch Bakery on Queen West",
        vertical: "independent café",
        neighborhood: "West Queen West",
        city: "Toronto, ON",
      },
      theme: {
        primaryColor: "#2b1810", // Warm roasted espresso
        accentColor: "#c87d55", // Terracotta / warm cinnamon
        fontHeading: "Fraunces, serif",
        fontBody: "Inter, sans-serif",
        styleVariant: "warm-artisan",
      },
      navigation: [
        { label: "Our Story", anchor: "#about" },
        { label: "Coffee & Bakery", anchor: "#offerings" },
        { label: "Hours & Patio", anchor: "#location" },
        { label: "Contact", anchor: "#contact" },
      ],
      hero: {
        badge: "Roasted Fresh in West Queen West • Founded 2018",
        headline: "Thoughtfully Roasted Coffee & Hearth-Baked Morning Pastries",
        subheadline:
          "Single-origin micro-lots sourced with dignity, alongside warm cardamom sourdough buns fresh from our hearth every morning.",
        primaryCta: { label: "Explore Today's Bakes & Beans", action: "#offerings" },
        secondaryCta: { label: "Find Us on Queen St W", action: "#location" },
        citedClaimKeys: ["specialty_coffee", "baked_goods", "founding_story"],
      },
      aboutSection: {
        title: "Crafted with Intention on Queen West",
        storyParagraphs: [
          "Since opening our doors in 2018 at 784 Queen St West, The Rustic Kettle has been a gathering place for neighbors who appreciate the craft of small-batch coffee.",
          "Every bean is roasted on-site in small batches to highlight sweet, clean terroir. Our kitchen rises before dawn to prepare sourdough viennoiserie, including our signature Swedish cardamom buns.",
        ],
        highlights: [
          "100% Direct-Trade Micro-lots",
          "House-Cultured Sourdough Pastries Daily",
          "Heated Sidewalk Patio Welcoming Dogs",
        ],
        citedClaimKeys: ["founding_story", "specialty_coffee", "baked_goods", "dog_friendly_patio"],
      },
      offeringsSection: {
        title: "Signature Coffee & Hearth Bakes",
        description: "Seasonal roasts and daily bakes available for sit-in or takeaway.",
        items: [
          {
            name: "Guji Highland Natural (Ethiopia)",
            description: "Notes of blueberry compote, jasmine blossom, and dark honeycomb. Roasted weekly.",
            priceDisplay: "$22.00 / 300g bag",
            badge: "Roaster's Pick",
            citedClaimKey: "specialty_coffee",
          },
          {
            name: "Cardamom Sourdough Buns",
            description: "Crushed green cardamom, slow-fermented organic butter pastry, pearl sugar glaze.",
            priceDisplay: "$4.75",
            badge: "Baked Daily",
            citedClaimKey: "baked_goods",
          },
          {
            name: "Huila Pink Bourbon (Colombia)",
            description: "Silky stone fruit, pink guava, and brown sugar sweetness with sparkling acidity.",
            priceDisplay: "$21.50 / 300g bag",
            badge: "Single Origin",
            citedClaimKey: "specialty_coffee",
          },
          {
            name: "Oat Milk Cortado",
            description: "Double shot of house espresso balanced with velvety steamed Minor Figures oat milk.",
            priceDisplay: "$4.50",
            badge: "Local Favorite",
            citedClaimKey: "specialty_coffee",
          },
        ],
        citedClaimKeys: ["specialty_coffee", "baked_goods"],
      },
      hoursAndLocation: {
        address: "784 Queen St W, Toronto, ON M6J 1E9",
        hours: [
          { days: "Monday – Friday", open: "7:00 AM", close: "6:00 PM" },
          { days: "Saturday – Sunday", open: "8:00 AM", close: "5:00 PM" },
        ],
        note: "Heated sidewalk patio is open daily weather permitting. Furry companions welcome!",
        citedClaimKeys: ["dog_friendly_patio"],
      },
      contactSection: {
        email: "owner@rustickettle-example.ca",
        phone: "+1 (416) 555-0194",
        reservationNotice: "Walk-ins warmly welcomed. Group bookings of 6+ please call ahead.",
        citedClaimKeys: ["atmosphere_details"],
      },
      unknownItems: [
        "Corporate catering packages (unconfirmed on public record — marked as needs confirmation)",
      ],
    };
  }

  async generateOutreachDraft(input: {
    businessName: string;
    ownerName?: string;
    brief: GeneratedBriefOutput;
    shareUrl: string;
  }): Promise<GeneratedOutreachOutput> {
    const greeting = input.ownerName ? `Hi ${input.ownerName},` : `Hi Marcus & team,`;
    const subject = `Built a website preview for ${input.businessName}`;
    const bodyText = `${greeting}

I noticed that while The Rustic Kettle has a loyal following on Queen West and rave reviews for your Ethiopian roasts and cardamom sourdough, you don't currently have a dedicated mobile website.

Instead of just pitching web design, we put together an interactive, working preview of what your official digital storefront could look like:
${input.shareUrl}

It highlights your seasonal micro-lot beans, daily bakery items, and your dog-friendly patio.

We can turn this into your official domain with mobile pre-ordering and SEO setup for $1,250 CAD total on a 7-day turnaround.

If you'd like to adjust anything on the preview or chat, feel free to reply directly to this email.

Best regards,
Storefront Desk Team`;

    const bodyHtml = `<p>${greeting}</p>
<p>I noticed that while The Rustic Kettle has a loyal following on Queen West and rave reviews for your Ethiopian roasts and cardamom sourdough, you don't currently have a dedicated mobile website.</p>
<p>Instead of just pitching web design, we put together an interactive, working preview of what your official digital storefront could look like:<br/>
<strong><a href="${input.shareUrl}">${input.shareUrl}</a></strong></p>
<p>It highlights your seasonal micro-lot beans, daily bakery items, and your dog-friendly patio.</p>
<p>We can turn this into your official domain with mobile pre-ordering and SEO setup for <strong>$1,250 CAD</strong> total on a 7-day turnaround.</p>
<p>If you'd like to adjust anything on the preview or chat, feel free to reply directly to this email.</p>
<p>Best regards,<br/>Storefront Desk Team</p>`;

    return {
      subject,
      bodyText,
      bodyHtml,
      proposedScope: [
        "Responsive 5-page digital storefront",
        "Coffee beans & bakery showcase with weekly roaster updates",
        "Mobile-first navigation & one-tap directions",
        "Google Business Profile sync & local SEO metadata",
        "30 days post-launch hosting & maintenance included",
      ],
      proposedPriceCents: 125000, // $1,250.00 CAD
      proposedTimelineDays: 7,
    };
  }

  async classifyReply(input: {
    originalSubject: string;
    originalBody: string;
    replySubject: string;
    replyText: string;
  }): Promise<ReplyClassificationOutput> {
    const text = input.replyText.toLowerCase();
    if (text.includes("unsubscribe") || text.includes("remove me") || text.includes("stop emailing")) {
      return {
        classification: "unsubscribe",
        confidenceScore: 0.98,
        reasoning: "Explicit unsubscribe / opt-out request.",
      };
    }
    if (text.includes("budget") || text.includes("$1,000") || text.includes("scope") || text.includes("subscription")) {
      return {
        classification: "requested_price_change",
        confidenceScore: 0.94,
        proposedChanges: {
          requestedScope: [
            "Responsive 5-page digital storefront",
            "Wholesale coffee bean subscription ordering portal",
            "Coffee beans & bakery showcase with weekly roaster updates",
            "Google Business Profile sync & local SEO metadata",
          ],
          requestedPriceCents: 100000, // $1,000.00 CAD
          requestedTimelineDays: 10,
          notes: "Client requested wholesale subscription portal in scope, counter-offered $1,000 CAD with a 10-day timeline.",
        },
        reasoning: "Client expressed clear interest but counter-proposed scope addition (bean subscription) and lower price ($1,000 CAD) over 10 days.",
      };
    }
    return {
      classification: "interested",
      confidenceScore: 0.85,
      reasoning: "Client expressed general interest in moving forward.",
    };
  }
}

export class FixtureAgentMailProvider implements AgentMailProvider {
  async sendMessage(_input: {
    inboxId: string;
    to: string[];
    subject: string;
    text: string;
    html?: string;
    inReplyToMessageId?: string;
  }): Promise<{ messageId: string; threadId: string }> {
    const id = "msg_fixture_" + Math.random().toString(36).substring(2, 10);
    const threadId = "thread_fixture_" + Math.random().toString(36).substring(2, 10);
    return { messageId: id, threadId };
  }

  async listMessages(_inboxId: string): Promise<AgentMailMessageItem[]> {
    return [
      {
        messageId: "msg_fixture_welcome",
        threadId: "thread_fixture_welcome",
        from: "admin@agentmail.to",
        to: ["break-solutions@agentmail.to"],
        subject: "Welcome to AgentMail, your inbox is ready",
        text: "Welcome to AgentMail. Your inbox break-solutions@agentmail.to is live and ready for outbound pitches and inbound replies.",
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
