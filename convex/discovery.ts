import { action, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getPlacesProvider, getProviderMode } from "./lib/providers";

export const listCandidates = query({
  args: { campaignId: v.id("campaigns") },
  returns: v.array(v.any()),
  handler: async (ctx, { campaignId }) => {
    return await ctx.db
      .query("placesCandidates")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", campaignId))
      .order("desc")
      .take(50);
  },
});

export const search = action({
  args: {
    campaignId: v.id("campaigns"),
    query: v.string(),
    location: v.string(),
  },
  returns: v.object({
    count: v.number(),
    provider: v.string(),
  }),
  handler: async (ctx, args) => {
    const provider = getPlacesProvider();
    const mode = getProviderMode();
    const results = await provider.search(args.query, args.location);

    await ctx.runMutation(internal.discovery.recordSearchResults, {
      campaignId: args.campaignId,
      query: args.query,
      location: args.location,
      provider: mode === "live" ? "google_places" : "fixture",
      results,
    });

    return {
      count: results.length,
      provider: mode === "live" ? "Google Places API (official)" : "Deterministic Fixtures",
    };
  },
});

export const recordSearchResults = internalMutation({
  args: {
    campaignId: v.id("campaigns"),
    query: v.string(),
    location: v.string(),
    provider: v.union(v.literal("google_places"), v.literal("fixture")),
    results: v.array(
      v.object({
        placeId: v.string(),
        name: v.string(),
        formattedAddress: v.string(),
        phone: v.optional(v.string()),
        websiteUrl: v.optional(v.string()),
        rating: v.optional(v.number()),
        userRatingsTotal: v.optional(v.number()),
        priceLevel: v.optional(v.number()),
        businessStatus: v.optional(v.string()),
        category: v.string(),
        weakPresenceSignals: v.array(v.string()),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const now = Date.now();
    const searchId = await ctx.db.insert("discoverySearches", {
      workspaceId: campaign.workspaceId,
      campaignId: args.campaignId,
      query: args.query,
      location: args.location,
      provider: args.provider,
      status: "completed",
      resultCount: args.results.length,
      searchedAt: now,
    });

    for (const item of args.results) {
      const existing = await ctx.db
        .query("placesCandidates")
        .withIndex("by_placeId", (q) => q.eq("placeId", item.placeId))
        .first();

      if (!existing) {
        await ctx.db.insert("placesCandidates", {
          workspaceId: campaign.workspaceId,
          campaignId: args.campaignId,
          searchId,
          placeId: item.placeId,
          name: item.name,
          formattedAddress: item.formattedAddress,
          phone: item.phone,
          websiteUrl: item.websiteUrl,
          rating: item.rating,
          userRatingsTotal: item.userRatingsTotal,
          priceLevel: item.priceLevel,
          businessStatus: item.businessStatus,
          category: item.category,
          weakPresenceSignals: item.weakPresenceSignals,
          status: "found",
          discoveredAt: now,
        });
      }
    }

    await ctx.db.insert("activityLedger", {
      workspaceId: campaign.workspaceId,
      campaignId: args.campaignId,
      actor: args.provider === "google_places" ? "google_places_api" : "fixture_provider",
      kind: "discovery_search_completed",
      summary: `Found ${args.results.length} SMB candidates for "${args.query}" in ${args.location}.`,
      at: now,
    });

    return null;
  },
});

export const approveCandidate = mutation({
  args: {
    candidateId: v.id("placesCandidates"),
    targetEmail: v.optional(v.string()),
  },
  returns: v.id("prospects"),
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidate not found");
    if (candidate.status === "approved" && candidate.prospectId) {
      return candidate.prospectId;
    }

    const campaign = await ctx.db.get(candidate.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const email =
      args.targetEmail ||
      (candidate.placeId.includes("rustic-kettle")
        ? "owner@rustickettle-example.ca"
        : `contact@${candidate.name.toLowerCase().replace(/[^a-z0-9]/g, "")}-example.ca`);

    const now = Date.now();
    const prospectId = await ctx.db.insert("prospects", {
      workspaceId: candidate.workspaceId,
      campaignId: candidate.campaignId,
      candidateId: candidate._id,
      name: candidate.name,
      vertical: "restaurant_cafe",
      address: candidate.formattedAddress,
      phone: candidate.phone,
      targetEmail: email,
      contactName: "Marcus Vance",
      approvalStatus: "approved",
      outreachStatus: "idle",
      followupCount: 0,
      isSuppressed: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(candidate._id, {
      status: "approved",
      prospectId,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: candidate.workspaceId,
      campaignId: candidate.campaignId,
      prospectId,
      actor: "operator",
      kind: "candidate_approved_for_outreach",
      summary: `Operator approved "${candidate.name}" as an active prospect (Target: ${email}).`,
      at: now,
    });

    // Schedule automated evidence audit & artifact generation for the approved prospect
    await ctx.scheduler.runAfter(0, internal.evidence.auditAndGenerate, { prospectId });

    return prospectId;
  },
});

export const dismissCandidate = mutation({
  args: { candidateId: v.id("placesCandidates") },
  returns: v.null(),
  handler: async (ctx, { candidateId }) => {
    const candidate = await ctx.db.get(candidateId);
    if (!candidate) throw new Error("Candidate not found");

    await ctx.db.patch(candidateId, { status: "dismissed" });
    await ctx.db.insert("activityLedger", {
      workspaceId: candidate.workspaceId,
      campaignId: candidate.campaignId,
      actor: "operator",
      kind: "candidate_dismissed",
      summary: `Operator dismissed candidate "${candidate.name}".`,
      at: Date.now(),
    });

    return null;
  },
});
