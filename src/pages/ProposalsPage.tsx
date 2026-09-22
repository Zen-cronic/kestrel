import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useApp } from "../context/AppContext";
import { cents, when } from "../lib/format";
import {
  IconFileText,
  IconCheck,
  IconShieldCheck,
} from "../components/Icons";

export default function ProposalsPage() {
  const { selectedProspectId, showToast } = useApp();

  const proposals = useQuery(
    api.proposals.getProposalHistory,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );

  const acceptProposal = useMutation(api.proposals.acceptProposal);

  const activeProposal = proposals && proposals.length > 0 ? proposals[0] : null;

  const handleAccept = async (proposalId: any) => {
    try {
      await acceptProposal({ proposalId });
      showToast("Proposal terms accepted! Deal marked agreed.");
    } catch (err) {
      console.error(err);
      showToast("Failed to accept proposal.");
    }
  };

  return (
    <div className="spa-page-container">
      {/* Header */}
      <div className="spa-page-header">
        <div>
          <h1 className="spa-page-title">
            Commercial Agreement & Contract Desk
            <span className="spa-badge-live">Binding Version Control</span>
          </h1>
          <p className="spa-page-sub">
            Immutable version-tracked commercial agreements. Every counter-proposal generates an
            RFC-compliant addendum preserving full auditability of price, scope, and SLA guarantees.
          </p>
        </div>

        {activeProposal && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>Active Agreement:</span>
            <span className="spa-nav-badge" style={{ fontSize: "11px", fontWeight: 700 }}>
              v{activeProposal.version} ({activeProposal.status.toUpperCase()})
            </span>
          </div>
        )}
      </div>

      {/* Grid: Active Agreement Sheet & Version Timeline */}
      <div className="spa-grid-12">
        {/* Left: Active Contract Sheet */}
        <div className="spa-col-8 spa-card">
          <div className="spa-card-header">
            <h2 className="spa-card-title">
              <IconFileText size={15} color="var(--accent)" />
              Statement of Work & Commercial Terms
            </h2>
            {activeProposal?.status === "accepted" ? (
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--status-active)", fontWeight: 700 }}>
                <IconCheck size={14} />
                <span>SIGNED & EXECUTED</span>
              </span>
            ) : (
              <span className="spa-badge-live">
                PENDING EXECUTION
              </span>
            )}
          </div>

          {activeProposal ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Financial Highlights */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", padding: "16px", borderRadius: "6px", background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>
                    Setup & Delivery Fee
                  </div>
                  <div style={{ fontSize: "20px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                    {cents(activeProposal.priceCents)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>
                    Turnaround SLA
                  </div>
                  <div style={{ fontSize: "20px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                    {activeProposal.timelineDays} Business Days
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>
                    Satisfaction Guarantee
                  </div>
                  <div style={{ fontSize: "20px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--status-active)", marginTop: "2px" }}>
                    30-Day Money Back
                  </div>
                </div>
              </div>

              {/* Scope Deliverables */}
              <div>
                <h3 style={{ fontSize: "11px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "10px" }}>
                  Included Scope Deliverables
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {activeProposal.scopeItems?.map((item: string, idx: number) => (
                    <div
                      key={idx}
                      style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-primary)", fontSize: "12px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <IconCheck size={13} color="var(--status-active)" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              {activeProposal.status !== "accepted" && (
                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                  <button
                    onClick={() => handleAccept(activeProposal._id)}
                    className="spa-btn-action-accent"
                    style={{ background: "var(--status-active)" }}
                  >
                    <IconCheck size={14} />
                    <span>Execute Agreement & Mark Won</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "36px 0", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              No proposal generated for this prospect yet.
            </div>
          )}
        </div>

        {/* Right: Version Timeline */}
        <div className="spa-col-4 spa-card">
          <div className="spa-card-header">
            <h2 className="spa-card-title">Contract Version Ledger</h2>
            <IconShieldCheck size={16} color="var(--accent)" />
          </div>

          {proposals && proposals.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {proposals.map((p) => (
                <div
                  key={p._id}
                  style={{ padding: "12px 14px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-primary)", display: "flex", flexDirection: "column", gap: "4px", fontFamily: "var(--font-mono)", fontSize: "11px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>v{p.version}</span>
                    <span className="spa-badge-live" style={{ fontSize: "8.5px" }}>
                      {p.status}
                    </span>
                  </div>

                  <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                    {cents(p.priceCents)} · {p.timelineDays} days
                  </div>

                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    Recorded: {when(p.createdAt)} {p.decidedBy ? `by ${p.decidedBy}` : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "36px 0", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              No previous revisions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
