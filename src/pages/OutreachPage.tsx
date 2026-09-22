import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useApp } from "../context/AppContext";
import { cents } from "../lib/format";
import {
  IconMail,
  IconSend,
  IconCheck,
  IconShieldCheck,
} from "../components/Icons";

export default function OutreachPage() {
  const { selectedProspectId, selectedProspect, showToast } = useApp();

  const draft = useQuery(
    api.outreach.getDraft,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );

  const approveDraft = useMutation(api.outreach.approveDraft);
  const sendOutreachAction = useAction(api.outreach.sendOutreach);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priceCents, setPriceCents] = useState(125000);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (draft) {
      setSubject(draft.subject);
      setBody(draft.bodyText);
      setPriceCents(draft.proposedPriceCents);
    }
  }, [draft?._id, draft?.subject, draft?.bodyText, draft?.proposedPriceCents]);

  const handleApprove = async () => {
    if (!draft) return;
    try {
      await approveDraft({ draftId: draft._id });
      showToast("Draft approved for transmission.");
    } catch (err) {
      console.error(err);
      showToast("Failed to approve draft.");
    }
  };

  const handleSend = async () => {
    if (!draft || !selectedProspectId) return;
    setIsSending(true);
    try {
      await sendOutreachAction({ prospectId: selectedProspectId });
      showToast("Pitch email dispatched via AgentMail with live storefront link!");
    } catch (err) {
      console.error(err);
      showToast("Transmission failed: ensure draft is approved and recipient is valid.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="spa-page-container">
      {/* Header */}
      <div className="spa-page-header">
        <div>
          <h1 className="spa-page-title">
            Two-Strike Outreach Sequence Desk
            <span className="spa-badge-live">Strict Guardrails</span>
          </h1>
          <p className="spa-page-sub">
            Complies with cold-outreach policy: maximum 2 contact attempts per prospect, operator
            approval gating, clear unsubscribe headers, and no unsolicited blasts.
          </p>
        </div>

        {selectedProspect && (
          <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
            Target: <strong style={{ color: "var(--text-primary)" }}>{selectedProspect.targetEmail}</strong>
          </div>
        )}
      </div>

      {/* Grid: Pitch Editor & Compliance Specs */}
      <div className="spa-grid-12">
        {/* Left: Live Pitch Preview */}
        <div className="spa-col-8 spa-card">
          <div className="spa-card-header">
            <h2 className="spa-card-title">
              <IconMail size={15} color="var(--accent)" />
              Email Message Payload
            </h2>

            {draft && (
              <span className="spa-badge-live" style={{ fontSize: "9.5px" }}>
                Status: {draft.approvalStatus.replace("_", " ")}
              </span>
            )}
          </div>

          {draft ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                  Subject Line
                </label>
                <div style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-primary)", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)" }}>
                  {subject}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                  Body (Markdown & Plaintext)
                </label>
                <div style={{ padding: "14px 16px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-primary)", fontSize: "12.5px", color: "var(--text-primary)", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap", lineHeight: 1.6, minHeight: "220px" }}>
                  {body}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                  Proposed Retainer: <strong style={{ color: "var(--text-primary)" }}>{cents(priceCents)}</strong>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {draft.approvalStatus !== "approved" && (
                    <button onClick={handleApprove} className="spa-btn-submit">
                      <IconCheck size={13} />
                      <span>Approve Pitch</span>
                    </button>
                  )}

                  <button
                    onClick={handleSend}
                    disabled={isSending || draft.approvalStatus !== "approved"}
                    className="spa-btn-action-accent"
                  >
                    <IconSend size={13} />
                    <span>{isSending ? "Sending via AgentMail..." : "Dispatch Email (AgentMail)"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "36px 0", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              No draft generated yet for this prospect. Complete evidence grounding to generate pitch.
            </div>
          )}
        </div>

        {/* Right: Policy & Followup Schedule */}
        <div className="spa-col-4 spa-card">
          <div className="spa-card-header">
            <h2 className="spa-card-title">Policy Guardrails</h2>
            <IconShieldCheck size={16} color="var(--status-active)" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
            <div style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-primary)" }}>
              <div style={{ fontSize: "9.5px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginBottom: "3px" }}>
                Attempt Limit
              </div>
              <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>Max 2 Attempts</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", lineHeight: 1.4 }}>
                Initial Pitch + 1 Assisted Follow-up after 3 business days. Hard stop after attempt 2.
              </div>
            </div>

            <div style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-primary)" }}>
              <div style={{ fontSize: "9.5px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginBottom: "3px" }}>
                Unsubscribe & Suppression
              </div>
              <div style={{ color: "var(--status-active)", fontWeight: 600 }}>One-Click Opt Out</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", lineHeight: 1.4 }}>
                Replies with "unsubscribe", "stop", or "not interested" instantly add email to global suppression list.
              </div>
            </div>

            <div style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-primary)" }}>
              <div style={{ fontSize: "9.5px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginBottom: "3px" }}>
                AgentMail Inbox Binding
              </div>
              <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>break-solutions@agentmail.to</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", lineHeight: 1.4 }}>
                RFC-92 verified transmission with DKIM and SPF compliance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
