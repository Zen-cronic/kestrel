import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getFirecrawlProvider } from "./lib/providers";
import { claimConfidence, claimStatus } from "./schema";

export const auditUrl = action({
  args: {
    url: v.string(),
    businessName: v.optional(v.string()),
    prospectId: v.optional(v.id("prospects")),
  },
  returns: v.object({
    ok: v.boolean(),
    url: v.string(),
    title: v.string(),
    description: v.string(),
    markdownSnippet: v.string(),
    links: v.array(v.string()),
    diagnostics: v.object({
      mobileIssues: v.boolean(),
      staleContent: v.boolean(),
      missingSsl: v.boolean(),
      detectedTech: v.array(v.string()),
      weaknessNotes: v.array(v.string()),
    }),
    extractedClaims: v.array(
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
  }),
  handler: async (ctx, args) => {
    let normalizedUrl = args.url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    const firecrawl = getFirecrawlProvider();
    const scraped = await firecrawl.scrapeUrl(normalizedUrl);

    const title = scraped.title || args.businessName || "Scraped Business Website";
    const description = scraped.description || "Public web presence audited via Firecrawl.";
    const markdown = scraped.markdown || "";
    const links = (scraped.links || []).slice(0, 15);

    // Diagnostics & Defect Analysis
    const isHttp = normalizedUrl.startsWith("http://");
    const staleCopyrightMatch = markdown.match(/(?:©|\(c\)|copyright)\s*(201\d|202[0-2])/i);
    const hasStaleCopyright = !!staleCopyrightMatch;

    const detectedTech: string[] = [];
    if (markdown.includes("wp-content") || markdown.includes("wordpress")) detectedTech.push("WordPress (Legacy)");
    if (markdown.includes("wix.com") || markdown.includes("wixsite")) detectedTech.push("Wix");
    if (markdown.includes("squarespace")) detectedTech.push("Squarespace");
    if (markdown.includes("shopify")) detectedTech.push("Shopify");
    if (detectedTech.length === 0) detectedTech.push("Custom Static HTML");

    const weaknessNotes: string[] = [];
    if (isHttp) weaknessNotes.push("Insecure connection: missing SSL / HTTPS certificate.");
    if (hasStaleCopyright) {
      weaknessNotes.push(
        `Obsolete footer copyright (${staleCopyrightMatch?.[1]}): indicates abandoned or stale site maintenance.`
      );
    }
    if (!description || description.length < 20) {
      weaknessNotes.push("Missing SEO meta description: severely degrades local Google search rank.");
    }
    if (!markdown.toLowerCase().includes("order") && !markdown.toLowerCase().includes("menu")) {
      weaknessNotes.push("No interactive digital catalog or online ordering portal found.");
    }

    // Extracted Truth Claims
    const extractedClaims: Array<{
      claimKey: string;
      category: "identity" | "hours" | "menu" | "services" | "location" | "weakness" | "reputation";
      statement: string;
      rawExcerpt: string;
      confidence: "official" | "high" | "medium" | "needs_confirmation";
      status: "verified" | "flagged_unknown" | "unsupported";
    }> = [];

    // Identity claim
    extractedClaims.push({
      claimKey: "brand_identity_" + Math.random().toString(36).substring(2, 7),
      category: "identity",
      statement: `Official domain ${normalizedUrl} belongs to ${title}.`,
      rawExcerpt: title.slice(0, 150),
      confidence: "official",
      status: "verified",
    });

    // Extract hours if present
    const hoursMatch = markdown.match(
      /(?:hours|open|closed|mon|tue|wed|thu|fri|sat|sun)[\s\S]{0,100}?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*[-–to]\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))/i
    );
    if (hoursMatch) {
      extractedClaims.push({
        claimKey: "hours_" + Math.random().toString(36).substring(2, 7),
        category: "hours",
        statement: `Published operating hours found on website: ${hoursMatch[0].trim().replace(/\n+/g, " ")}.`,
        rawExcerpt: hoursMatch[0].slice(0, 150),
        confidence: "high",
        status: "verified",
      });
    }

    // Extract weakness claim
    if (weaknessNotes.length > 0) {
      extractedClaims.push({
        claimKey: "weakness_signal_" + Math.random().toString(36).substring(2, 7),
        category: "weakness",
        statement: weaknessNotes[0],
        rawExcerpt: (staleCopyrightMatch ? staleCopyrightMatch[0] : weaknessNotes[0]).slice(0, 150),
        confidence: "high",
        status: "verified",
      });
    }

    // If prospectId is passed, save immediately to database
    if (args.prospectId) {
      await ctx.runMutation((internal as any).recon.saveReconSourceAndClaims, {
        prospectId: args.prospectId,
        url: normalizedUrl,
        title,
        httpStatus: scraped.statusCode,
        rawSnippet: markdown.slice(0, 1000),
        links,
        claims: extractedClaims,
      });
    }

    return {
      ok: true,
      url: normalizedUrl,
      title,
      description,
      markdownSnippet: markdown.slice(0, 800),
      links,
      diagnostics: {
        mobileIssues: !markdown.toLowerCase().includes("viewport") && !markdown.toLowerCase().includes("responsive"),
        staleContent: hasStaleCopyright,
        missingSsl: isHttp,
        detectedTech,
        weaknessNotes,
      },
      extractedClaims,
    };
  },
});

export const saveReconSourceAndClaims = internalMutation({
  args: {
    prospectId: v.id("prospects"),
    url: v.string(),
    title: v.string(),
    httpStatus: v.number(),
    rawSnippet: v.string(),
    links: v.array(v.string()),
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
  },
  returns: v.id("sourceDocuments"),
  handler: async (ctx, args) => {
    const prospect = await ctx.db.get(args.prospectId);
    if (!prospect) throw new Error("Prospect not found");

    const now = Date.now();

    const sourceDocId = await ctx.db.insert("sourceDocuments", {
      workspaceId: prospect.workspaceId,
      prospectId: args.prospectId,
      url: args.url,
      title: args.title,
      provider: "firecrawl_scrape",
      status: "valid",
      httpStatus: args.httpStatus,
      retrievedAt: now,
      rawTextSnippet: args.rawSnippet,
      links: args.links,
    });

    for (const c of args.claims) {
      await ctx.db.insert("evidenceClaims", {
        workspaceId: prospect.workspaceId,
        prospectId: args.prospectId,
        sourceDocumentId: sourceDocId,
        claimKey: c.claimKey,
        category: c.category,
        statement: c.statement,
        rawExcerpt: c.rawExcerpt,
        confidence: c.confidence,
        status: c.status,
        recordedAt: now,
      });
    }

    await ctx.db.insert("activityLedger", {
      workspaceId: prospect.workspaceId,
      campaignId: prospect.campaignId,
      prospectId: args.prospectId,
      actor: "firecrawl_provider",
      kind: "web_audit_completed",
      summary: `Firecrawl deep scrape completed for ${args.url}: ${args.claims.length} claims verified.`,
      at: now,
    });

    return sourceDocId;
  },
});
