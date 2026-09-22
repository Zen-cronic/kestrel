import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useApp } from "../context/AppContext";
import { cents, when } from "../lib/format";
import { IconMessageSquare, IconMail } from "../components/Icons";

export default function InboxPage() {
  const { selectedProspectId, selectedProspect, showToast } = useApp();

  const thread = useQuery(
    api.threads.getThread,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );

  const simulateInbound = useMutation(api.threads.simulateInboundReply);
  const syncAgentMail = useAction((api as any).threads.syncAgentMailInbox);
  const sendReplyAction = useAction((api as any).threads.sendLiveReply);

  const [isSimulating, setIsSimulating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const handleSyncAgentMail = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAgentMail({
        inboxId: "break-solutions@agentmail.to",
      });
      showToast(`AgentMail synced: ${res.messagesFetched} messages checked on break-solutions@agentmail.to`);
    } catch (err: any) {
      console.error(err);
      showToast("Sync failed: " + (err.message || "Unknown error"));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendLiveReply = async () => {
    if (!selectedProspectId || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      await sendReplyAction({
        prospectId: selectedProspectId,
        text: replyText.trim(),
      });
      setReplyText("");
      showToast("Reply dispatched via AgentMail to prospect!");
    } catch (err: any) {
      console.error(err);
      showToast("Reply send failed: " + (err.message || "Unknown error"));
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSimulateReply = async (type: "interest" | "counter" | "decline") => {
    if (!selectedProspectId) return;
    setIsSimulating(true);
    try {
      if (type === "counter") {
        await simulateInbound({
          prospectId: selectedProspectId,
          text: "Love the preview site! Could we include our weekly coffee cupping schedule and adjust the price to $1,100 CAD with delivery in 10 days? Let us know if that works.",
        });
      } else if (type === "interest") {
        await simulateInbound({
          prospectId: selectedProspectId,
          text: "This looks fantastic. What are the next steps to get this live on our domain?",
        });
      } else {
        await simulateInbound({
          prospectId: selectedProspectId,
          text: "Please unsubscribe us from future communications. Thank you.",
        });
      }
      showToast("Simulated inbound reply delivered to AgentMail thread.");
    } catch (err) {
      console.error(err);
      showToast("Failed to simulate inbound message.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="spa-page-container">
      {/* Header */}
      <div className="spa-page-header">
        <div>
          <h1 className="spa-page-title">
            AgentMail Inbound Desk & Live Threads
            <span className="spa-badge-live">break-solutions@agentmail.to</span>
          </h1>
          <p className="spa-page-sub">
            Real-time two-way email stream powered by AgentMail. Inbound prospect replies are
            automatically parsed for sentiment, scope modifications, price counters, and commercial terms.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleSyncAgentMail}
            disabled={isSyncing}
            className="spa-btn-topbar-outline"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <IconMail size={13} />
            <span>{isSyncing ? "Syncing..." : "Sync AgentMail Live"}</span>
          </button>
          <button
            onClick={() => handleSimulateReply("counter")}
            disabled={isSimulating || !selectedProspectId}
            className="spa-btn-topbar-outline"
          >
            Simulate Counter
          </button>
          <button
            onClick={() => handleSimulateReply("interest")}
            disabled={isSimulating || !selectedProspectId}
            className="spa-btn-submit"
          >
            Simulate "Interested"
          </button>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="spa-card">
        <div className="spa-card-header">
          <h2 className="spa-card-title">
            <IconMessageSquare size={15} color="var(--accent)" />
            Thread: {thread?.thread?.subject || "Initial Outreach & Storefront Preview"}
          </h2>
          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {thread?.messages?.length ?? 0} messages
          </span>
        </div>

        {thread?.messages && thread.messages.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {thread.messages.map((m) => {
              const isOutbound = m.direction === "outbound";
              return (
                <div
                  key={m._id}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: isOutbound ? "var(--bg-primary)" : "var(--bg-card)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    maxWidth: "85%",
                    alignSelf: isOutbound ? "flex-start" : "flex-end",
                    width: "100%",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="spa-badge-live" style={{ fontSize: "9px" }}>
                        {m.direction}
                      </span>
                      <strong style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)" }}>
                        {m.from}
                      </strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {m.classification && (
                        <span className="spa-nav-badge" style={{ fontSize: "9px", color: "var(--accent)" }}>
                          {m.classification.replace("_", " ")}
                        </span>
                      )}
                      <span>{when(m.receivedOrSentAt)}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: "12.5px", color: "var(--text-primary)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                    {m.text}
                  </p>

                  {m.proposedChanges && (
                    <div style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border-strong)", background: "var(--bg-primary)", display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontFamily: "var(--font-mono)" }}>
                      <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", fontWeight: 700 }}>
                        Parsed Counter-Proposal
                      </div>
                      {m.proposedChanges.requestedPriceCents && (
                        <div>
                          Requested Price: <strong style={{ color: "var(--text-primary)" }}>{cents(m.proposedChanges.requestedPriceCents)}</strong>
                        </div>
                      )}
                      {m.proposedChanges.requestedScope && (
                        <div>
                          Requested Scope Additions: <strong style={{ color: "var(--text-primary)" }}>{m.proposedChanges.requestedScope.join(", ")}</strong>
                        </div>
                      )}
                      <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                        Notes: {m.proposedChanges.notes}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "36px 0", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            No messages recorded for this prospect yet.
          </div>
        )}

        {/* Live AgentMail Reply Composer */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
              Dispatch Reply via AgentMail (from: break-solutions@agentmail.to)
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() =>
                  setReplyText(
                    "Hi Marcus & team,\n\nWe would love to move forward with the $1,000 CAD price point and 10-day timeline. We will include the wholesale coffee bean subscription portal in scope as requested.\n\nHere is your verified agreement preview: https://storefrontdesk.app/proposals"
                  )
                }
                style={{
                  fontSize: "10.5px",
                  fontFamily: "var(--font-mono)",
                  padding: "3px 8px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                Insert Counter Acceptance
              </button>
              <button
                type="button"
                onClick={() =>
                  setReplyText(
                    "Hi team,\n\nA new commit was just deployed with the requested menu changes. Please inspect the updated live preview on your mobile device: https://storefrontdesk.app/studio"
                  )
                }
                style={{
                  fontSize: "10.5px",
                  fontFamily: "var(--font-mono)",
                  padding: "3px 8px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                Insert Deploy Update
              </button>
            </div>
          </div>

          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Draft your message to ${selectedProspect?.targetEmail || "client"}...`}
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              fontSize: "12.5px",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSendLiveReply}
              disabled={isSendingReply || !replyText.trim() || !selectedProspectId}
              className="spa-btn-submit"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
            >
              <IconMail size={13} />
              <span>{isSendingReply ? "Sending..." : "Send via AgentMail"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
