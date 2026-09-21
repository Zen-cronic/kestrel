import { internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getFirecrawlProvider } from "./lib/providers";
import { claimConfidence, claimStatus, documentProvider } from "./schema";

export const listEvidence = query({
  args: { prospectId: v.id("prospects") },
  returns: v.object({
    sources: v.array(
      v.object({
        _id: v.id("sourceDocuments"),
        url: v.string(),
        title: v.string(),
        provider: documentProvider,
        status: v.union(v.literal("valid"), v.literal("failed"), v.literal("robots_prevented")),
        retrievedAt: v.number(),
        rawTextSnippet: v.optional(v.string()),
      })
    ),
    claims: v.array(
      v.object({
        _id: v.id("evidenceClaims"),
        sourceDocumentId: v.id("sourceDocuments"),
        claimKey: v.string(),
        category: v.union(
          v.literal("identity"),
          v.literal("hours"),
          v.literal("menu"),
          v.literal("services"),
          v.literal("location"),
          v.literal("weakness"),
          v.literal("reputation")
        ),
        statement: v.string(),
        rawExcerpt: v.string(),
        confidence: claimConfidence,
        status: claimStatus,
        recordedAt: v.number(),
      })
    ),
  }),
  handler: async (ctx, { prospectId }) => {
    const sources = await ctx.db
      .query("sourceDocuments")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .collect();

    const claims = await ctx.db
      .query("evidenceClaims")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .collect();

    return {
      sources: sources.map((s) => ({
        _id: s._id,
        url: s.url,
        title: s.title,
        provider: s.provider,
        status: s.status,
        retrievedAt: s.retrievedAt,
        rawTextSnippet: s.rawTextSnippet,
      })),
      claims: claims.map((c) => ({
        _id: c._id,
        sourceDocumentId: c.sourceDocumentId,
        claimKey: c.claimKey,
        category: c.category,
        statement: c.statement,
        rawExcerpt: c.rawExcerpt,
        confidence: c.confidence,
        status: c.status,
        recordedAt: c.recordedAt,
      })),
    };
  },
});

export const getEvidenceForGeneration = internalQuery({
  args: { prospectId: v.id("prospects") },
  handler: async (ctx, { prospectId }) => {
    const prospect = await ctx.db.get(prospectId);
    if (!prospect) return null;

    const claims = await ctx.db
      .query("evidenceClaims")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .collect();

    return {
      prospect,
      claims,
    };
  },
});

export const auditAndGenerate = internalAction({
  args: { prospectId: v.id("prospects") },
  handler: async (ctx, { prospectId }) => {
    const data = await ctx.runQuery(internal.evidence.getEvidenceForGeneration, { prospectId });
    if (!data) return;

    const firecrawl = getFirecrawlProvider();
    const scrapedSources = await firecrawl.auditBusiness(data.prospect.name, data.prospect.name, data.prospect.address);

    await ctx.runMutation(internal.evidence.recordSourceAndClaims, {
      prospectId,
      scrapedSources,
    });

    // Proceed directly to generating brief, site spec, and outreach draft
    await ctx.runAction(internal.generator.generateArtifacts, { prospectId });
  },
});

export const recordSourceAndClaims = internalMutation({
  args: {
    prospectId: v.id("prospects"),
    scrapedSources: v.array(
      v.object({
        url: v.string(),
        title: v.string(),
        provider: v.union(v.literal("firecrawl_search"), v.literal("firecrawl_scrape")),
        httpStatus: v.number(),
        contentSnippet: v.string(),
        claims: v.array(
          v.object({
            claimKey: v.string(),
            category: v.union(
              v.literal("identity"),
              v.literal("hours"),
              v.literal("menu"),
              v.literal("services"),
              v.literal("location"),
              v.literal("weakness"),
              v.literal("reputation")
            ),
            statement: v.string(),
            rawExcerpt: v.string(),
            confidence: claimConfidence,
            status: claimStatus,
          })
        ),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const prospect = await ctx.db.get(args.prospectId);
    if (!prospect) throw new Error("Prospect not found");

    const now = Date.now();
    let totalClaims = 0;

    for (const source of args.scrapedSources) {
      const sourceDocId = await ctx.db.insert("sourceDocuments", {
        workspaceId: prospect.workspaceId,
        prospectId: args.prospectId,
        url: source.url,
        title: source.title,
        provider: source.provider,
        status: "valid",
        httpStatus: source.httpStatus,
        retrievedAt: now,
        rawTextSnippet: source.contentSnippet,
      });

      for (const claim of source.claims) {
        await ctx.db.insert("evidenceClaims", {
          workspaceId: prospect.workspaceId,
          prospectId: args.prospectId,
          sourceDocumentId: sourceDocId,
          claimKey: claim.claimKey,
          category: claim.category,
          statement: claim.statement,
          rawExcerpt: claim.rawExcerpt,
          confidence: claim.confidence,
          status: claim.status,
          recordedAt: now,
        });
        totalClaims++;
      }
    }

    await ctx.db.insert("activityLedger", {
      workspaceId: prospect.workspaceId,
      campaignId: prospect.campaignId,
      prospectId: args.prospectId,
      actor: "firecrawl_provider",
      kind: "web_audit_completed",
      summary: `Audited open web for "${prospect.name}": ingested ${args.scrapedSources.length} sources and established ${totalClaims} factual claims.`,
      at: now,
    });

    return null;
  },
});
