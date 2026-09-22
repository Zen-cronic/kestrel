import { useState, useEffect, type FormEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useApp } from "../context/AppContext";
import {
  IconGitHub,
  IconGitCommit,
  IconZap,
  IconCheck,
  IconExternalLink,
  IconMail,
  IconMonitor,
} from "../components/Icons";

export default function DeploymentsPage() {
  const { workspaceId, showToast } = useApp();

  const integration = useQuery(
    api.github.getIntegration,
    workspaceId ? { workspaceId } : "skip"
  );

  const deployments = useQuery(
    api.github.listDeployments,
    workspaceId ? { workspaceId } : "skip"
  );

  const ensureIntegration = useMutation(api.github.ensureIntegration);
  const updateIntegration = useMutation(api.github.updateIntegration);
  const recordPushEvent = useMutation(api.github.recordPushEvent);

  const [repoName, setRepoName] = useState("Zen-cronic/kestrel");
  const [branch, setBranch] = useState("main");
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [notifyAgentMail, setNotifyAgentMail] = useState(true);
  const [recipient, setRecipient] = useState("break-solutions@agentmail.to");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simCommitMessage, setSimCommitMessage] = useState(
    "feat(storefront): enhance kinetic motion & light-mode typography"
  );
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Sync state once integration is loaded
  useEffect(() => {
    if (integration) {
      setRepoName(integration.repoFullName);
      setBranch(integration.branch);
      setAutoDeploy(integration.autoDeployEnabled);
      setNotifyAgentMail(integration.notifyAgentMailOnDeploy);
      if (integration.notificationRecipient) {
        setRecipient(integration.notificationRecipient);
      }
    } else if (workspaceId) {
      ensureIntegration({
        workspaceId,
        repoFullName: "Zen-cronic/kestrel",
        branch: "main",
        notificationRecipient: "break-solutions@agentmail.to",
      }).catch(console.error);
    }
  }, [integration, workspaceId]);

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    try {
      await updateIntegration({
        workspaceId,
        repoFullName: repoName,
        branch,
        autoDeployEnabled: autoDeploy,
        notifyAgentMailOnDeploy: notifyAgentMail,
        notificationRecipient: recipient,
      });
      showToast("GitHub CI/CD developer settings updated.");
    } catch (err) {
      console.error(err);
      showToast("Failed to save settings.");
    }
  };

  const handleSimulatePush = async () => {
    if (!workspaceId) return;
    setIsSimulating(true);
    try {
      const randomSha = Math.random().toString(16).substring(2, 9);
      await recordPushEvent({
        workspaceId,
        repoFullName: repoName,
        branch,
        commitSha: randomSha,
        commitMessage: simCommitMessage,
        authorName: "Zen-cronic",
        authorEmail: "kaung@changeorderdesk.dev",
      });
      showToast(`Push event received for commit ${randomSha}. Re-deployed storefronts!`);
    } catch (err) {
      console.error(err);
      showToast("Failed to trigger push deployment.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="spa-page-container">
      {/* Page Header */}
      <div className="spa-page-header">
        <div>
          <h1 className="spa-page-title">
            GitHub Developer CI/CD & Auto-Deploy
            <span className="spa-badge-live">Live Webhook Active</span>
          </h1>
          <p className="spa-page-sub">
            Every commit pushed to the production branch of your GitHub repository triggers an
            instant rebuild of all prospect storefronts and dispatches automated deployment reports
            via AgentMail.
          </p>
        </div>

        <button
          onClick={handleSimulatePush}
          disabled={isSimulating}
          className="spa-btn-action-accent"
        >
          <IconZap size={14} />
          <span>{isSimulating ? "Building & Syncing..." : "Simulate Git Push (Main)"}</span>
        </button>
      </div>

      {/* Grid: Developer Settings & Push Simulator */}
      <div className="spa-grid-12">
        {/* Left Column: Repository Binding & Settings */}
        <div className="spa-col-6 spa-card">
          <div className="spa-card-header">
            <h2 className="spa-card-title">
              <IconGitHub size={16} color="var(--text-primary)" />
              Repository Binding
            </h2>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              Webhook: Active (200 OK)
            </span>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                GitHub Repository (Owner / Repo)
              </label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="spa-input"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                  Production Branch
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="spa-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                  Webhook Secret
                </label>
                <input
                  type="text"
                  readOnly
                  value={integration?.webhookSecret || "whsec_gh_configured"}
                  className="spa-input"
                  style={{ color: "var(--text-muted)", userSelect: "all" }}
                />
              </div>
            </div>

            {/* Notification & Trigger Toggles */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={autoDeploy}
                  onChange={(e) => setAutoDeploy(e.target.checked)}
                  style={{ marginTop: "3px" }}
                />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Automatic Storefront Redeploy
                  </div>
                  <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                    Immediately compile and publish fresh responsive site versions upon commit push.
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={notifyAgentMail}
                  onChange={(e) => setNotifyAgentMail(e.target.checked)}
                  style={{ marginTop: "3px" }}
                />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    AgentMail Deployment Notifications
                  </div>
                  <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                    Send verified release email with commit summary and preview link.
                  </div>
                </div>
              </label>
            </div>

            {notifyAgentMail && (
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                  Notification Recipient Inbox
                </label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="spa-input"
                />
              </div>
            )}

            <button type="submit" className="spa-btn-submit" style={{ width: "100%", marginTop: "4px" }}>
              Save Repository Configuration
            </button>
          </form>
        </div>

        {/* Right Column: Webhook Simulator */}
        <div className="spa-col-6 spa-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="spa-card-header">
              <h2 className="spa-card-title">
                <IconGitCommit size={16} color="var(--accent)" />
                Push Webhook Simulator
              </h2>
              <span className="spa-nav-badge">Developer Tool</span>
            </div>

            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 16px" }}>
              Test the entire automated workflow without waiting for a remote git push. This fires a
              simulated push payload, invokes Convex edge deployment, updates the activity ledger, and
              dispatches the AgentMail notification.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                  Simulated Commit Message
                </label>
                <input
                  type="text"
                  value={simCommitMessage}
                  onChange={(e) => setSimCommitMessage(e.target.value)}
                  className="spa-input"
                />
              </div>

              <div className="spa-terminal-box">
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "6px" }}>
                  Automated Pipeline Steps
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <IconCheck size={12} color="var(--status-active)" />
                  <span>1. GitHub Webhook verified (HMAC SHA-256)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <IconCheck size={12} color="var(--status-active)" />
                  <span>2. Storefront variants AST compiled with latest specs</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <IconCheck size={12} color="var(--status-active)" />
                  <span>3. Live preview URL generated with immutable commit ref</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <IconCheck size={12} color="var(--status-active)" />
                  <span>4. AgentMail dispatches release digest to operator</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button
              onClick={handleSimulatePush}
              disabled={isSimulating}
              className="spa-btn-action-accent"
              style={{ width: "100%" }}
            >
              <IconZap size={14} />
              <span>{isSimulating ? "Deploying & Emailing..." : "Simulate Git Push Event"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Deployment History Table */}
      <div className="spa-card">
        <div className="spa-card-header">
          <h2 className="spa-card-title">
            <IconMonitor size={16} color="var(--text-primary)" />
            Recent Deployments & AgentMail Logs
          </h2>
          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {deployments?.length ?? 0} deployments recorded
          </span>
        </div>

        {deployments && deployments.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {deployments.map((d) => (
              <div
                key={d._id}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="spa-badge-live" style={{ fontSize: "9px" }}>
                      {d.status.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {d.commitSha}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500 }}>
                      {d.commitMessage}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    <span>by @{d.authorName} on {d.branch}</span>
                    <span>{new Date(d.triggeredAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", paddingTop: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
                      <IconMail size={12} color="var(--accent)" />
                      AgentMail: <strong style={{ color: "var(--text-primary)" }}>{d.agentMailStatus}</strong>
                    </span>

                    <a
                      href={d.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent)", textDecoration: "none" }}
                    >
                      <IconExternalLink size={12} />
                      <span>Open Live Storefront Preview</span>
                    </a>
                  </div>

                  <button
                    onClick={() => setExpandedLogId(expandedLogId === d._id ? null : d._id)}
                    style={{ background: "none", border: "none", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", cursor: "pointer", textDecoration: "underline" }}
                  >
                    {expandedLogId === d._id ? "Hide Build Logs" : "View Build Logs"}
                  </button>
                </div>

                {expandedLogId === d._id && (
                  <div className="spa-terminal-box" style={{ marginTop: "6px" }}>
                    {d.buildLogs.map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "36px 0", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            No deployments recorded yet. Click "Simulate Git Push (Main)" above to trigger the first
            automated deployment!
          </div>
        )}
      </div>
    </div>
  );
}
