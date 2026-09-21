import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getOpenAIProvider } from "./lib/providers";

export const getProspectForGeneration = internalQuery({
  args: { prospectId: v.id("prospects") },
  handler: async (ctx, { prospectId }) => {
    const prospect = await ctx.db.get(prospectId);
    if (!prospect) return null;

    const claims = await ctx.db
      .query("evidenceClaims")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .collect();

    return { prospect, claims };
  },
});

export const generateArtifacts = internalAction({
  args: { prospectId: v.id("prospects") },
  handler: async (ctx, { prospectId }) => {
    const data = await ctx.runQuery(internal.generator.getProspectForGeneration, { prospectId });
    if (!data) return;

    const { prospect, claims } = data;
    const ai = getOpenAIProvider();

    // Map claimKey to Id
    const claimKeyToId = new Map(claims.map((c) => [c.claimKey, c._id]));

    // 1. Generate Business Brief
    const briefOutput = await ai.generateBusinessBrief({
      businessName: prospect.name,
      address: prospect.address,
      category: prospect.vertical,
      evidence: claims.map((c) => ({
        claimKey: c.claimKey,
        statement: c.statement,
        category: c.category,
      })),
    });

    // 2. Generate Website Spec
    const specOutput = await ai.generateWebsiteSpec({
      businessName: prospect.name,
      brief: briefOutput,
      evidence: claims.map((c) => ({
        claimKey: c.claimKey,
        statement: c.statement,
        category: c.category,
      })),
    });

    // Resolve cited evidence IDs
    const resolveClaimIds = (keys: string[]) =>
      keys.map((k) => claimKeyToId.get(k)).filter((id): id is NonNullable<typeof id> => id !== undefined);

    const slug = `${prospect.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")}-preview-v1`;

    const shareUrl = `/preview/${slug}`;

    // 3. Generate Outreach Draft
    const draftOutput = await ai.generateOutreachDraft({
      businessName: prospect.name,
      ownerName: prospect.contactName,
      brief: briefOutput,
      shareUrl,
    });

    await ctx.runMutation(internal.generator.saveArtifacts, {
      prospectId,
      slug,
      brief: {
        headline: briefOutput.headline,
        summary: briefOutput.summary,
        citedEvidenceIds: claims.map((c) => c._id),
        onlinePresenceDiagnosis: briefOutput.diagnosis,
        strengths: briefOutput.strengths.map((s) => ({
          title: s.title,
          evidenceId: s.claimKeyReference ? claimKeyToId.get(s.claimKeyReference) : undefined,
        })),
        unknowns: briefOutput.unknowns,
        operatorNotes: briefOutput.operatorNotes,
      },
      spec: {
        slug,
        businessIdentity: specOutput.businessIdentity,
        theme: specOutput.theme,
        navigation: specOutput.navigation,
        hero: {
          badge: specOutput.hero.badge,
          headline: specOutput.hero.headline,
          subheadline: specOutput.hero.subheadline,
          primaryCta: specOutput.hero.primaryCta,
          secondaryCta: specOutput.hero.secondaryCta,
          evidenceIds: resolveClaimIds(specOutput.hero.citedClaimKeys),
        },
        aboutSection: {
          title: specOutput.aboutSection.title,
          storyParagraphs: specOutput.aboutSection.storyParagraphs,
          highlights: specOutput.aboutSection.highlights,
          evidenceIds: resolveClaimIds(specOutput.aboutSection.citedClaimKeys),
        },
        offeringsSection: {
          title: specOutput.offeringsSection.title,
          description: specOutput.offeringsSection.description,
          items: specOutput.offeringsSection.items.map((it) => ({
            name: it.name,
            description: it.description,
            priceDisplay: it.priceDisplay,
            badge: it.badge,
            evidenceId: it.citedClaimKey ? claimKeyToId.get(it.citedClaimKey) : undefined,
          })),
          evidenceIds: resolveClaimIds(specOutput.offeringsSection.citedClaimKeys),
        },
        hoursAndLocation: {
          address: specOutput.hoursAndLocation.address,
          hours: specOutput.hoursAndLocation.hours,
          note: specOutput.hoursAndLocation.note,
          evidenceIds: resolveClaimIds(specOutput.hoursAndLocation.citedClaimKeys),
        },
        contactSection: {
          email: specOutput.contactSection.email,
          phone: specOutput.contactSection.phone,
          reservationNotice: specOutput.contactSection.reservationNotice,
          evidenceIds: resolveClaimIds(specOutput.contactSection.citedClaimKeys),
        },
        unknownItems: specOutput.unknownItems,
      },
      draft: {
        recipientEmail: prospect.targetEmail,
        subject: draftOutput.subject,
        bodyText: draftOutput.bodyText,
        bodyHtml: draftOutput.bodyHtml,
        shareUrl,
        proposedScope: draftOutput.proposedScope,
        proposedPriceCents: draftOutput.proposedPriceCents,
        proposedTimelineDays: draftOutput.proposedTimelineDays,
        currency: "CAD",
      },
      proposal: {
        scopeItems: draftOutput.proposedScope,
        priceCents: draftOutput.proposedPriceCents,
        timelineDays: draftOutput.proposedTimelineDays,
        currency: "CAD",
        termsSummary: "50% upfront deposit on contract signature, balance due upon live DNS launch. 30 days support.",
      },
    });
  },
});

