import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Money is stored in integer cents (CAD by default). Percentages are stored as
// basis points to avoid float drift in totals that two people will argue about.

export const partyRole = v.union(
  v.literal("contractor"),
  v.literal("homeowner"),
  v.literal("supplier"),
);

export const priceSource = v.object({
  type: v.union(
    v.literal("rate_card"), // contractor's own labour rate / stocked material price
    v.literal("supplier_quote"), // a supplier's emailed quote (third party in the inbox)
    v.literal("reference"), // public page via Firecrawl search/scrape — reference, not a quote
    v.literal("demo_catalog"), // seeded demo prices, clearly labelled
    v.literal("unpriced"), // flagged, never guessed
  ),
  url: v.optional(v.string()),
  title: v.optional(v.string()),
  fetchedAt: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
  quoteMessageId: v.optional(v.string()),
});

export const lineItem = v.object({
  kind: v.union(v.literal("material"), v.literal("labour"), v.literal("other")),
  description: v.string(),
  qty: v.number(),
  unit: v.string(), // "each", "m", "h", "box", ...
  unitPriceCents: v.union(v.number(), v.null()),
  source: priceSource,
  flagged: v.boolean(), // true when unpriced or ambiguous — shown amber, never silently guessed
  note: v.optional(v.string()),
});

export const changeOrderStatus = v.union(
  v.literal("draft"), // extracted, awaiting contractor review
  v.literal("awaiting_approval"), // sent to both parties
  v.literal("approved"), // both parties approved the current revision
  v.literal("rejected"),
  v.literal("superseded"), // a newer revision exists
);

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    address: v.string(),
    inboxId: v.optional(v.string()), // AgentMail inbox address for this project
    currency: v.string(),
    estimateTotalCents: v.number(), // the written estimate the 10% line is measured against
    rateCard: v.object({
      labourRateCentsPerHour: v.number(),
      overheadProfitBps: v.number(), // OH&P shown as its own line
      wasteFactorBps: v.number(),
      taxBps: v.number(),
      stockedMaterials: v.array(
        v.object({ key: v.string(), description: v.string(), unit: v.string(), unitPriceCents: v.number() }),
      ),
    }),
    isDemo: v.boolean(),
    demoAutoApproveRole: v.optional(partyRole), // demo contractor auto-approves after a delay
    createdAt: v.number(),
  }).index("by_inbox", ["inboxId"]),

  parties: defineTable({
    projectId: v.id("projects"),
    role: partyRole,
    name: v.string(),
    email: v.string(),
    approvalToken: v.string(), // per-party token that must appear in an approval reply
    userId: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_email", ["projectId", "email"])
    .index("by_email", ["email"]),

  changeOrders: defineTable({
    projectId: v.id("projects"),
    number: v.number(),
    title: v.string(),
    status: changeOrderStatus,
    currentRevisionId: v.optional(v.id("revisions")),
    sourceMessageId: v.optional(v.string()),
    requestedByPartyId: v.optional(v.id("parties")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_number", ["projectId", "number"]),

  revisions: defineTable({
    changeOrderId: v.id("changeOrders"),
    projectId: v.id("projects"),
    version: v.number(),
    lineItems: v.array(lineItem),
    overheadProfitBps: v.number(),
    wasteFactorBps: v.number(),
    taxBps: v.number(),
    subtotalCents: v.number(),
    overheadProfitCents: v.number(),
    taxCents: v.number(),
    totalCents: v.number(),
    scheduleImpactDays: v.number(),
    summary: v.string(), // plain-language description sent to both parties
    createdByPartyId: v.optional(v.id("parties")),
    createdAt: v.number(),
  })
    .index("by_change_order", ["changeOrderId"])
    .index("by_change_order_version", ["changeOrderId", "version"]),

  approvals: defineTable({
    projectId: v.id("projects"),
    changeOrderId: v.id("changeOrders"),
    revisionId: v.id("revisions"),
    partyId: v.id("parties"),
    decision: v.union(v.literal("approve"), v.literal("reject")),
    via: v.union(v.literal("email"), v.literal("app"), v.literal("demo")),
    messageId: v.optional(v.string()),
    at: v.number(),
  })
    .index("by_revision_party", ["revisionId", "partyId"])
    .index("by_change_order", ["changeOrderId"]),

  ledger: defineTable({
    projectId: v.id("projects"),
    changeOrderId: v.optional(v.id("changeOrders")),
    revisionId: v.optional(v.id("revisions")),
    kind: v.string(), // "request_received" | "draft_created" | "sent_for_approval" | "approval_recorded" | ...
    summary: v.string(),
    actorPartyId: v.optional(v.id("parties")),
    at: v.number(),
  }).index("by_project_at", ["projectId", "at"]),

  inboundMessages: defineTable({
    projectId: v.optional(v.id("projects")),
    inboxId: v.string(),
    messageId: v.string(), // provider message id — idempotency key
    threadId: v.optional(v.string()),
    from: v.string(),
    subject: v.string(),
    text: v.string(), // reply text with quoted history stripped
    receivedAt: v.number(),
    via: v.union(v.literal("agentmail"), v.literal("demo")),
    classification: v.optional(
      v.union(v.literal("request"), v.literal("approval"), v.literal("rejection"), v.literal("quote"), v.literal("other")),
    ),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    attachments: v.array(v.object({ storageId: v.optional(v.id("_storage")), filename: v.string(), contentType: v.string() })),
  })
    .index("by_message_id", ["messageId"])
    .index("by_project", ["projectId"]),

  referencePrices: defineTable({
    key: v.string(), // normalized item key, e.g. "gfci outlet 20a"
    description: v.string(),
    unit: v.string(),
    unitPriceCents: v.number(),
    url: v.string(),
    title: v.string(),
    provider: v.union(v.literal("firecrawl_search"), v.literal("firecrawl_scrape"), v.literal("demo_catalog")),
    fetchedAt: v.number(),
    expiresAt: v.number(),
  }).index("by_key", ["key"]),

  supplierQuotes: defineTable({
    projectId: v.id("projects"),
    partyId: v.id("parties"),
    messageId: v.string(),
    items: v.array(
      v.object({ key: v.string(), description: v.string(), unit: v.string(), unitPriceCents: v.number(), leadTimeDays: v.optional(v.number()) }),
    ),
    receivedAt: v.number(),
  }).index("by_project", ["projectId"]),
});
