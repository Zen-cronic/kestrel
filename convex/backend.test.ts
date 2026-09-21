/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("Storefront Desk Backend Functions & Safety Invariants", () => {
  it("seeds and resets the demo fixture workspace idempotently", async () => {
    const t = convexTest(schema, modules);

    // 1. First reset / seed
    const seed1 = await t.mutation(api.demo.reset, {});
    expect(seed1.workspaceId).toBeDefined();
    expect(seed1.campaignId).toBeDefined();
    expect(seed1.prospectId).toBeDefined();
    expect(seed1.previewSlug).toBe("rustic-kettle-preview-v1");

    // Verify workspace
    const ws = await t.query(api.workspaces.get, { workspaceId: seed1.workspaceId });
    expect(ws?.name).toContain("SMB Growth Desk");
    expect(ws?.isDemo).toBe(true);

    // Verify campaign
    const campaigns = await t.query(api.campaigns.list, { workspaceId: seed1.workspaceId });
    expect(campaigns.length).toBe(1);
    expect(campaigns[0].mode).toBe("assisted_followups");
    expect(campaigns[0].maxFollowups).toBe(2);

    // Verify prospect
    const prospect = await t.query(api.prospects.get, { prospectId: seed1.prospectId });
    expect(prospect?.name).toBe("The Rustic Kettle Café & Roastery");
    expect(prospect?.approvalStatus).toBe("approved");

    // 2. Second reset to ensure idempotency and clean state replacement
    const seed2 = await t.mutation(api.demo.reset, {});
    expect(seed2.previewSlug).toBe("rustic-kettle-preview-v1");

    const campaignsAfter = await t.query(api.campaigns.list, { workspaceId: seed2.workspaceId });
    expect(campaignsAfter.length).toBe(1);
  });

  it("public preview exposes only published safe fields without internal metadata", async () => {
    const t = convexTest(schema, modules);
    const seed = await t.mutation(api.demo.reset, {});

    const preview = await t.query(api.previews.getBySlug, { slug: seed.previewSlug });
    expect(preview).not.toBeNull();
    expect(preview?.businessIdentity.name).toBe("The Rustic Kettle Café & Roastery");
    expect(preview?.theme.primaryColor).toBe("#2b1810");
    expect(preview?.offeringsSection.items.length).toBeGreaterThanOrEqual(3);

    // Ensure internal secrets/metadata are NOT returned in public view
    expect((preview as any)?.workspaceId).toBeUndefined();
    expect((preview as any)?.prospectId).toBeUndefined();
    expect((preview as any)?.hero.evidenceIds).toBeUndefined();
    expect((preview as any)?.aboutSection.evidenceIds).toBeUndefined();

    // Query for non-existent slug returns null
    const missing = await t.query(api.previews.getBySlug, { slug: "non-existent-cafe-slug" });
    expect(missing).toBeNull();
  });

  it("invalidates approval immediately when an approved draft is edited", async () => {
    const t = convexTest(schema, modules);
    const seed = await t.mutation(api.demo.reset, {});

    const draft = await t.query(api.outreach.getDraft, { prospectId: seed.prospectId });
    expect(draft).not.toBeNull();
    expect(draft?.approvalStatus).toBe("pending_approval");

    // Operator approves the draft
    await t.mutation(api.outreach.approveDraft, { draftId: draft!._id });
    const approvedDraft = await t.query(api.outreach.getDraft, { prospectId: seed.prospectId });
    expect(approvedDraft?.approvalStatus).toBe("approved");

    // Editing any part of the draft must invalidate the approval
    await t.mutation(api.outreach.updateDraft, {
      draftId: draft!._id,
      subject: "Modified subject after approval",
      bodyText: "Modified body text after approval",
      proposedPriceCents: 150000,
    });

    const modifiedDraft = await t.query(api.outreach.getDraft, { prospectId: seed.prospectId });
    expect(modifiedDraft?.approvalStatus).toBe("expired_due_to_edit");
    expect(modifiedDraft?.subject).toBe("Modified subject after approval");
  });

  it("deduplicates inbound messages idempotently and cancels pending followups on reply", async () => {
    const t = convexTest(schema, modules);
    const seed = await t.mutation(api.demo.reset, {});

    const draft = await t.query(api.outreach.getDraft, { prospectId: seed.prospectId });
    // Transition outreach status to sent
    await t.mutation(internal.outreach.recordSendSuccess, {
      prospectId: seed.prospectId,
      draftId: draft!._id,
      messageId: "msg_outbound_init",
      threadId: "thread_fixture_rustic_kettle",
    });

    // Schedule a followup
    const scheduleId = await t.mutation(internal.followups.scheduleNextFollowup, {
      prospectId: seed.prospectId,
      campaignId: seed.campaignId,
    });
    expect(scheduleId).not.toBeNull();

    const schedulesBefore = await t.query(api.followups.getSchedules, { prospectId: seed.prospectId });
    expect(schedulesBefore.find((s) => s.status === "pending")).toBeDefined();

    // Receive inbound reply from prospect
    const msgId1 = await t.mutation(internal.threads.recordInbound, {
      messageId: "msg_inbound_test_unique_001",
      threadId: "thread_fixture_rustic_kettle",
      from: "owner@rustickettle-example.ca",
      to: ["outreach@storefrontdesk.app"],
      subject: "Re: Built a website preview for The Rustic Kettle",
      text: "We saw the preview! Can we do this for $1,000 CAD and 10 days?",
      via: "fixture",
    });
    expect(msgId1).not.toBeNull();

    // Follow-ups must be cancelled immediately upon reply
    const schedulesAfter = await t.query(api.followups.getSchedules, { prospectId: seed.prospectId });
    expect(schedulesAfter.every((s) => s.status === "cancelled")).toBe(true);

    // Duplicate delivery with same messageId must be ignored (idempotent)
    const msgIdDup = await t.mutation(internal.threads.recordInbound, {
      messageId: "msg_inbound_test_unique_001",
      threadId: "thread_fixture_rustic_kettle",
      from: "owner@rustickettle-example.ca",
      to: ["outreach@storefrontdesk.app"],
      subject: "Re: Built a website preview for The Rustic Kettle",
      text: "We saw the preview! Can we do this for $1,000 CAD and 10 days?",
      via: "fixture",
    });
    expect(msgIdDup).toBeNull();
  });

  it("creates non-binding proposed revision for counteroffers and requires human decision", async () => {
    const t = convexTest(schema, modules);
    const seed = await t.mutation(api.demo.reset, {});

    const draft = await t.query(api.outreach.getDraft, { prospectId: seed.prospectId });
    await t.mutation(internal.outreach.recordSendSuccess, {
      prospectId: seed.prospectId,
      draftId: draft!._id,
      messageId: "msg_outbound_init_2",
      threadId: "thread_fixture_rustic_kettle",
    });

    // Ingest counteroffer reply
    const msgId = await t.mutation(internal.threads.recordInbound, {
      messageId: "msg_counter_direct_1",
      threadId: "thread_fixture_rustic_kettle",
      from: "owner@rustickettle-example.ca",
      to: ["outreach@storefrontdesk.app"],
      subject: "Re: Built a website preview for The Rustic Kettle",
      text: "We want to move forward, but our budget is firm at $1,000 CAD with 10 days delivery.",
      via: "fixture",
    });
    expect(msgId).not.toBeNull();

    // Verify new proposal version created
    const proposals = await t.query(api.proposals.getProposalHistory, { prospectId: seed.prospectId });
    expect(proposals.length).toBe(2);

    const latest = proposals[0];
    expect(latest.version).toBe(2);
    expect(latest.priceCents).toBe(100000);
    expect(latest.timelineDays).toBe(10);
    expect(latest.status).toBe("counter_proposed_by_client");
    expect(latest.isCommerciallyBinding).toBe(false); // Model never creates binding terms!
    expect(latest.humanDecisionRequired).toBe(true); // Requires human approval!

    // Human operator accepts the counteroffer
    await t.mutation(api.proposals.acceptProposal, { proposalId: latest._id });

    const acceptedHistory = await t.query(api.proposals.getProposalHistory, { prospectId: seed.prospectId });
    const acceptedProposal = acceptedHistory.find((p) => p._id === latest._id);
    expect(acceptedProposal?.status).toBe("accepted");
    expect(acceptedProposal?.isCommerciallyBinding).toBe(true);
    expect(acceptedProposal?.humanDecisionRequired).toBe(false);
  });

  it("enforces maximum 2 automated followups ceiling", async () => {
    const t = convexTest(schema, modules);
    const seed = await t.mutation(api.demo.reset, {});

    const draft = await t.query(api.outreach.getDraft, { prospectId: seed.prospectId });
    await t.mutation(internal.outreach.recordSendSuccess, {
      prospectId: seed.prospectId,
      draftId: draft!._id,
      messageId: "msg_outbound_init_3",
      threadId: "thread_fixture_rustic_kettle",
    });

    // First follow-up schedule allowed
    const sched1 = await t.mutation(internal.followups.scheduleNextFollowup, {
      prospectId: seed.prospectId,
      campaignId: seed.campaignId,
    });
    expect(sched1).not.toBeNull();

    // Simulate follow-up 1 sent
    await t.mutation(internal.followups.recordFollowupSent, {
      scheduleId: sched1!,
      prospectId: seed.prospectId,
      campaignId: seed.campaignId,
      attemptNumber: 1,
      messageId: "msg_fu_1",
      threadId: "thread_fixture_rustic_kettle",
      subject: "Follow up 1",
      text: "Checking in",
      at: Date.now(),
    });

    // Second follow-up schedule allowed
    const sched2 = await t.mutation(internal.followups.scheduleNextFollowup, {
      prospectId: seed.prospectId,
      campaignId: seed.campaignId,
    });
    expect(sched2).not.toBeNull();

    // Simulate follow-up 2 sent
    await t.mutation(internal.followups.recordFollowupSent, {
      scheduleId: sched2!,
      prospectId: seed.prospectId,
      campaignId: seed.campaignId,
      attemptNumber: 2,
      messageId: "msg_fu_2",
      threadId: "thread_fixture_rustic_kettle",
      subject: "Follow up 2",
      text: "Final check in",
      at: Date.now(),
    });

    // Third follow-up MUST be rejected by policy (ceiling of 2)
    const sched3 = await t.mutation(internal.followups.scheduleNextFollowup, {
      prospectId: seed.prospectId,
      campaignId: seed.campaignId,
    });
    expect(sched3).toBeNull();
  });

  it("suppresses prospect and blocks future sends when unsubscribed", async () => {
    const t = convexTest(schema, modules);
    const seed = await t.mutation(api.demo.reset, {});

    // Operator manually suppresses prospect
    await t.mutation(api.prospects.suppressProspect, {
      prospectId: seed.prospectId,
      reason: "manual_operator",
    });

    const p = await t.query(api.prospects.get, { prospectId: seed.prospectId });
    expect(p?.isSuppressed).toBe(true);
    expect(p?.outreachStatus).toBe("suppressed");

    // Follow-up scheduling should now reject suppressed prospect
    const sched = await t.mutation(internal.followups.scheduleNextFollowup, {
      prospectId: seed.prospectId,
      campaignId: seed.campaignId,
    });
    expect(sched).toBeNull();
  });
});