export const saveArtifacts = internalMutation({
  args: {
    prospectId: v.id("prospects"),
    slug: v.string(),
    brief: v.object({
      headline: v.string(),
      summary: v.string(),
      citedEvidenceIds: v.array(v.id("evidenceClaims")),
      onlinePresenceDiagnosis: v.object({
        missingWebsite: v.boolean(),
        staleContent: v.boolean(),
        mobileIssues: v.boolean(),
        missingMenuPdf: v.boolean(),
        opportunities: v.array(v.string()),
      }),
      strengths: v.array(
        v.object({
          title: v.string(),
          evidenceId: v.optional(v.id("evidenceClaims")),
        })
      ),
      unknowns: v.array(v.string()),
      operatorNotes: v.optional(v.string()),
    }),
    spec: v.object({
      slug: v.string(),
      businessIdentity: v.object({
        name: v.string(),
        tagline: v.string(),
        vertical: v.string(),
        neighborhood: v.string(),
        city: v.string(),
      }),
      theme: v.object({
        primaryColor: v.string(),
        accentColor: v.string(),
        fontHeading: v.string(),
        fontBody: v.string(),
        styleVariant: v.string(),
      }),
      navigation: v.array(v.object({ label: v.string(), anchor: v.string() })),
      hero: v.object({
        badge: v.string(),
        headline: v.string(),
        subheadline: v.string(),
        primaryCta: v.object({ label: v.string(), action: v.string() }),
        secondaryCta: v.optional(v.object({ label: v.string(), action: v.string() })),
        evidenceIds: v.array(v.id("evidenceClaims")),
      }),
      aboutSection: v.object({
        title: v.string(),
        storyParagraphs: v.array(v.string()),
        highlights: v.array(v.string()),
        evidenceIds: v.array(v.id("evidenceClaims")),
      }),
      offeringsSection: v.object({
        title: v.string(),
        description: v.string(),
        items: v.array(
          v.object({
            name: v.string(),
            description: v.string(),
            priceDisplay: v.optional(v.string()),
            badge: v.optional(v.string()),
            evidenceId: v.optional(v.id("evidenceClaims")),
          })
        ),
        evidenceIds: v.array(v.id("evidenceClaims")),
      }),
      hoursAndLocation: v.object({
        address: v.string(),
        hours: v.array(
          v.object({
            days: v.string(),
            open: v.string(),
            close: v.string(),
          })
        ),
        note: v.optional(v.string()),
        evidenceIds: v.array(v.id("evidenceClaims")),
      }),
      contactSection: v.object({
        email: v.string(),
        phone: v.optional(v.string()),
        reservationNotice: v.string(),
        evidenceIds: v.array(v.id("evidenceClaims")),
      }),
      unknownItems: v.array(v.string()),
    }),
    draft: v.object({
      recipientEmail: v.string(),
      subject: v.string(),
      bodyText: v.string(),
      bodyHtml: v.string(),
      shareUrl: v.string(),
      proposedScope: v.array(v.string()),
      proposedPriceCents: v.number(),
      proposedTimelineDays: v.number(),
      currency: v.string(),
    }),
    proposal: v.object({
      scopeItems: v.array(v.string()),
      priceCents: v.number(),
      timelineDays: v.number(),
      currency: v.string(),
      termsSummary: v.string(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const prospect = await ctx.db.get(args.prospectId);
    if (!prospect) throw new Error("Prospect not found");

    const now = Date.now();

    // 1. Insert Brief
    const briefId = await ctx.db.insert("businessBriefs", {
      workspaceId: prospect.workspaceId,
      prospectId: args.prospectId,
      version: 1,
      ...args.brief,
      createdAt: now,
    });

    // 2. Insert Spec
    const websiteSpecId = await ctx.db.insert("websiteSpecs", {
      workspaceId: prospect.workspaceId,
      prospectId: args.prospectId,
      version: 1,
      ...args.spec,
      isPublished: true,
      publishedAt: now,
      createdAt: now,
    });

    // 3. Insert Draft
    const contentToHash = `${args.draft.subject}|${args.draft.bodyText}|${args.draft.proposedPriceCents}`;
    // Simple fast hash string
    let hash = 0;
    for (let i = 0; i < contentToHash.length; i++) {
      hash = (hash << 5) - hash + contentToHash.charCodeAt(i);
      hash |= 0;
    }
    const hashString = `hash_${Math.abs(hash)}`;

    const draftId = await ctx.db.insert("outreachDrafts", {
      workspaceId: prospect.workspaceId,
      prospectId: args.prospectId,
      version: 1,
      ...args.draft,
      approvalStatus: "pending_approval",
      hashOfContent: hashString,
      createdAt: now,
    });

    // 4. Insert Proposal v1
    const proposalId = await ctx.db.insert("proposals", {
      workspaceId: prospect.workspaceId,
      prospectId: args.prospectId,
      version: 1,
      ...args.proposal,
      status: "proposed_by_operator",
      isCommerciallyBinding: false,
      humanDecisionRequired: false,
      createdAt: now,
    });

    // Update prospect
    await ctx.db.patch(args.prospectId, {
      currentBriefId: briefId,
      currentWebsiteSpecId: websiteSpecId,
      currentDraftId: draftId,
      currentProposalId: proposalId,
      outreachStatus: "pending_approval",
      updatedAt: now,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: prospect.workspaceId,
      campaignId: prospect.campaignId,
      prospectId: args.prospectId,
      actor: "openai_agent",
      kind: "artifacts_generated",
      summary: `Generated cited business brief, typed website preview (${args.slug}), outreach draft ($1,250 CAD), and commercial proposal v1.`,
      at: now,
    });

    return null;
  },
});
