import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Money is stored in integer cents (USD or CAD).
// All models follow strict typed validators and indexed read paths.

export const workspaceMemberRole = v.union(
  v.literal("owner"),
  v.literal("operator"),
  v.literal("viewer")
);

export const campaignMode = v.union(
  v.literal("manual"),
  v.literal("assisted_followups")
);

export const campaignStatus = v.union(
  v.literal("active"),
  v.literal("paused"),
  v.literal("completed"),
  v.literal("archived")
);

export const candidateStatus = v.union(
  v.literal("found"),
  v.literal("approved"),
  v.literal("dismissed")
);

export const prospectApprovalStatus = v.union(
  v.literal("pending_operator_approval"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("paused")
);

export const outreachStatus = v.union(
  v.literal("idle"),
  v.literal("drafted"),
  v.literal("pending_approval"),
  v.literal("sent"),
  v.literal("replied"),
  v.literal("negotiating"),
  v.literal("accepted"),
  v.literal("declined"),
  v.literal("suppressed"),
  v.literal("bounced")
);

export const documentProvider = v.union(
  v.literal("google_places"),
  v.literal("firecrawl_search"),
  v.literal("firecrawl_scrape"),
  v.literal("operator_input"),
  v.literal("fixture")
);

export const claimConfidence = v.union(
  v.literal("official"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("needs_confirmation")
);

export const claimStatus = v.union(
  v.literal("verified"),
  v.literal("flagged_unknown"),
  v.literal("unsupported")
);

export const draftApprovalStatus = v.union(
  v.literal("draft"),
  v.literal("pending_approval"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("expired_due_to_edit")
);

export const proposalStatus = v.union(
  v.literal("draft"),
  v.literal("proposed_by_operator"),
  v.literal("counter_proposed_by_client"),
  v.literal("accepted"),
  v.literal("declined"),
  v.literal("superseded")
);

export const replyClassification = v.union(
  v.literal("reply_received"),
  v.literal("interested"),
  v.literal("question"),
  v.literal("requested_site_change"),
  v.literal("requested_scope_change"),
  v.literal("requested_price_change"),
  v.literal("requested_timeline_change"),
  v.literal("requested_terms_change"),
  v.literal("decline"),
  v.literal("unsubscribe"),
  v.literal("out_of_office"),
  v.literal("ambiguous")
);

export default defineSchema({
  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.string(),
    defaultCurrency: v.string(),
    isDemo: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_ownerId", ["ownerId"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    role: workspaceMemberRole,
    createdAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_and_tokenIdentifier", ["workspaceId", "tokenIdentifier"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  campaigns: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    category: v.string(),
    location: v.string(),
    mode: campaignMode,
    status: campaignStatus,
    maxFollowups: v.number(), // Strict ceiling of 2
    followupDelayDays: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_workspaceId", ["workspaceId"]),

  discoverySearches: defineTable({
    workspaceId: v.id("workspaces"),
    campaignId: v.id("campaigns"),
    query: v.string(),
    location: v.string(),
    provider: v.union(v.literal("google_places"), v.literal("fixture")),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    resultCount: v.number(),
    error: v.optional(v.string()),
    searchedAt: v.number(),
  })
    .index("by_campaignId", ["campaignId"])
    .index("by_workspaceId", ["workspaceId"]),

  placesCandidates: defineTable({
    workspaceId: v.id("workspaces"),
    campaignId: v.id("campaigns"),
    searchId: v.optional(v.id("discoverySearches")),
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
    status: candidateStatus,
    prospectId: v.optional(v.id("prospects")),
    discoveredAt: v.number(),
  })
    .index("by_campaignId", ["campaignId"])
    .index("by_placeId", ["placeId"])
    .index("by_campaignId_and_status", ["campaignId", "status"]),

  prospects: defineTable({
    workspaceId: v.id("workspaces"),
    campaignId: v.id("campaigns"),
    candidateId: v.optional(v.id("placesCandidates")),
    name: v.string(),
    vertical: v.string(),
    address: v.string(),
    phone: v.optional(v.string()),
    targetEmail: v.string(),
    contactName: v.optional(v.string()),
    approvalStatus: prospectApprovalStatus,
    outreachStatus: outreachStatus,
    currentBriefId: v.optional(v.id("businessBriefs")),
    currentWebsiteSpecId: v.optional(v.id("websiteSpecs")),
    currentDraftId: v.optional(v.id("outreachDrafts")),
    currentProposalId: v.optional(v.id("proposals")),
    activeThreadId: v.optional(v.string()),
    followupCount: v.number(),
    isSuppressed: v.boolean(),
    suppressionReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_campaignId", ["campaignId"])
    .index("by_workspaceId_and_approvalStatus", ["workspaceId", "approvalStatus"])
    .index("by_targetEmail", ["targetEmail"]),

  sourceDocuments: defineTable({
    workspaceId: v.id("workspaces"),
    prospectId: v.id("prospects"),
    url: v.string(),
    title: v.string(),
    provider: documentProvider,
    status: v.union(v.literal("valid"), v.literal("failed"), v.literal("robots_prevented")),
    httpStatus: v.optional(v.number()),
    retrievedAt: v.number(),
    rawTextSnippet: v.optional(v.string()),
  }).index("by_prospectId", ["prospectId"]),

  evidenceClaims: defineTable({
    workspaceId: v.id("workspaces"),
    prospectId: v.id("prospects"),
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
    .index("by_prospectId", ["prospectId"])
    .index("by_prospectId_and_category", ["prospectId", "category"]),

  businessBriefs: defineTable({
    workspaceId: v.id("workspaces"),
    prospectId: v.id("prospects"),
    version: v.number(),
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
    createdAt: v.number(),
  })
    .index("by_prospectId", ["prospectId"])
    .index("by_prospectId_and_version", ["prospectId", "version"]),

  websiteSpecs: defineTable({
    workspaceId: v.id("workspaces"),
    prospectId: v.id("prospects"),
    version: v.number(),
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
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_prospectId", ["prospectId"])
    .index("by_slug", ["slug"])
    .index("by_prospectId_and_version", ["prospectId", "version"]),

  outreachDrafts: defineTable({
    workspaceId: v.id("workspaces"),
    prospectId: v.id("prospects"),
    version: v.number(),
    recipientEmail: v.string(),
    subject: v.string(),
    bodyHtml: v.string(),
    bodyText: v.string(),
    shareUrl: v.string(),
    proposedScope: v.array(v.string()),
    proposedPriceCents: v.number(),
    proposedTimelineDays: v.number(),
    currency: v.string(),
    approvalStatus: draftApprovalStatus,
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    agentmailMessageId: v.optional(v.string()),
    sendError: v.optional(v.string()),
    hashOfContent: v.string(),
    createdAt: v.number(),
  })
    .index("by_prospectId", ["prospectId"])
    .index("by_prospectId_and_version", ["prospectId", "version"])
    .index("by_workspaceId_and_approvalStatus", ["workspaceId", "approvalStatus"]),

  proposals: defineTable({
    workspaceId: v.id("workspaces"),
    prospectId: v.id("prospects"),
    version: v.number(),
    scopeItems: v.array(v.string()),
    priceCents: v.number(),
    timelineDays: v.number(),
    currency: v.string(),
    termsSummary: v.string(),
    status: proposalStatus,
    isCommerciallyBinding: v.boolean(),
    humanDecisionRequired: v.boolean(),
    decidedBy: v.optional(v.string()),
    decidedAt: v.optional(v.number()),
    changeReason: v.optional(v.string()),
    sourceMessageId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_prospectId", ["prospectId"])
    .index("by_prospectId_and_version", ["prospectId", "version"]),

  agentMailThreads: defineTable({
    workspaceId: v.id("workspaces"),
    prospectId: v.id("prospects"),
    threadId: v.string(),
    inboxId: v.string(),
    subject: v.string(),
    lastMessageAt: v.number(),
    messageCount: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("bounced"),
      v.literal("suppressed"),
      v.literal("closed")
    ),
    createdAt: v.number(),
  })
    .index("by_threadId", ["threadId"])
    .index("by_prospectId", ["prospectId"]),

  agentMailMessages: defineTable({
    workspaceId: v.id("workspaces"),
    prospectId: v.id("prospects"),
    threadId: v.string(),
    messageId: v.string(),
    direction: v.union(v.literal("outbound"), v.literal("inbound")),
    from: v.string(),
    to: v.array(v.string()),
    subject: v.string(),
    text: v.string(),
    html: v.optional(v.string()),
    classification: v.optional(replyClassification),
    proposedChanges: v.optional(
      v.object({
        requestedScope: v.optional(v.array(v.string())),
        requestedPriceCents: v.optional(v.number()),
        requestedTimelineDays: v.optional(v.number()),
        notes: v.string(),
      })
    ),
    via: v.union(v.literal("agentmail"), v.literal("fixture")),
    receivedOrSentAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_messageId", ["messageId"])
    .index("by_prospectId", ["prospectId"])
    .index("by_threadId", ["threadId"]),

  followupSchedules: defineTable({
    workspaceId: v.id("workspaces"),
    prospectId: v.id("prospects"),
    campaignId: v.id("campaigns"),
    attemptNumber: v.number(), // Ceiling of 2
    scheduledTime: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("cancelled"),
      v.literal("sent"),
      v.literal("skipped")
    ),
    cancellationReason: v.optional(v.string()),
    scheduledFunctionId: v.optional(v.string()),
    createdAt: v.number(),
    executedAt: v.optional(v.number()),
  })
    .index("by_prospectId", ["prospectId"])
    .index("by_status", ["status"]),

  activityLedger: defineTable({
    workspaceId: v.id("workspaces"),
    prospectId: v.optional(v.id("prospects")),
    campaignId: v.optional(v.id("campaigns")),
    actor: v.string(),
    kind: v.string(),
    summary: v.string(),
    details: v.optional(v.string()),
    at: v.number(),
  })
    .index("by_workspaceId_and_at", ["workspaceId", "at"])
    .index("by_prospectId_and_at", ["prospectId", "at"]),

  suppressions: defineTable({
    workspaceId: v.id("workspaces"),
    email: v.string(),
    reason: v.union(
      v.literal("unsubscribe"),
      v.literal("bounce"),
      v.literal("manual_operator"),
      v.literal("decline")
    ),
    suppressedAt: v.number(),
  })
    .index("by_workspaceId_and_email", ["workspaceId", "email"])
    .index("by_email", ["email"]),
});
