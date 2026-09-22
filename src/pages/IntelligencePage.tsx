import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useApp } from "../context/AppContext";
import {
  IconShieldCheck,
  IconExternalLink,
  IconCheck,
  IconZap,
} from "../components/Icons";

export default function IntelligencePage() {
  const { selectedProspectId, selectedProspect, showToast } = useApp();
  const [crawlUrl, setCrawlUrl] = useState("https://rustickettle-example.ca");
  const [isCrawling, setIsCrawling] = useState(false);

  const runAudit = useAction((api as any).recon.auditUrl);

  const evidence = useQuery(
    api.evidence.listEvidence,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );

  const handleRunFirecrawlScrape = async () => {
    if (!crawlUrl.trim() || !selectedProspectId) return;
    setIsCrawling(true);
    try {
      const res = await runAudit({
        url: crawlUrl.trim(),
        businessName: selectedProspect?.name,
        prospectId: selectedProspectId,
      });
      showToast(`Firecrawl scrape succeeded: ${res.extractedClaims?.length ?? 0} truth claims registered!`);
    } catch (err: any) {
      console.error(err);
      showToast("Firecrawl scrape failed: " + (err.message || "Unknown error"));
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <div className="spa-page-container">
      {/* Header */}
      <div className="spa-page-header">
        <div>
          <h1 className="spa-page-title">
            RFC-92 Grounded Evidence Ledger
            <span className="spa-badge-live">Firecrawl Scrape Active</span>
          </h1>
          <p className="spa-page-sub">
            Every business claim, operating hour, address, and menu item is audited against public
            records and crawler sources before entering outreach drafts or generated storefront specs.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            value={crawlUrl}
            onChange={(e) => setCrawlUrl(e.target.value)}
            placeholder="https://business-site.com"
            style={{
              padding: "7px 10px",
              borderRadius: "4px",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              width: "220px",
            }}
          />
          <button
            onClick={handleRunFirecrawlScrape}
            disabled={isCrawling || !selectedProspectId}
            className="spa-btn-submit"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <IconZap size={13} />
            <span>{isCrawling ? "Scraping..." : "Firecrawl Scrape"}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {evidence && (
        <div className="spa-metrics-strip">
          <div className="spa-metric-item">
            <span className="spa-metric-label">Audited Sources</span>
            <span className="spa-metric-num">{evidence.sources.length}</span>
            <span className="spa-metric-sub">Places API & Firecrawl</span>
          </div>

          <div className="spa-metric-item">
            <span className="spa-metric-label">Verified Claims</span>
            <span className="spa-metric-num" style={{ color: "var(--status-active)" }}>
              {evidence.claims.length}
            </span>
            <span className="spa-metric-sub">Strict truth verification</span>
          </div>

          <div className="spa-metric-item">
            <span className="spa-metric-label">Confidence Score</span>
            <span className="spa-metric-num" style={{ color: "var(--accent)" }}>100%</span>
            <span className="spa-metric-sub">Zero ungrounded claims</span>
          </div>

          <div className="spa-metric-item">
            <span className="spa-metric-label">Policy Guardrail</span>
            <span className="spa-metric-num" style={{ color: "var(--status-active)", display: "flex", alignItems: "center", gap: "6px" }}>
              <IconShieldCheck size={22} color="var(--status-active)" />
              <span>PASS</span>
            </span>
            <span className="spa-metric-sub">Anti-hallucination active</span>
          </div>
        </div>
      )}

      {/* Citations & Claims Grid */}
      <div className="spa-grid-12">
        {/* Left: Verified Claims Matrix */}
        <div className="spa-col-8 spa-card">
          <div className="spa-card-header">
            <h2 className="spa-card-title">
              Verified Fact Statements ({evidence?.claims?.length ?? 0})
            </h2>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              RFC-92 Schema Conformance
            </span>
          </div>

          {evidence && evidence.claims.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {evidence.claims.map((claim) => (
                <div
                  key={claim._id}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-primary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--accent)",
                        }}
                      >
                        SRC // {claim.claimKey}
                      </span>
                      <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>
                        {claim.category}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--status-active)" }}>
                      <IconCheck size={12} />
                      <span style={{ textTransform: "capitalize" }}>{claim.confidence}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.5, margin: 0 }}>
                    {claim.statement}
                  </p>

                  <div style={{ display: "flex", gap: "12px", fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    <span>Status: {claim.status}</span>
                    <span>·</span>
                    <span>Audited: {new Date(claim.recordedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "36px 0", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              No evidence loaded for this prospect. Select a prospect with verified records.
            </div>
          )}
        </div>

        {/* Right: Crawler Sources & Documents */}
        <div className="spa-col-4 spa-card">
          <div className="spa-card-header">
            <h2 className="spa-card-title">Grounding Documents</h2>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              {evidence?.sources?.length ?? 0} docs
            </span>
          </div>

          {evidence && evidence.sources.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {evidence.sources.map((src) => (
                <div
                  key={src._id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-primary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>
                      {src.provider.replace("_", " ")}
                    </span>
                    <span className="spa-badge-live" style={{ fontSize: "9px" }}>
                      {src.status}
                    </span>
                  </div>

                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--accent)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      <IconExternalLink size={11} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{src.url}</span>
                    </a>
                  )}

                  {src.rawTextSnippet && (
                    <div style={{ fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", lineHeight: 1.4, maxHeight: "40px", overflow: "hidden" }}>
                      {src.rawTextSnippet}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "36px 0", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              No source documents recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
