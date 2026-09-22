import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { cents, when } from "../lib/format";
import type { Id } from "../../convex/_generated/dataModel";
import {
  IconMapPin,
  IconMail,
  IconGlobe,
  IconAlertTriangle,
  IconZap,
  IconStar,
  IconSearch,
  IconCheck,
  IconExternalLink,
  IconFileText,
  IconMessageSquare,
  IconFileCheck,
  IconMonitor,
  IconActivity,
  IconSidebar,
  IconInfo,
  IconX,
  IconEdit,
  IconSend,
  IconLock,
} from "../components/Icons";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "discovery" | "evidence" | "outreach" | "thread" | "proposals" | "ledger" | "preview"
  >("evidence");

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [previewThemeVariant, setPreviewThemeVariant] = useState<string>("warm-artisan");
  const [selectedProspectId, setSelectedProspectId] = useState<Id<"prospects"> | null>(null);
  const [searchCategory, setSearchCategory] = useState("independent café");
  const [searchLocation, setSearchLocation] = useState("Toronto, ON");
  const [isSearching, setIsSearching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    <div className="studio-shell" data-theme={theme}>
      {/* Top Command Bar */}
      <header className="studio-topbar">
        <div className="studio-brand-group">
          <div className="studio-logo-icon">S</div>
          <div>
            <div className="studio-title">Storefront Desk</div>
            <div className="studio-subtitle">SMB Acquisition &amp; Storefront Engine</div>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="studio-status-strip">
          <span className="led-dot led-dot-green" />
          <span style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 500 }}>
            Live Engine Active
          </span>
          <span style={{ color: "rgba(255, 255, 255, 0.15)", margin: "0 2px" }}>•</span>
          <span style={{ color: "var(--ink-muted)", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
            Convex Reactive Sync
          </span>
        </div>

        {/* Top Actions */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="btn btn-secondary btn-sm"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Theme`}
          >
            {theme === "dark" ? "☀ Light Mode" : "☾ Dark Mode"}
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="btn btn-secondary btn-sm"
            title="Toggle Pipeline Sidebar"
          >
            <IconSidebar size={13} style={{ opacity: 0.8 }} /> Pipeline ({candidates?.length ?? 0})
          </button>
          {selectedProspect && (
            <Link
              to={`/preview/${activePreviewSlug}`}
              target="_blank"
              className="btn btn-secondary btn-sm"
            >
              <IconGlobe size={13} /> View Storefront <IconExternalLink size={11} style={{ opacity: 0.6 }} />
            </Link>
          )}
          <button
            onClick={handleResetDemo}
            disabled={isResetting}
            className="btn btn-sm btn-primary"
          >
            <IconZap size={13} /> {isResetting ? "Resetting..." : "Reset Hero Flow"}
          </button>
        </div>
      </header>

      {/* Workspace Split Layout */}
      <div className={`studio-workspace ${isSidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
        {/* Left Column: Persistent Target Pipeline & Discovery */}
        <aside className="pipeline-sidebar">
          <div className="sidebar-heading">
            <span>Target Pipeline</span>
            <span className="tab-badge">{candidates?.length ?? 0}</span>
          </div>

          <form onSubmit={handleSearch} className="sidebar-search-box">
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-muted)", letterSpacing: "0.04em" }}>
              Places Discovery
            </div>
            <input
              type="text"
              className="studio-input"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              placeholder="Category (e.g. independent café)"
            />
            <input
              type="text"
              className="studio-input"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Location (e.g. Toronto, ON)"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="btn btn-sm btn-primary"
              style={{ width: "100%", marginTop: "2px" }}
            >
              <IconSearch size={13} /> {isSearching ? "Querying Places..." : "Query Google Places"}
            </button>
          </form>

          {/* Continuous Ruled Pipeline Rows */}
          <div className="candidate-list">
            {candidates?.map((c: any) => {
              const isSelected = selectedProspectId === c.prospectId;
              return (
                <div
                  key={c._id}
                  className={`candidate-item-row ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    if (c.prospectId) setSelectedProspectId(c.prospectId);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "var(--ink-primary)", lineHeight: 1.3, fontWeight: 600 }}>{c.name}</strong>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "10px", color: c.status === "approved" ? "var(--status-green)" : "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
                      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: c.status === "approved" ? "var(--status-green)" : "var(--ink-faint)" }} />
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <IconMapPin size={11} color="var(--ink-faint)" /> {c.formattedAddress}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--ink-secondary)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <IconStar size={11} color="var(--status-amber)" /> {c.rating} ({c.userRatingsTotal}) • {c.priceLevel ? "$".repeat(c.priceLevel) : "$$"}
                  </div>

                  <div className="presence-chips">
                    {c.weakPresenceSignals.slice(0, 2).map((s: string, idx: number) => {
                      const shortText = s
                        .replace("Heavy reliance on third-party delivery apps with 30% commission cuts", "30% Delivery Cut")
                        .replace("No official first-party website", "No Website")
                        .replace("Existing site is not mobile-responsive (fails viewport test)", "Non-Responsive Site")
                        .replace("SSL certificate expired 140 days ago", "Expired SSL")
                        .replace("No active website domain on Google listing", "No Domain on Google")
                        .replace("Menu only available as a low-res photo on social media", "Photo-Only Menu");
                      return (
                        <span key={idx} className="presence-chip">
                          {shortText}
                        </span>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: "6px" }}>
                    {c.status === "approved" ? (
                      <div style={{ fontSize: "11px", color: "var(--status-green)", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="led-dot led-dot-green" /> Selected Target
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ flex: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveCandidate(c._id);
                          }}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissCandidate({ candidateId: c._id });
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Column: Main Stage Console */}
        <main className="stage-main">
          {actionNotice && (
            <div
              style={{
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                color: "#c7d2fe",
                padding: "10px 16px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                animation: "noticeSlide var(--duration-fast) var(--ease-spring)",
              }}
            >
              <IconInfo size={15} color="#818cf8" /> {actionNotice}
            </div>
          )}

          {/* Active Prospect Hero Card */}
          {selectedProspect && (
            <div className="prospect-hero-panel">
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span className="status-pill status-pill-subtle">
                    Active Prospect
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>•</span>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>{activeCampaign?.name}</span>
                </div>
                <h2 className="prospect-name">{selectedProspect.name}</h2>
                <div className="prospect-submeta">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <IconMapPin size={12} color="var(--ink-muted)" /> {selectedProspect.address}
                  </span>
                  <span>•</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <IconMail size={12} color="var(--ink-muted)" /> {selectedProspect.targetEmail}
                  </span>
                  <span>•</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ink-secondary)" }}>
                    <span
                      className={`led-dot ${
                        selectedProspect.outreachStatus === "accepted"
                          ? "led-dot-green"
                          : selectedProspect.outreachStatus === "sent"
                          ? "led-dot-blue"
                          : "led-dot-amber"
                      }`}
                    />
                    <span style={{ textTransform: "capitalize", fontWeight: 500 }}>
                      {selectedProspect.outreachStatus}
                    </span>
                  </span>
                </div>
              </div>

              {activeCampaign && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 500 }}>Policy Guardrail</span>
                  <div className="mode-selector">
                    <button
                      className={`mode-btn ${activeCampaign.mode === "manual" ? "active" : ""}`}
                      onClick={() => updateCampaignMode({ campaignId: activeCampaign._id, mode: "manual" })}
                    >
                      Manual Approval
                    </button>
                    <button
                      className={`mode-btn ${activeCampaign.mode === "assisted_followups" ? "active" : ""}`}
                      onClick={() => updateCampaignMode({ campaignId: activeCampaign._id, mode: "assisted_followups" })}
                    >
                      Assisted (Max 2)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Segmented Console Navigation */}
          <nav className="desk-tabs">
            <button
              className={`desk-tab-btn ${activeTab === "evidence" ? "active" : ""}`}
              onClick={() => setActiveTab("evidence")}
            >
              <IconFileText size={13} /> Grounded Brief
              <span className="tab-badge">{evidence?.claims?.length ?? 0}</span>
            </button>
            <button
              className={`desk-tab-btn ${activeTab === "outreach" ? "active" : ""}`}
              onClick={() => setActiveTab("outreach")}
            >
              <IconMail size={13} /> Pitch Queue
              {draft && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    color:
                      draft.approvalStatus === "approved"
                        ? "var(--status-green)"
                        : draft.approvalStatus === "pending_approval"
                        ? "var(--status-amber)"
                        : "var(--status-red)",
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background:
                        draft.approvalStatus === "approved"
                          ? "var(--status-green)"
                          : draft.approvalStatus === "pending_approval"
                          ? "var(--status-amber)"
                          : "var(--status-red)",
                    }}
                  />
                  {draft.approvalStatus === "approved"
                    ? "Approved"
                    : draft.approvalStatus === "pending_approval"
                    ? "Review"
                    : "Declined"}
                </span>
              )}
            </button>
            <button
              className={`desk-tab-btn ${activeTab === "thread" ? "active" : ""}`}
              onClick={() => setActiveTab("thread")}
            >
              <IconMessageSquare size={13} /> AgentMail Thread
              <span className="tab-badge">{thread?.messages?.length ?? 0}</span>
            </button>
            <button
              className={`desk-tab-btn ${activeTab === "proposals" ? "active" : ""}`}
              onClick={() => setActiveTab("proposals")}
            >
              <IconFileCheck size={13} /> Terms
              <span className="tab-badge">v{proposalHistory?.[0]?.version ?? 1}</span>
            </button>
            <button
              className={`desk-tab-btn ${activeTab === "preview" ? "active" : ""}`}
              onClick={() => setActiveTab("preview")}
            >
              <IconMonitor size={13} /> Storefront Studio
            </button>
            <button
              className={`desk-tab-btn ${activeTab === "ledger" ? "active" : ""}`}
              onClick={() => setActiveTab("ledger")}
            >
              <IconActivity size={13} /> Ledger
              <span className="tab-badge">{activityLedger?.length ?? 0}</span>
            </button>
          </nav>

          {/* TAB 1: Audited Evidence & Brief */}
          {activeTab === "evidence" && selectedProspect && (
            <div style={{ animation: "fadeSlideUp var(--duration-normal) var(--ease-spring) both" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--ink-primary)", letterSpacing: "-0.015em" }}>
                    Verified Intelligence Ledger
                  </h3>
                  <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "var(--ink-muted)" }}>
                    Cross-referenced claims extracted from public records and web crawls.
                  </p>
                </div>
                <span className="status-pill status-pill-subtle">
                  Fact-Checked Citations
                </span>
              </div>

              {evidence && (
                <div>
                  {/* Unboxed Minimalist Metrics Strip */}
                  <div className="audit-metrics-strip">
                    <div className="audit-metric-col">
                      <span className="metric-label">Citations Scraped</span>
                      <span className="metric-value">{evidence.sources.length} <span className="metric-sub">Sources</span></span>
                    </div>
                    <div className="metric-divider" />
                    <div className="audit-metric-col">
                      <span className="metric-label">Grounded Facts</span>
                      <span className="metric-value">{evidence.claims.length} <span className="metric-sub">Verified</span></span>
                    </div>
                    <div className="metric-divider" />
                    <div className="audit-metric-col">
                      <span className="metric-label">Safety Policy Guardrail</span>
                      <span className="metric-value">1 <span className="metric-sub">Manual Review</span></span>
                    </div>
                  </div>

                  {/* Technical Inspection Ledger: Borderless Table with Surface Depth */}
                  <div className="audit-table-container">
                    <div className="audit-table-header">
                      <span>Domain Scope</span>
                      <span>Established Factual Claim &amp; Web Excerpt</span>
                      <span style={{ textAlign: "right" }}>Verification</span>
                    </div>

                    {evidence.claims.map((cl: any) => (
                      <div key={cl._id} className="audit-table-row">
                        <div>
                          <span className="claim-category-badge">
                            {cl.claimKey === "unconfirmed_catering" ? (
                              <span className="status-glyph status-glyph-amber">▲</span>
                            ) : (
                              <span className="status-glyph status-glyph-green">◆</span>
                            )}
                            {cl.claimKey.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: "13.5px", color: "var(--ink-primary)", lineHeight: 1.5, fontWeight: 500 }}>
                            {cl.statement}
                          </div>
                          <div className="claim-quote-box">
                            <span className="excerpt-prefix">SRC // </span>{cl.rawExcerpt}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {cl.status === "verified" ? (
                            <span className="status-pill status-pill-green">
                              <span className="status-glyph status-glyph-green">◆</span> Verified
                            </span>
                          ) : (
                            <span className="status-pill status-pill-amber">
                              <span className="status-glyph status-glyph-amber">▲</span> Review Flag
                            </span>
                          )}
                          <div style={{ fontSize: "10.5px", color: "var(--ink-muted)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                            {typeof cl.confidence === "number" ? `${Math.round(cl.confidence * 100)}% match` : String(cl.confidence)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sources and Safeguard */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "12px" }}>
                        Web Citations &amp; Provenance ({evidence.sources.length})
                      </div>
                      <div className="sources-list">
                        {evidence.sources.map((s: any) => (
                          <div key={s._id} className="source-row">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ color: "var(--ink-primary)", fontSize: "13px", fontWeight: 600 }}>{s.title}</strong>
                              <span className="status-pill status-pill-subtle" style={{ fontSize: "10px" }}>{s.provider}</span>
                            </div>
                            <div style={{ fontSize: "11.5px", color: "var(--ink-muted)", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
                              <code>{s.url}</code> • {when(s.retrievedAt)}
                            </div>
                            {s.rawTextSnippet && (
                              <div style={{ fontSize: "12px", color: "var(--ink-secondary)", lineHeight: 1.5, marginTop: "2px" }}>
                                {s.rawTextSnippet}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "12px" }}>
                        Safety Policy Guardrail
                      </div>
                      <div
                        style={{
                          background: "rgba(245, 158, 11, 0.03)",
                          border: "1px solid rgba(245, 158, 11, 0.16)",
                          borderLeft: "2px solid var(--status-amber)",
                          borderRadius: "8px",
                          padding: "18px 20px",
                          fontSize: "13px",
                          color: "var(--ink-secondary)",
                          lineHeight: 1.6,
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px", color: "#fbbf24" }}>
                          <IconAlertTriangle size={15} color="var(--status-amber)" />
                          Unconfirmed Services Notice
                        </div>
                        <p style={{ margin: "0 0 10px", color: "var(--ink-primary)" }}>
                          Corporate event catering packages and custom birthday cake orders were not found on the open web for this business.
                        </p>
                        <div style={{ fontSize: "12px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                          • Marked as <strong style={{ color: "#fbbf24" }}>"Needs Confirmation"</strong> rather than fabricated by AI.<br />
                          • Storefront Desk guarantees zero invented menu items, hours, or pricing tiers.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Outreach & Approval Queue */}
          {activeTab === "outreach" && draft && selectedProspect && (
            <div>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", color: "var(--ink-primary)" }}>Outreach Draft v{draft.version}</h3>
                    <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
                      Recipient: <strong style={{ color: "var(--ink-primary)" }}>{draft.recipientEmail}</strong> • Commercial terms: <strong>{cents(draft.proposedPriceCents, draft.currency)}</strong>, {draft.proposedTimelineDays}-day turnaround
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
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                  >
                    {draft.approvalStatus.toUpperCase()}
                  </span>
                </div>

                {draft.approvalStatus === "expired_due_to_edit" && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      color: "#fca5a5",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontSize: "13px",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <IconAlertTriangle size={15} color="#f87171" />
                    Approval Expired: This pitch was edited after operator approval. A fresh approval is required before dispatch!
                  </div>
                )}

                {isEditingDraft ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px", color: "var(--ink-secondary)" }}>
                        Subject Line
                      </label>
                      <input
                        type="text"
                        className="studio-input"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px", color: "var(--ink-secondary)" }}>
                        Proposed Price (Cents)
                      </label>
                      <input
                        type="number"
                        className="studio-input"
                        style={{ width: "220px" }}
                        value={editPriceCents}
                        onChange={(e) => setEditPriceCents(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px", color: "var(--ink-secondary)" }}>
                        Email Body
                      </label>
                      <textarea
                        rows={12}
                        className="studio-input"
                        style={{ fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: 1.6 }}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn btn-primary" onClick={handleSaveDraftEdit}>
                        Save Changes &amp; Invalidate Prior Approval
                      </button>
                      <button className="btn" onClick={() => setIsEditingDraft(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "var(--bg-surface-elevated)",
                      border: "1px solid var(--line-subtle)",
                      borderRadius: "10px",
                      padding: "20px",
                      marginBottom: "20px",
                    }}
                  >
                    <div style={{ marginBottom: "12px", fontSize: "14px", color: "var(--ink-secondary)" }}>
                      <strong style={{ color: "var(--ink-primary)" }}>Subject:</strong> {draft.subject}
                    </div>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        fontFamily: "var(--font-sans)",
                        fontSize: "14px",
                        lineHeight: 1.65,
                        margin: 0,
                        color: "var(--ink-primary)",
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
                      <IconCheck size={14} /> Approve Pitch for Sending
                    </button>
                  ) : (
                    <button
                      className="btn"
                      style={{ color: "#f87171", borderColor: "rgba(239, 68, 68, 0.4)" }}
                      onClick={async () => {
                        await rejectDraftMutation({ draftId: draft._id });
                        notify("Draft rejected.");
                      }}
                    >
                      <IconX size={14} /> Revoke Approval
                    </button>
                  )}

                  {!isEditingDraft && (
                    <button className="btn" onClick={() => setIsEditingDraft(true)}>
                      <IconEdit size={13} /> Edit Pitch
                    </button>
                  )}

                  <button
                    className="btn btn-primary"
                    style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderColor: "#10b981" }}
                    disabled={draft.approvalStatus !== "approved"}
                    onClick={handleSendOutreach}
                  >
                    <IconSend size={13} /> Dispatch Email via AgentMail
                  </button>

                  <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
                    {draft.approvalStatus === "approved"
                      ? `Approved by ${draft.approvedBy} at ${when(draft.approvedAt ?? Date.now())}`
                      : "Operator approval required before dispatch."}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AgentMail Conversation */}
          {activeTab === "thread" && selectedProspect && (
            <div>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", color: "var(--ink-primary)" }}>AgentMail Thread: {selectedProspect.name}</h3>
                    <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
                      Recipient: <strong style={{ color: "var(--ink-primary)" }}>{selectedProspect.targetEmail}</strong> • Status: <strong>{selectedProspect.outreachStatus}</strong>
                    </span>
                  </div>
                  <button className="btn btn-primary" onClick={handleSimulateReply}>
                    <IconMessageSquare size={13} /> Simulate Inbound Reply
                  </button>
                </div>

                <div className="thread-container">
                  {thread?.messages?.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--ink-muted)" }}>
                      No messages sent yet. Approve and dispatch the initial outreach pitch!
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
                        <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "6px", color: "var(--ink-primary)" }}>
                          Subject: {m.subject}
                        </div>
                        <div className="message-body">{m.text}</div>

                        {m.classification && (
                          <div style={{ marginTop: "10px" }}>
                            <span className="badge badge-amber">
                              AI Classification: {m.classification}
                            </span>
                            {m.proposedChanges && (
                              <div
                                style={{
                                  marginTop: "6px",
                                  fontSize: "12px",
                                  background: "rgba(245, 158, 11, 0.08)",
                                  padding: "10px 14px",
                                  borderRadius: "6px",
                                  border: "1px solid rgba(245, 158, 11, 0.25)",
                                  color: "#fcd34d",
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

          {/* TAB 4: Commercial Terms & Revisions */}
          {activeTab === "proposals" && selectedProspect && (
            <div>
              <div className="card">
                <h3 className="card-title">
                  <span>Commercial Terms &amp; Scope Versions</span>
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink-primary)" }}>
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
                            <span className="badge badge-green">
                              <IconLock size={11} /> Binding Agreement
                            </span>
                          )}
                        </div>
                      </div>

                      {p.changeReason && (
                        <div style={{ fontSize: "13px", fontStyle: "italic", marginBottom: "12px", color: "#fcd34d" }}>
                          Reason: {p.changeReason}
                        </div>
                      )}

                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>Scope of Work:</strong>
                        <ul style={{ margin: "4px 0 0", paddingLeft: "20px", fontSize: "13px", color: "var(--ink-secondary)" }}>
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
                            background: "rgba(245, 158, 11, 0.08)",
                            border: "1px solid rgba(245, 158, 11, 0.35)",
                            padding: "14px 18px",
                            borderRadius: "10px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#fcd34d" }}>
                            <IconAlertTriangle size={15} color="#fbbf24" />
                            Client Counteroffer Awaiting Action: ${(p.priceCents / 100).toFixed(2)} CAD (10-day turnaround)
                          </span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={async () => {
                                await acceptProposalMutation({ proposalId: p._id });
                                notify(`Proposal v${p.version} accepted! Binding terms established.`);
                              }}
                            >
                              <IconCheck size={13} /> Accept Counteroffer
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ color: "#f87171", borderColor: "rgba(239, 68, 68, 0.4)" }}
                              onClick={async () => {
                                await declineProposalMutation({ proposalId: p._id });
                                notify(`Proposal v${p.version} declined.`);
                              }}
                            >
                              <IconX size={13} /> Decline
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

          {/* TAB 5: Live Storefront Studio */}
          {activeTab === "preview" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", color: "var(--ink-primary)" }}>Live Storefront Studio</h3>
                  <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
                    Preview Slug: <code>/preview/{activePreviewSlug}</code> • Live Reactive Sync
                  </span>
                </div>
                <Link
                  to={`/preview/${activePreviewSlug}?variant=${previewThemeVariant}`}
                  target="_blank"
                  className="btn btn-sm btn-primary"
                >
                  Open in Dedicated Window ↗
                </Link>
              </div>

              {/* Theme Variant Switcher */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 500 }}>Storefront Design Variant:</span>
                <button
                  className={`btn btn-sm ${previewThemeVariant === "warm-artisan" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setPreviewThemeVariant("warm-artisan")}
                >
                  ☕ Warm Artisan (Light)
                </button>
                <button
                  className={`btn btn-sm ${previewThemeVariant === "nordic-light" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setPreviewThemeVariant("nordic-light")}
                >
                  🥛 Nordic Alabaster (Light)
                </button>
                <button
                  className={`btn btn-sm ${previewThemeVariant === "sage-botanical" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setPreviewThemeVariant("sage-botanical")}
                >
                  🌿 Sage Botanical (Light)
                </button>
                <button
                  className={`btn btn-sm ${previewThemeVariant === "obsidian-dark" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setPreviewThemeVariant("obsidian-dark")}
                >
                  🌑 Obsidian Roastery (Dark)
                </button>
              </div>

              <div style={{ height: "720px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--line-default)" }}>
                <iframe
                  src={`/preview/${activePreviewSlug}?variant=${previewThemeVariant}`}
                  title="Live Storefront Preview"
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              </div>
            </div>
          )}

          {/* TAB 6: Activity Ledger & Schedule */}
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
                          background: "var(--bg-surface-elevated)",
                          border: "1px solid var(--line-subtle)",
                          padding: "14px 18px",
                          borderRadius: "10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <strong style={{ color: "var(--ink-primary)" }}>Follow-up Attempt #{s.attemptNumber} of 2</strong>
                          <div style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "2px" }}>
                            Scheduled: {new Date(s.scheduledTime).toISOString().slice(0, 10)} • Created: {when(s.createdAt)}
                          </div>
                          {s.cancellationReason && (
                            <div style={{ fontSize: "12px", color: "#f87171", marginTop: "4px" }}>
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
                        <span style={{ color: "var(--ink-secondary)" }}>{entry.summary}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
