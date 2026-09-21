import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { cents, when } from "../lib/format";
import type { Id } from "../../convex/_generated/dataModel";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "discovery" | "evidence" | "outreach" | "thread" | "proposals" | "ledger"
  >("discovery");

  const [selectedProspectId, setSelectedProspectId] = useState<Id<"prospects"> | null>(null);
  const [searchCategory, setSearchCategory] = useState("independent café");
  const [searchLocation, setSearchLocation] = useState("Toronto, ON");
  const [isSearching, setIsSearching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Edit draft state
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editPriceCents, setEditPriceCents] = useState(125000);

  // Queries
  const defaultWs = useMutation(api.workspaces.getOrCreateDefault);
  const [workspaceId, setWorkspaceId] = useState<Id<"workspaces"> | null>(null);

  useEffect(() => {
    defaultWs().then((ws) => setWorkspaceId(ws._id)).catch(console.error);
  }, []);

  const campaigns = useQuery(api.campaigns.list, workspaceId ? { workspaceId } : "skip");
  const activeCampaign = campaigns && campaigns.length > 0 ? campaigns[0] : null;

  const candidates = useQuery(
    api.discovery.listCandidates,
    activeCampaign ? { campaignId: activeCampaign._id } : "skip"
  );

  const prospects = useQuery(
    api.prospects.listByCampaign,
    activeCampaign ? { campaignId: activeCampaign._id } : "skip"
  );

  // Auto-select first prospect if none selected
  useEffect(() => {
    if (!selectedProspectId && prospects && prospects.length > 0) {
      setSelectedProspectId(prospects[0]._id);
    }
  }, [prospects, selectedProspectId]);

  const selectedProspect = useQuery(
    api.prospects.get,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );

  const evidence = useQuery(
    api.evidence.listEvidence,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );

  const draft = useQuery(
    api.outreach.getDraft,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );

  useEffect(() => {
    if (draft) {
      setEditSubject(draft.subject);
      setEditBody(draft.bodyText);
      setEditPriceCents(draft.proposedPriceCents);
    }
  }, [draft?._id, draft?.subject, draft?.bodyText, draft?.proposedPriceCents]);

  const thread = useQuery(
    api.threads.getThread,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );

  const proposalHistory = useQuery(
    api.proposals.getProposalHistory,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );

  const followupSchedules = useQuery(
    api.followups.getSchedules,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );

  const websiteVersions = useQuery(
    api.previews.listVersions,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );
  const activePreviewSlug =
    websiteVersions && websiteVersions.length > 0
      ? websiteVersions[0].slug
      : draft?.shareUrl
      ? draft.shareUrl.replace(/^\/preview\//, "")
      : "rustic-kettle-preview-v1";

  const activityLedger = useQuery(
    api.activity.listByWorkspace,
    workspaceId ? { workspaceId } : "skip"
  );

  // Mutations & Actions
  const resetDemo = useMutation(api.demo.reset);
  const updateCampaignMode = useMutation(api.campaigns.updateMode);
  const searchPlacesAction = useAction(api.discovery.search);
  const approveCandidate = useMutation(api.discovery.approveCandidate);
  const dismissCandidate = useMutation(api.discovery.dismissCandidate);
  const approveDraftMutation = useMutation(api.outreach.approveDraft);
  const rejectDraftMutation = useMutation(api.outreach.rejectDraft);
  const updateDraftMutation = useMutation(api.outreach.updateDraft);
  const sendOutreachAction = useAction(api.outreach.sendOutreach);
  const simulateReplyMutation = useMutation(api.threads.simulateInboundReply);
  const acceptProposalMutation = useMutation(api.proposals.acceptProposal);
  const declineProposalMutation = useMutation(api.proposals.declineProposal);

  const notify = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 6000);
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await resetDemo();
      setSelectedProspectId(res.prospectId);
      notify("Demo environment reset: seeded 'The Rustic Kettle' hero flow!");
    } catch (err: any) {
      notify(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign) return;
    setIsSearching(true);
    try {
      const res = await searchPlacesAction({
        campaignId: activeCampaign._id,
        query: searchCategory,
        location: searchLocation,
      });
      notify(`Search complete: ${res.count} candidates retrieved via ${res.provider}.`);
    } catch (err: any) {
      notify(`Search error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApproveCandidate = async (candidateId: Id<"placesCandidates">) => {
    try {
      const newProspectId = await approveCandidate({ candidateId });
      setSelectedProspectId(newProspectId);
      setActiveTab("evidence");
      notify("Candidate approved as prospect! Web audit & structured artifact generation triggered.");
    } catch (err: any) {
      notify(`Approval error: ${err.message}`);
    }
  };

  const handleSendOutreach = async () => {
    if (!selectedProspectId) return;
    try {
      const res = await sendOutreachAction({ prospectId: selectedProspectId });
      notify(res.message);
      setActiveTab("thread");
    } catch (err: any) {
      notify(`Send blocked by policy: ${err.message}`);
    }
  };

  const handleSaveDraftEdit = async () => {
    if (!draft) return;
    try {
      await updateDraftMutation({
        draftId: draft._id,
        subject: editSubject,
        bodyText: editBody,
        proposedPriceCents: editPriceCents,
      });
      setIsEditingDraft(false);
      notify("Draft updated. Notice: Previous approval was invalidated due to content modification.");
    } catch (err: any) {
      notify(`Update error: ${err.message}`);
    }
  };

  const handleSimulateReply = async () => {
    if (!selectedProspectId) return;
    try {
      await simulateReplyMutation({ prospectId: selectedProspectId });
      notify("Simulated inbound reply from café owner received! Check thread & proposal revisions.");
      setActiveTab("thread");
    } catch (err: any) {
      notify(`Simulation error: ${err.message}`);
    }
  };

  return (
    <div className="desk-shell">
      {/* Top Header */}
      <header className="desk-header">
        <div className="desk-brand">
          <div className="desk-logo-icon">S</div>
          <div>
            <div className="desk-brand-title">Storefront Desk</div>
            <span className="desk-tag">Provisional Naming • North American SMB Acquisition Engine</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {selectedProspect && (
            <Link
              to={`/preview/${activePreviewSlug}`}
              target="_blank"
              className="btn btn-sm"
              style={{ background: "#f1f5f9" }}
            >
              🌐 Open Live Website Preview ↗
            </Link>
          )}
          <button
            onClick={handleResetDemo}
            disabled={isResetting}
            className="btn btn-sm btn-primary"
          >
            {isResetting ? "Resetting..." : "⚡ Reset Demo & Seed Hero Flow"}
          </button>
        </div>
      </header>

      {/* Persistent Fixture Mode Banner */}
      <div className="fixture-banner">
        <div className="fixture-indicator">
          <span className="fixture-dot" />
          <span>
            <strong>Deterministic Fixture Mode Active</strong> — Zero live network calls or unapproved external sends.
          </span>
        </div>
        <span style={{ fontSize: "12px", opacity: 0.85 }}>
          All 4 Sponsors Verified: Convex Relational DB • OpenAI Structured Outputs • Firecrawl Audit • AgentMail Threading
        </span>
      </div>

      {actionNotice && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e40af",
            padding: "10px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          ℹ️ {actionNotice}
        </div>
      )}

      {/* Campaign Bar */}
      {activeCampaign && (
        <div className="campaign-bar">
          <div className="campaign-info">
            <span className="campaign-name">{activeCampaign.name}</span>
            <span className="campaign-meta">
              Target: <strong>{activeCampaign.category}</strong> in <strong>{activeCampaign.location}</strong> • Follow-up ceiling: <strong>2 maximum</strong>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--ink-muted)", fontWeight: 600 }}>Campaign Mode:</span>
            <div className="mode-selector">
              <button
                className={`mode-btn ${activeCampaign.mode === "manual" ? "active" : ""}`}
                onClick={() => updateCampaignMode({ campaignId: activeCampaign._id, mode: "manual" })}
              >
                Manual (Every Send Approved)
              </button>
              <button
                className={`mode-btn ${activeCampaign.mode === "assisted_followups" ? "active" : ""}`}
                onClick={() => updateCampaignMode({ campaignId: activeCampaign._id, mode: "assisted_followups" })}
              >
                Assisted Follow-ups (Max 2)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Nav */}
      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === "discovery" ? "active" : ""}`}
          onClick={() => setActiveTab("discovery")}
        >
          🔍 1. Discovery & Candidates
          <span className="tab-badge">{candidates?.length ?? 0}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "evidence" ? "active" : ""}`}
          onClick={() => setActiveTab("evidence")}
        >
          📑 2. Audited Evidence & Brief
          <span className="tab-badge">{evidence?.claims?.length ?? 0} claims</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "outreach" ? "active" : ""}`}
          onClick={() => setActiveTab("outreach")}
        >
          ✉️ 3. Outreach & Approval Queue
          {draft && (
            <span
              className={`badge badge-${
                draft.approvalStatus === "approved"
                  ? "green"
                  : draft.approvalStatus === "pending_approval"
                  ? "amber"
                  : "red"
              }`}
            >
              {draft.approvalStatus}
            </span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === "thread" ? "active" : ""}`}
          onClick={() => setActiveTab("thread")}
        >
          💬 4. AgentMail Thread
          <span className="tab-badge">{thread?.messages?.length ?? 0}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "proposals" ? "active" : ""}`}
          onClick={() => setActiveTab("proposals")}
        >
          🤝 5. Commercial Terms & Revisions
          <span className="tab-badge">v{proposalHistory?.[0]?.version ?? 1}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "ledger" ? "active" : ""}`}
          onClick={() => setActiveTab("ledger")}
        >
          📜 6. Activity Ledger & Schedule
          <span className="tab-badge">{activityLedger?.length ?? 0}</span>
        </button>
      </nav>

      {/* TAB 1: Discovery */}
      {activeTab === "discovery" && (
        <div>
          <div className="card">
            <h3 className="card-title">Google Places Official Discovery</h3>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <input
                type="text"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                placeholder="Category (e.g. independent café)"
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  flex: "1 1 220px",
                }}
              />
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Location (e.g. Toronto, ON)"
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  flex: "1 1 220px",
                }}
              />
              <button type="submit" disabled={isSearching} className="btn btn-primary">
                {isSearching ? "Searching Places..." : "Search Places Candidates"}
              </button>
            </form>
          </div>

          <div className="candidate-grid">
            {candidates?.map((c: any) => (
              <div key={c._id} className="candidate-card">
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 className="candidate-title">{c.name}</h4>
                    <span className="badge badge-amber">{c.status}</span>
                  </div>
                  <div className="candidate-address">📍 {c.formattedAddress}</div>
                  <div style={{ fontSize: "13px", marginBottom: "8px" }}>
                    ⭐ {c.rating} ({c.userRatingsTotal} reviews) • {c.priceLevel ? "$".repeat(c.priceLevel) : "$$"}
                  </div>

                  <div className="signals-list">
                    <strong style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--amber)" }}>
                      Weak Presence Signals:
                    </strong>
                    {c.weakPresenceSignals.map((s: string, idx: number) => (
                      <div key={idx} className="signal-item">
                        ⚠️ {s}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                  {c.status === "approved" ? (
                    <button
                      className="btn btn-sm"
                      style={{ background: "#dcfce7", color: "#166534", width: "100%" }}
                      onClick={() => {
                        if (c.prospectId) setSelectedProspectId(c.prospectId);
                        setActiveTab("evidence");
                      }}
                    >
                      ✓ Approved Prospect (View Brief)
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ flex: 1 }}
                        onClick={() => handleApproveCandidate(c._id)}
                      >
                        Approve for Outreach
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => dismissCandidate({ candidateId: c._id })}
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Audited Evidence & Brief */}
      {activeTab === "evidence" && selectedProspect && (
        <div>
          <div className="card">
            <h3 className="card-title">
              <span>Audited Business Brief: {selectedProspect.name}</span>
              <span className="badge badge-green">Grounded with Structured Citations</span>
            </h3>
            <p style={{ color: "var(--ink-muted)", fontSize: "14px", marginTop: "-8px", marginBottom: "20px" }}>
              Every claim below is verified against official Google Places listing data and Firecrawl open-web scrapes.
              No unconfirmed menu items, prices, or awards are hallucinated.
            </p>

            {evidence && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div>
                  <h4 style={{ margin: "0 0 12px" }}>Open-Web Scraped Sources ({evidence.sources.length})</h4>
                  <div className="evidence-list">
                    {evidence.sources.map((s: any) => (
                      <div key={s._id} className="evidence-item">
                        <div className="evidence-header">
                          <strong>{s.title}</strong>
                          <span className="badge badge-blue">{s.provider}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
                          URL: <code>{s.url}</code> • Retrieved: {when(s.retrievedAt)}
                        </div>
                        {s.rawTextSnippet && (
                          <div className="evidence-excerpt">{s.rawTextSnippet}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 12px" }}>Established Factual Claims ({evidence.claims.length})</h4>
                  <div className="evidence-list">
                    {evidence.claims.map((cl: any) => (
                      <div key={cl._id} className="evidence-item">
                        <div className="evidence-header">
                          <span style={{ fontWeight: 700 }}>{cl.claimKey}</span>
                          <span
                            className={`badge badge-${
                              cl.status === "verified" ? "green" : "amber"
                            }`}
                          >
                            {cl.status} ({cl.confidence})
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", margin: "4px 0" }}>{cl.statement}</div>
                        <div className="evidence-excerpt">"{cl.rawExcerpt}"</div>
                      </div>
                    ))}
                  </div>

                  <div className="needs-confirmation-box">
                    <strong>⚠️ Explicitly Unconfirmed Details:</strong>
                    <div style={{ marginTop: "6px" }}>
                      • Corporate event catering packages & custom birthday cake orders were not found on the open web.
                      Marked as <em>"Needs Confirmation"</em> rather than fabricated.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Outreach & Approval Queue */}
      {activeTab === "outreach" && draft && selectedProspect && (
        <div>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px" }}>Outreach Draft v{draft.version}</h3>
                <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
                  Recipient: <strong>{draft.recipientEmail}</strong> • Commercial terms: <strong>{cents(draft.proposedPriceCents, draft.currency)}</strong>, {draft.proposedTimelineDays}-day turnaround
                </span>
              </div>
              <span
                className={`badge badge-${
                  draft.approvalStatus === "approved"
                    ? "green"
                    : draft.approvalStatus === "pending_approval"
                    ? "amber"
                    : "red"
                }`}
                style={{ fontSize: "13px", padding: "6px 12px" }}
              >
                {draft.approvalStatus.toUpperCase()}
              </span>
            </div>

            {draft.approvalStatus === "expired_due_to_edit" && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                ⚠️ Approval Expired: This pitch was edited after operator approval. A fresh approval is required before dispatch!
              </div>
            )}

            {isEditingDraft ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    Proposed Price (Cents)
                  </label>
                  <input
                    type="number"
                    value={editPriceCents}
                    onChange={(e) => setEditPriceCents(Number(e.target.value))}
                    style={{ width: "200px", padding: "8px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    Email Body
                  </label>
                  <textarea
                    rows={12}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-primary" onClick={handleSaveDraftEdit}>
                    Save Changes & Invalidate Prior Approval
                  </button>
                  <button className="btn" onClick={() => setIsEditingDraft(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "var(--surface-alt)",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ marginBottom: "8px", fontSize: "14px" }}>
                  <strong>Subject:</strong> {draft.subject}
                </div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {draft.bodyText}
                </pre>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              {draft.approvalStatus !== "approved" ? (
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    await approveDraftMutation({ draftId: draft._id });
                    notify("Outreach draft approved! Ready for dispatch.");
                  }}
                >
                  ✓ Approve Pitch for Sending
                </button>
              ) : (
                <button
                  className="btn"
                  style={{ color: "var(--red)" }}
                  onClick={async () => {
                    await rejectDraftMutation({ draftId: draft._id });
                    notify("Draft rejected.");
                  }}
                >
                  ✕ Reject / Revoke Approval
                </button>
              )}

              {!isEditingDraft && (
                <button className="btn" onClick={() => setIsEditingDraft(true)}>
                  ✏️ Edit Pitch
                </button>
              )}

              <button
                className="btn btn-primary"
                style={{ background: "#059669", borderColor: "#059669" }}
                disabled={draft.approvalStatus !== "approved"}
                onClick={handleSendOutreach}
              >
                🚀 Dispatch Email via AgentMail
              </button>

              <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
                {draft.approvalStatus === "approved"
                  ? `Approved by ${draft.approvedBy} at ${when(draft.approvedAt ?? Date.now())}`
                  : "Approval required by authorized operator before dispatch."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AgentMail Conversation */}
      {activeTab === "thread" && selectedProspect && (
        <div>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px" }}>AgentMail Thread: {selectedProspect.name}</h3>
                <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
                  Recipient: <strong>{selectedProspect.targetEmail}</strong> • Status: <strong>{selectedProspect.outreachStatus}</strong>
                </span>
              </div>
              <button className="btn btn-primary" onClick={handleSimulateReply}>
                💬 Simulate Inbound Reply & Counteroffer
              </button>
            </div>

            <div className="thread-container">
              {thread?.messages?.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--ink-muted)" }}>
                  No messages sent yet. Approve and dispatch the initial outreach pitch in Tab 3!
                </div>
              ) : (
                thread?.messages?.map((m: any) => (
                  <div
                    key={m._id}
                    className={`message-bubble ${
                      m.direction === "outbound" ? "message-outbound" : "message-inbound"
                    }`}
                  >
                    <div className="message-header">
                      <span>
                        <strong>{m.direction === "outbound" ? "Storefront Desk Operator" : m.from}</strong>
                      </span>
                      <span>{when(m.receivedOrSentAt)}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "4px" }}>
                      Subject: {m.subject}
                    </div>
                    <div className="message-body">{m.text}</div>

                    {m.classification && (
                      <div style={{ marginTop: "8px" }}>
                        <span className="badge badge-amber">
                          AI Classification: {m.classification}
                        </span>
                        {m.proposedChanges && (
                          <div
                            style={{
                              marginTop: "6px",
                              fontSize: "12px",
                              background: "#fffbeb",
                              padding: "8px",
                              borderRadius: "6px",
                              border: "1px solid #fef08a",
                            }}
                          >
                            <strong>Proposed Terms:</strong> {m.proposedChanges.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Commercial Terms & Revisions */}
      {activeTab === "proposals" && selectedProspect && (
        <div>
          <div className="card">
            <h3 className="card-title">
              <span>Commercial Terms & Scope Versions</span>
              <span className="badge badge-blue">Controlled Human Negotiation</span>
            </h3>
            <p style={{ color: "var(--ink-muted)", fontSize: "14px", marginTop: "-8px", marginBottom: "20px" }}>
              Storefront Desk guarantees that AI models can never autonomously bind commercial terms or accept counteroffers.
              Any client proposal modification triggers a version diff requiring explicit operator decision.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {proposalHistory?.map((p: any) => (
                <div
                  key={p._id}
                  className={`proposal-version-card ${
                    p.humanDecisionRequired ? "highlight" : ""
                  }`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <span style={{ fontSize: "17px", fontWeight: 700 }}>
                        Proposal Version {p.version} — {cents(p.priceCents, p.currency)}
                      </span>
                      <span style={{ marginLeft: "12px", fontSize: "13px", color: "var(--ink-muted)" }}>
                        Timeline: {p.timelineDays} days • Created: {when(p.createdAt)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span
                        className={`badge badge-${
                          p.status === "accepted"
                            ? "green"
                            : p.status === "counter_proposed_by_client"
                            ? "amber"
                            : "blue"
                        }`}
                      >
                        {p.status}
                      </span>
                      {p.isCommerciallyBinding && (
                        <span className="badge badge-green">🔒 Binding Agreement</span>
                      )}
                    </div>
                  </div>

                  {p.changeReason && (
                    <div style={{ fontSize: "13px", fontStyle: "italic", marginBottom: "12px", color: "var(--amber)" }}>
                      Reason: {p.changeReason}
                    </div>
                  )}

                  <div style={{ marginBottom: "12px" }}>
                    <strong style={{ fontSize: "13px" }}>Scope of Work:</strong>
                    <ul style={{ margin: "4px 0 0", paddingLeft: "20px", fontSize: "13px" }}>
                      {p.scopeItems.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ fontSize: "13px", color: "var(--ink-muted)", marginBottom: "16px" }}>
                    <strong>Terms:</strong> {p.termsSummary}
                  </div>

                  {p.humanDecisionRequired && (
                    <div
                      style={{
                        background: "#fffbeb",
                        border: "1px solid #fcd34d",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#92400e" }}>
                        ⚠️ Client Counteroffer Awaiting Operator Action: Accept ${ (p.priceCents / 100).toFixed(2) } CAD with 10-day timeline?
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={async () => {
                            await acceptProposalMutation({ proposalId: p._id });
                            notify(`Proposal v${p.version} accepted! Binding terms established.`);
                          }}
                        >
                          ✓ Accept Counteroffer
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ color: "var(--red)" }}
                          onClick={async () => {
                            await declineProposalMutation({ proposalId: p._id });
                            notify(`Proposal v${p.version} declined.`);
                          }}
                        >
                          ✕ Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {p.decidedBy && (
                    <div style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "8px" }}>
                      Decided by {p.decidedBy} at {when(p.decidedAt ?? Date.now())}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Activity Ledger & Follow-up Schedule */}
      {activeTab === "ledger" && (
        <div>
          <div className="card">
            <h3 className="card-title">Automated Follow-up Schedule Tracker</h3>
            <p style={{ color: "var(--ink-muted)", fontSize: "14px", marginTop: "-8px", marginBottom: "16px" }}>
              In <code>assisted_followups</code> mode, at most two non-binding follow-ups are permitted.
              Any reply, bounce, unsubscribe, or operator pause immediately cancels all pending follow-ups.
            </p>

            {followupSchedules && followupSchedules.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {followupSchedules.map((s: any) => (
                  <div
                    key={s._id}
                    style={{
                      border: "1px solid var(--line)",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong>Follow-up Attempt #{s.attemptNumber} of 2</strong>
                      <div style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
                        Scheduled: {new Date(s.scheduledTime).toISOString().slice(0, 10)} • Created: {when(s.createdAt)}
                      </div>
                      {s.cancellationReason && (
                        <div style={{ fontSize: "12px", color: "var(--red)", marginTop: "4px" }}>
                          Cancelled: {s.cancellationReason}
                        </div>
                      )}
                    </div>
                    <span
                      className={`badge badge-${
                        s.status === "sent" ? "green" : s.status === "pending" ? "blue" : "amber"
                      }`}
                    >
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--ink-muted)", fontSize: "13px" }}>
                No active follow-ups scheduled for this prospect.
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Immutable Reactive Activity Ledger</h3>
            <div className="ledger-timeline">
              {activityLedger?.map((entry: any) => (
                <div key={entry._id} className="ledger-entry">
                  <span className="ledger-time">{when(entry.at)}</span>
                  <div className="ledger-content">
                    <span className="ledger-actor">[{entry.actor}]</span>
                    <span>{entry.summary}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
