import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { FIXTURE_PLACE_CANDIDATES, FIXTURE_SCRAPED_SOURCES } from "./lib/providers";
function computeHash(subject: string, bodyText: string, priceCents: number): string {
  const contentToHash = `${subject}|${bodyText}|${priceCents}`;
  let hash = 0;
  for (let i = 0; i < contentToHash.length; i++) {
    hash = (hash << 5) - hash + contentToHash.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}`;
}


export const reset = mutation({
  args: {},
  returns: v.object({
    workspaceId: v.id("workspaces"),
    campaignId: v.id("campaigns"),
    prospectId: v.id("prospects"),
    previewSlug: v.string(),
  }),
  handler: async (ctx) => {
    // 1. Clean up existing demo records
    const existingWorkspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", "smb-growth-desk"))
      .collect();

    for (const ws of existingWorkspaces) {
      const campaigns = await ctx.db.query("campaigns").withIndex("by_workspaceId", (q) => q.eq("workspaceId", ws._id)).collect();
      for (const c of campaigns) {
        const prospects = await ctx.db.query("prospects").withIndex("by_campaignId", (q) => q.eq("campaignId", c._id)).collect();
        for (const p of prospects) {
          const briefs = await ctx.db.query("businessBriefs").withIndex("by_prospectId", (q) => q.eq("prospectId", p._id)).collect();
          for (const b of briefs) await ctx.db.delete(b._id);
          const specs = await ctx.db.query("websiteSpecs").withIndex("by_prospectId", (q) => q.eq("prospectId", p._id)).collect();
          for (const s of specs) await ctx.db.delete(s._id);
          const drafts = await ctx.db.query("outreachDrafts").withIndex("by_prospectId", (q) => q.eq("prospectId", p._id)).collect();
          for (const d of drafts) await ctx.db.delete(d._id);
          const proposals = await ctx.db.query("proposals").withIndex("by_prospectId", (q) => q.eq("prospectId", p._id)).collect();
          for (const pr of proposals) await ctx.db.delete(pr._id);
          const claims = await ctx.db.query("evidenceClaims").withIndex("by_prospectId", (q) => q.eq("prospectId", p._id)).collect();
          for (const cl of claims) await ctx.db.delete(cl._id);
          const docs = await ctx.db.query("sourceDocuments").withIndex("by_prospectId", (q) => q.eq("prospectId", p._id)).collect();
          for (const doc of docs) await ctx.db.delete(doc._id);
          const msgs = await ctx.db.query("agentMailMessages").withIndex("by_prospectId", (q) => q.eq("prospectId", p._id)).collect();
          for (const m of msgs) await ctx.db.delete(m._id);
          const threads = await ctx.db.query("agentMailThreads").withIndex("by_prospectId", (q) => q.eq("prospectId", p._id)).collect();
          for (const t of threads) await ctx.db.delete(t._id);
          const schedules = await ctx.db.query("followupSchedules").withIndex("by_prospectId", (q) => q.eq("prospectId", p._id)).collect();
          for (const sc of schedules) await ctx.db.delete(sc._id);
          await ctx.db.delete(p._id);
        }
        const candidates = await ctx.db.query("placesCandidates").withIndex("by_campaignId", (q) => q.eq("campaignId", c._id)).collect();
        for (const can of candidates) await ctx.db.delete(can._id);
        const searches = await ctx.db.query("discoverySearches").withIndex("by_campaignId", (q) => q.eq("campaignId", c._id)).collect();
        for (const sr of searches) await ctx.db.delete(sr._id);
        await ctx.db.delete(c._id);
      }
      const ledger = await ctx.db.query("activityLedger").withIndex("by_workspaceId_and_at", (q) => q.eq("workspaceId", ws._id)).collect();
      for (const l of ledger) await ctx.db.delete(l._id);
      const members = await ctx.db.query("workspaceMembers").withIndex("by_workspaceId", (q) => q.eq("workspaceId", ws._id)).collect();
      for (const m of members) await ctx.db.delete(m._id);
      await ctx.db.delete(ws._id);
    }

    const now = Date.now();

    // 2. Create Workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name: "North American SMB Growth Desk",
      slug: "smb-growth-desk",
      ownerId: "demo_operator_default",
      defaultCurrency: "CAD",
      isDemo: true,
      createdAt: now,
    });

    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      tokenIdentifier: "demo_operator_default",
      email: "operator@storefrontdesk.local",
      name: "Primary Desk Operator",
      role: "owner",
      createdAt: now,
    });

    // 3. Create Campaign in assisted_followups mode
    const campaignId = await ctx.db.insert("campaigns", {
      workspaceId,
      name: "Toronto Independent Cafés & Bakeries",
      category: "independent café",
      location: "Toronto, ON",
      mode: "assisted_followups",
      status: "active",
      maxFollowups: 2,
      followupDelayDays: 3,
      createdAt: now,
      updatedAt: now,
    });

    // 4. Create Discovery Search + 3 Candidates
    const searchId = await ctx.db.insert("discoverySearches", {
      workspaceId,
      campaignId,
      query: "independent café",
      location: "Toronto, ON",
      provider: "fixture",
      status: "completed",
      resultCount: FIXTURE_PLACE_CANDIDATES.length,
      searchedAt: now - 3600000,
    });

    let primaryCandidateId: any = null;
    for (const c of FIXTURE_PLACE_CANDIDATES) {
      const cid = await ctx.db.insert("placesCandidates", {
        workspaceId,
        campaignId,
        searchId,
        placeId: c.placeId,
        name: c.name,
        formattedAddress: c.formattedAddress,
        phone: c.phone,
        websiteUrl: c.websiteUrl,
        rating: c.rating,
        userRatingsTotal: c.userRatingsTotal,
        priceLevel: c.priceLevel,
        businessStatus: c.businessStatus,
        category: c.category,
        weakPresenceSignals: c.weakPresenceSignals,
        status: c.placeId === "fixture-place-rustic-kettle-01" ? "approved" : "found",
        discoveredAt: now - 3600000,
      });
      if (c.placeId === "fixture-place-rustic-kettle-01") {
        primaryCandidateId = cid;
      }
    }

    // 5. Create Approved Prospect
    const prospectId = await ctx.db.insert("prospects", {
      workspaceId,
      campaignId,
      candidateId: primaryCandidateId,
      name: "The Rustic Kettle Café & Roastery",
      vertical: "independent café",
      address: "784 Queen St W, Toronto, ON M6J 1E9, Canada",
      phone: "+1 (416) 555-0194",
      targetEmail: "owner@rustickettle-example.ca",
      contactName: "Marcus Vance",
      approvalStatus: "approved",
      outreachStatus: "pending_approval",
      followupCount: 0,
      isSuppressed: false,
      createdAt: now - 3000000,
      updatedAt: now,
    });

    await ctx.db.patch(primaryCandidateId, { prospectId });

    // 6. Create Source Documents & Evidence Claims
    const claimIds: Record<string, any> = {};
    for (const s of FIXTURE_SCRAPED_SOURCES) {
      const docId = await ctx.db.insert("sourceDocuments", {
        workspaceId,
        prospectId,
        url: s.url,
        title: s.title,
        provider: s.provider,
        status: "valid",
        httpStatus: s.httpStatus,
        retrievedAt: now - 2500000,
        rawTextSnippet: s.contentSnippet,
      });

      for (const cl of s.claims) {
        const claimId = await ctx.db.insert("evidenceClaims", {
          workspaceId,
          prospectId,
          sourceDocumentId: docId,
          claimKey: cl.claimKey,
          category: cl.category,
          statement: cl.statement,
          rawExcerpt: cl.rawExcerpt,
          confidence: cl.confidence,
          status: cl.status,
          recordedAt: now - 2500000,
        });
        claimIds[cl.claimKey] = claimId;
      }
    }

    const allClaimIds = Object.values(claimIds);

    // 7. Create Business Brief
    const briefId = await ctx.db.insert("businessBriefs", {
      workspaceId,
      prospectId,
      version: 1,
      headline: "The Rustic Kettle: West Queen West Specialty Roaster with High Foot Traffic but No Digital Storefront",
      summary:
        "The Rustic Kettle is an acclaimed independent coffee roaster and bakery operating at 784 Queen St West since 2018. Despite stellar reviews (4.6 stars, 187 reviews) and cult-favorite pastries, they have no first-party website. They currently lose high-margin bean sales and mobile takeout orders to nearby competitors.",
      citedEvidenceIds: allClaimIds,
      onlinePresenceDiagnosis: {
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
        { title: "Direct-trade micro-roasting in house", evidenceId: claimIds["specialty_coffee"] },
        { title: "Signature scratch-made cardamom buns", evidenceId: claimIds["baked_goods"] },
        { title: "Dog-friendly heated outdoor seating", evidenceId: claimIds["dog_friendly_patio"] },
      ],
      unknowns: [
        "Corporate catering packages — not confirmed on public web; labeled as needs operator confirmation.",
      ],
      operatorNotes:
        "Opportunity is high. Emphasize that the preview site is already live and loaded with their authentic coffee beans and pastry offerings.",
      createdAt: now - 2000000,
    });

    // 8. Create Website Spec
    const previewSlug = "rustic-kettle-preview-v1";
    const websiteSpecId = await ctx.db.insert("websiteSpecs", {
      workspaceId,
      prospectId,
      version: 1,
      slug: previewSlug,
      businessIdentity: {
        name: "The Rustic Kettle Café & Roastery",
        tagline: "Small-Batch Roastery & Scratch Bakery on Queen West",
        vertical: "independent café",
        neighborhood: "West Queen West",
        city: "Toronto, ON",
      },
      theme: {
        primaryColor: "#2b1810",
        accentColor: "#c87d55",
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
        evidenceIds: [claimIds["specialty_coffee"], claimIds["baked_goods"], claimIds["founding_story"]],
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
        evidenceIds: [claimIds["founding_story"], claimIds["specialty_coffee"], claimIds["baked_goods"], claimIds["dog_friendly_patio"]],
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
            evidenceId: claimIds["specialty_coffee"],
          },
          {
            name: "Cardamom Sourdough Buns",
            description: "Crushed green cardamom, slow-fermented organic butter pastry, pearl sugar glaze.",
            priceDisplay: "$4.75",
            badge: "Baked Daily",
            evidenceId: claimIds["baked_goods"],
          },
          {
            name: "Huila Pink Bourbon (Colombia)",
            description: "Silky stone fruit, pink guava, and brown sugar sweetness with sparkling acidity.",
            priceDisplay: "$21.50 / 300g bag",
            badge: "Single Origin",
            evidenceId: claimIds["specialty_coffee"],
          },
          {
            name: "Oat Milk Cortado",
            description: "Double shot of house espresso balanced with velvety steamed Minor Figures oat milk.",
            priceDisplay: "$4.50",
            badge: "Local Favorite",
            evidenceId: claimIds["specialty_coffee"],
          },
        ],
        evidenceIds: [claimIds["specialty_coffee"], claimIds["baked_goods"]],
      },
      hoursAndLocation: {
        address: "784 Queen St W, Toronto, ON M6J 1E9",
        hours: [
          { days: "Monday – Friday", open: "7:00 AM", close: "6:00 PM" },
          { days: "Saturday – Sunday", open: "8:00 AM", close: "5:00 PM" },
        ],
        note: "Heated sidewalk patio is open daily weather permitting. Furry companions welcome!",
        evidenceIds: [claimIds["dog_friendly_patio"]],
      },
      contactSection: {
        email: "owner@rustickettle-example.ca",
        phone: "+1 (416) 555-0194",
        reservationNotice: "Walk-ins warmly welcomed. Group bookings of 6+ please call ahead.",
        evidenceIds: [claimIds["atmosphere_details"]],
      },
      unknownItems: [
        "Corporate catering packages (unconfirmed on public record — marked as needs confirmation)",
      ],
      isPublished: true,
      publishedAt: now - 2000000,
      createdAt: now - 2000000,
    });

    // 9. Create Outreach Draft (Pending approval)
    const draftSubject = "Built a website preview for The Rustic Kettle Café & Roastery";
    const draftText = `Hi Marcus & team,

I noticed that while The Rustic Kettle has a loyal following on Queen West and rave reviews for your Ethiopian roasts and cardamom sourdough, you don't currently have a dedicated mobile website.

Instead of just pitching web design, we put together an interactive, working preview of what your official digital storefront could look like:
/preview/${previewSlug}

It highlights your seasonal micro-lot beans, daily bakery items, and your dog-friendly patio.

We can turn this into your official domain with mobile pre-ordering and SEO setup for $1,250 CAD total on a 7-day turnaround.

If you'd like to adjust anything on the preview or chat, feel free to reply directly to this email.

Best regards,
Storefront Desk Team`;

    const draftHtml = `<p>Hi Marcus &amp; team,</p>
<p>I noticed that while The Rustic Kettle has a loyal following on Queen West and rave reviews for your Ethiopian roasts and cardamom sourdough, you don't currently have a dedicated mobile website.</p>
<p>Instead of just pitching web design, we put together an interactive, working preview of what your official digital storefront could look like:<br/>
<strong><a href="/preview/${previewSlug}">/preview/${previewSlug}</a></strong></p>
<p>It highlights your seasonal micro-lot beans, daily bakery items, and your dog-friendly patio.</p>
<p>We can turn this into your official domain with mobile pre-ordering and SEO setup for <strong>$1,250 CAD</strong> total on a 7-day turnaround.</p>
<p>If you'd like to adjust anything on the preview or chat, feel free to reply directly to this email.</p>
<p>Best regards,<br/>Storefront Desk Team</p>`;

    const draftId = await ctx.db.insert("outreachDrafts", {
      workspaceId,
      prospectId,
      version: 1,
      recipientEmail: "owner@rustickettle-example.ca",
      subject: draftSubject,
      bodyText: draftText,
      bodyHtml: draftHtml,
      shareUrl: `/preview/${previewSlug}`,
      proposedScope: [
        "Responsive 5-page digital storefront",
        "Coffee beans & bakery showcase with weekly roaster updates",
        "Mobile-first navigation & one-tap directions",
        "Google Business Profile sync & local SEO metadata",
        "30 days post-launch hosting & maintenance included",
      ],
      proposedPriceCents: 125000,
      proposedTimelineDays: 7,
      currency: "CAD",
      approvalStatus: "pending_approval",
      hashOfContent: computeHash(draftSubject, draftText, 125000),
      createdAt: now - 1500000,
    });

    // 10. Create Commercial Proposal v1
    const proposalId = await ctx.db.insert("proposals", {
      workspaceId,
      prospectId,
      version: 1,
      scopeItems: [
        "Responsive 5-page digital storefront",
        "Coffee beans & bakery showcase with weekly roaster updates",
        "Mobile-first navigation & one-tap directions",
        "Google Business Profile sync & local SEO metadata",
        "30 days post-launch hosting & maintenance included",
      ],
      priceCents: 125000,
      timelineDays: 7,
      currency: "CAD",
      termsSummary: "50% upfront deposit on contract signature, balance due upon live DNS launch. 30 days support.",
      status: "proposed_by_operator",
      isCommerciallyBinding: false,
      humanDecisionRequired: false,
      createdAt: now - 1500000,
    });

    // Link current artifacts to prospect
    await ctx.db.patch(prospectId, {
      currentBriefId: briefId,
      currentWebsiteSpecId: websiteSpecId,
      currentDraftId: draftId,
      currentProposalId: proposalId,
      outreachStatus: "pending_approval",
    });

    // 11. Record seed ledger history
    await ctx.db.insert("activityLedger", {
      workspaceId,
      campaignId,
      prospectId,
      actor: "system",
      kind: "demo_seeded",
      summary: "Seeded complete fixture hero loop for 'The Rustic Kettle Café & Roastery' in Toronto, ON.",
      at: now,
    });

    return {
      workspaceId,
      campaignId,
      prospectId,
      previewSlug,
    };
  },
});
