import { describe, expect, it } from "vitest";
import {
  FixturePlacesProvider,
  FixtureFirecrawlProvider,
  FixtureOpenAIProvider,
  FixtureAgentMailProvider,
} from "../convex/lib/providers/fixture";

describe("Deterministic Provider Fixtures", () => {
  it("provides normalized Google Places candidates with weak presence signals", async () => {
    const places = new FixturePlacesProvider();
    const candidates = await places.search("independent café", "Toronto, ON");

    expect(candidates.length).toBeGreaterThanOrEqual(1);
    const primary = candidates.find((c) => c.placeId === "fixture-place-rustic-kettle-01");
    expect(primary).toBeDefined();
    expect(primary?.name).toBe("The Rustic Kettle Café & Roastery");
    expect(primary?.rating).toBe(4.6);
    expect(primary?.weakPresenceSignals.length).toBeGreaterThanOrEqual(2);
    expect(primary?.weakPresenceSignals[0]).toContain("No active website domain");
  });

  it("extracts Firecrawl sources including verified claims and an unconfirmed detail", async () => {
    const firecrawl = new FixtureFirecrawlProvider();
    const sources = await firecrawl.auditBusiness(
      "The Rustic Kettle",
      "The Rustic Kettle",
      "784 Queen St W, Toronto, ON"
    );

    expect(sources.length).toBe(2);
    const allClaims = sources.flatMap((s) => s.claims);

    const verifiedCoffee = allClaims.find((c) => c.claimKey === "specialty_coffee");
    expect(verifiedCoffee).toBeDefined();
    expect(verifiedCoffee?.status).toBe("verified");
    expect(verifiedCoffee?.statement).toContain("Ethiopian and Colombian");

    // Must have at least one unconfirmed / missing detail flagged
    const unconfirmedCatering = allClaims.find((c) => c.claimKey === "unconfirmed_catering");
    expect(unconfirmedCatering).toBeDefined();
    expect(unconfirmedCatering?.status).toBe("flagged_unknown");
    expect(unconfirmedCatering?.confidence).toBe("needs_confirmation");
  });

  it("generates structured brief, website spec, outreach draft, and classifies counteroffer", async () => {
    const ai = new FixtureOpenAIProvider();

    // 1. Brief
    const brief = await ai.generateBusinessBrief({
      businessName: "The Rustic Kettle",
      address: "784 Queen St W",
      category: "independent café",
      evidence: [],
    });
    expect(brief.headline).toContain("The Rustic Kettle");
    expect(brief.diagnosis.missingWebsite).toBe(true);
    expect(brief.unknowns.length).toBeGreaterThan(0);

    // 2. Spec
    const spec = await ai.generateWebsiteSpec({
      businessName: "The Rustic Kettle",
      brief,
      evidence: [],
    });
    expect(spec.theme.primaryColor).toBe("#2b1810");
    expect(spec.hero.citedClaimKeys).toContain("specialty_coffee");
    expect(spec.offeringsSection.items.length).toBeGreaterThanOrEqual(3);
    expect(spec.unknownItems.length).toBeGreaterThan(0);

    // 3. Draft
    const draft = await ai.generateOutreachDraft({
      businessName: "The Rustic Kettle",
      brief,
      shareUrl: "/preview/rustic-kettle-preview-v1",
    });
    expect(draft.proposedPriceCents).toBe(125000);
    expect(draft.proposedTimelineDays).toBe(7);
    expect(draft.bodyText).toContain("/preview/rustic-kettle-preview-v1");

    // 4. Counteroffer reply classification
    const classification = await ai.classifyReply({
      originalSubject: draft.subject,
      originalBody: draft.bodyText,
      replySubject: "Re: " + draft.subject,
      replyText: "We want to move forward, but our budget is firm at $1,000 CAD with 10 days delivery.",
    });
    expect(classification.classification).toBe("requested_price_change");
    expect(classification.proposedChanges?.requestedPriceCents).toBe(100000);
    expect(classification.proposedChanges?.requestedTimelineDays).toBe(10);
  });

  it("handles agentmail simulated sending with unique messageId and threadId", async () => {
    const mail = new FixtureAgentMailProvider();
    const res = await mail.sendMessage({
      inboxId: "inbox_test",
      to: ["test@example.ca"],
      subject: "Test",
      text: "Test body",
    });

    expect(res.messageId).toContain("msg_fixture_");
    expect(res.threadId).toContain("thread_fixture_");
  });
});
