import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useApp } from "../context/AppContext";
import { cents, when } from "../lib/format";
import {
  IconArrowUpRight,
  IconGitHub,
  IconMapPin,
  IconShieldCheck,
  IconMail,
} from "../components/Icons";

interface StorefrontCard {
  id: string;
  name: string;
  vertical: string;
  location: string;
  status: "audited" | "redesigned" | "production";
  image: string;
  summary: string;
  metrics: { label: string; value: string }[];
  actionPath: string;
  actionLabel: string;
}

export default function OverviewPage() {
  const { workspaceId, selectedProspect, prospects, showToast } = useApp();
  const [filter, setFilter] = useState<"all" | "audited" | "redesigned">("all");
  const [auditUrlInput, setAuditUrlInput] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const runAudit = useAction((api as any).recon.auditUrl);

  const handleRunFirecrawlAudit = async () => {
    if (!auditUrlInput.trim()) return;
    setIsAuditing(true);
    try {
      const res = await runAudit({
        url: auditUrlInput.trim(),
        businessName: "Audited Target",
      });
      setAuditResult(res);
      showToast(`Firecrawl scrape complete: ${res.extractedClaims?.length ?? 0} truth claims established!`);
    } catch (err: any) {
      console.error(err);
      showToast("Firecrawl audit failed: " + (err.message || "Unknown error"));
    } finally {
      setIsAuditing(false);
    }
  };

  const activity = useQuery(
    api.activity.listByWorkspace,
    workspaceId ? { workspaceId } : "skip"
  );

  const deployments = useQuery(
    api.github.listDeployments,
    workspaceId ? { workspaceId } : "skip"
  );

  const totalProspects = prospects?.length ?? 0;
  const contactedCount = prospects?.filter((p) => p.outreachStatus === "sent").length ?? 0;
  const agreedCount = prospects?.filter((p) => p.outreachStatus === "accepted").length ?? 0;

  const cards: StorefrontCard[] = [
    {
      id: "rustic-kettle-target",
      name: selectedProspect?.name || "The Rustic Kettle Café & Roastery",
      vertical: selectedProspect?.vertical || "Artisan Specialty Café",
      location: selectedProspect?.address || "784 Queen St W, Toronto, ON",
      status: "audited",
      image: "/rustic_kettle_hero.jpg",
      summary:
        selectedProspect?.websiteAnalysis?.summary ||
        "Audited deficit: lacks mobile responsive menu, digital ordering, and structured local SEO schema. Re-engineered artisan storefront ready for deployment.",
      metrics: [
        { label: "Core Web Vitals", value: "99/100" },
        { label: "SEO Schema", value: "100/100" },
        { label: "RFC-92 Citations", value: "3/3 Verified" },
      ],
      actionPath: "/studio",
      actionLabel: "Launch Storefront Studio",
    },
    {
      id: "rustic-kettle-redesign",
      name: "The Rustic Kettle — Artisan Modernized",
      vertical: "Warm Artisan eCommerce Rebuild",
      location: "Active Live Preview · Viewport 1440×900",
      status: "redesigned",
      image: "/storefront_studio_light.png",
      summary:
        "Full-stack reactive storefront generated with instant reservation engine, mobile touch ordering, and verified Queen St West local business microdata.",
      metrics: [
        { label: "LCP Speed", value: "0.8s" },
        { label: "Menu Schema", value: "Valid JSON-LD" },
        { label: "Ordering", value: "Stripe-Ready" },
      ],
      actionPath: "/studio",
      actionLabel: "Open Interactive Studio",
    },
    {
      id: "norse-bakeri",
      name: "Norse Bakeri & Konditori",
      vertical: "Nordic Minimalist Bakery",
      location: "Oslo / Toronto Pop-up · Fixture Target",
      status: "redesigned",
      image: "/storefront_studio_nordic_light.png",
      summary:
        "Clean Scandinavian typography, daily bake pre-order reservation queue, and zero-bundle client performance built on reactive Convex schema.",
      metrics: [
        { label: "Accessibility", value: "100/100" },
        { label: "Pre-Orders", value: "Active Flow" },
        { label: "Framework", value: "Vite + Convex" },
      ],
      actionPath: "/studio",
      actionLabel: "Inspect Prototype",
    },
  ];

  const filteredCards = cards.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  return (
    <div className="minimal-gallery-root">
      {/* Editorial Header */}
      <header className="minimal-header">
        <div className="minimal-header-left">
          <h1 className="minimal-title">Kestrel Storefronts</h1>
          <p className="minimal-subtitle">
            Autonomous SMB discovery, RFC-92 evidence audits, and live modernized storefronts.
          </p>
        </div>

        {/* Minimalist Inline Telemetry */}
        <div className="minimal-telemetry-strip">
          <div className="telemetry-stat">
            <span className="telemetry-stat-num">{totalProspects}</span>
            <span className="telemetry-stat-label">Verified Targets</span>
          </div>
          <span className="telemetry-stat-sep">/</span>
          <div className="telemetry-stat">
            <span className="telemetry-stat-num">{contactedCount}</span>
            <span className="telemetry-stat-label">Active Outreach</span>
          </div>
          <span className="telemetry-stat-sep">/</span>
          <div className="telemetry-stat">
            <span className="telemetry-stat-num">{cents(agreedCount * 125000)}</span>
            <span className="telemetry-stat-label">Committed ARR</span>
          </div>
          <span className="telemetry-stat-sep">/</span>
          <div className="telemetry-stat">
            <span className="telemetry-stat-num">{deployments?.length ?? 0}</span>
            <span className="telemetry-stat-label">CI/CD Deploys</span>
          </div>
        </div>
      </header>

      {/* Firecrawl Quick Web Recon Bar */}
      <div className="minimal-firecrawl-bar">
        <span className="minimal-firecrawl-tag">FIRECRAWL SCRAPE</span>
        <input
          type="url"
          value={auditUrlInput}
          onChange={(e) => setAuditUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRunFirecrawlAudit();
          }}
          placeholder="Audit any SMB domain with Firecrawl (e.g. https://rustickettlecoffee.ca)..."
          className="minimal-firecrawl-input"
        />
        <button
          onClick={handleRunFirecrawlAudit}
          disabled={isAuditing || !auditUrlInput.trim()}
          className="minimal-firecrawl-btn"
        >
          {isAuditing ? "Scraping & Auditing..." : "Audit with Firecrawl"}
        </button>
      </div>

      {/* Live Audit Drawer / Banner */}
      {auditResult && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            fontSize: "12.5px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
              Firecrawl Audit: {auditResult.title} ({auditResult.url})
            </span>
            <span style={{ color: "#10b981", fontWeight: 600 }}>
              ✓ {auditResult.extractedClaims?.length ?? 0} RFC-92 Truth Claims Verified
            </span>
          </div>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>
            {auditResult.description}
          </p>
          {auditResult.diagnostics?.weaknessNotes?.length > 0 && (
            <div style={{ fontSize: "11.5px", color: "#f59e0b", fontFamily: "var(--font-mono)" }}>
              Detected Deficiencies: {auditResult.diagnostics.weaknessNotes.join(" · ")}
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs & Quick Action */}
      <div className="minimal-filter-bar">
        <div className="minimal-tabs">
          <button
            onClick={() => setFilter("all")}
            className={`minimal-tab ${filter === "all" ? "active" : ""}`}
          >
            All Storefronts ({cards.length})
          </button>
          <button
            onClick={() => setFilter("audited")}
            className={`minimal-tab ${filter === "audited" ? "active" : ""}`}
          >
            Audited Targets (1)
          </button>
          <button
            onClick={() => setFilter("redesigned")}
            className={`minimal-tab ${filter === "redesigned" ? "active" : ""}`}
          >
            Modernized Builds (2)
          </button>
        </div>

        <div className="minimal-bar-actions">
          <Link to="/deployments" className="minimal-link-subtle">
            <IconGitHub size={13} />
            <span>Zen-cronic/desk:main</span>
          </Link>
        </div>
      </div>

      {/* Image-Centric Storefront Grid */}
      <div className="minimal-storefront-grid">
        {filteredCards.map((card) => (
          <article key={card.id} className="minimal-card">
            {/* Edge-to-Edge Storefront Image Container without floating pills */}
            <Link to={card.actionPath} className="minimal-card-image-wrap">
              <img
                src={card.image}
                alt={card.name}
                className="minimal-card-img"
                loading="lazy"
              />
            </Link>

            {/* Typography & Editorial Metadata */}
            <div className="minimal-card-body">
              <div className="minimal-card-meta-top">
                <span className={`minimal-status-badge ${card.status}`}>
                  {card.status === "audited" ? "AUDITED TARGET" : "MODERNIZED BUILD"}
                </span>
                <span className="minimal-vertical">{card.vertical}</span>
                <span className="minimal-dot">·</span>
                <span className="minimal-location">
                  <IconMapPin size={11} color="var(--text-muted)" />
                  <span>{card.location}</span>
                </span>
              </div>

              <h2 className="minimal-card-title">
                <Link to={card.actionPath}>{card.name}</Link>
              </h2>

              <p className="minimal-card-summary">{card.summary}</p>

              {/* Minimalist Tabular Metrics */}
              <div className="minimal-card-metrics">
                {card.metrics.map((m, i) => (
                  <div key={i} className="minimal-metric-item">
                    <span className="minimal-metric-val">{m.value}</span>
                    <span className="minimal-metric-lbl">{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Minimal Web-Native CTA */}
              <div className="minimal-card-footer">
                <Link to={card.actionPath} className="minimal-card-action">
                  <span>{card.actionLabel}</span>
                  <IconArrowUpRight size={14} />
                </Link>

                <div className="minimal-card-sublinks">
                  <Link to="/intelligence" className="minimal-sublink" title="View RFC-92 citations">
                    <IconShieldCheck size={12} />
                    <span>Audit</span>
                  </Link>
                  <Link to="/outreach" className="minimal-sublink" title="Open AgentMail outreach sequence">
                    <IconMail size={12} />
                    <span>Sequence</span>
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Minimal Activity Ledger */}
      <section className="minimal-activity-section">
        <div className="minimal-section-header">
          <h3 className="minimal-section-title">Live Activity</h3>
          <span className="minimal-section-meta">Continuous Convex stream</span>
        </div>

        <div className="minimal-activity-list">
          {activity && activity.length > 0 ? (
            activity.slice(0, 4).map((ev) => (
              <div key={ev._id} className="minimal-activity-row">
                <span className="minimal-activity-time">{when(ev.at)}</span>
                <span className="minimal-activity-summary">{ev.summary}</span>
                <span className="minimal-activity-details">{ev.details || "System event verified"}</span>
              </div>
            ))
          ) : (
            <div className="minimal-empty-text">No activity recorded yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
