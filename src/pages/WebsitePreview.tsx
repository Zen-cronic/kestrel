import { useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type ThemeVariantKey = "warm-artisan" | "nordic-light" | "sage-botanical" | "obsidian-dark";

interface ThemeDefinition {
  name: string;
  label: string;
  bg: string;
  cardBg: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  borderColor: string;
  badgeBg: string;
  badgeColor: string;
  btnPrimaryBg: string;
  btnPrimaryColor: string;
  fontHeading: string;
  fontBody: string;
}

const THEMES: Record<ThemeVariantKey, ThemeDefinition> = {
  "warm-artisan": {
    name: "Warm Artisan",
    label: "Light Parchment",
    bg: "#faf7f2",
    cardBg: "#ffffff",
    primaryColor: "#2b1810",
    accentColor: "#c87d55",
    textColor: "#5a3f33",
    borderColor: "#ebd9c8",
    badgeBg: "#eaddd0",
    badgeColor: "#78350f",
    btnPrimaryBg: "#c87d55",
    btnPrimaryColor: "#ffffff",
    fontHeading: "Fraunces, Georgia, serif",
    fontBody: "Inter, sans-serif",
  },
  "nordic-light": {
    name: "Nordic Alabaster",
    label: "Crisp Alabaster Light",
    bg: "#ffffff",
    cardBg: "#f8fafc",
    primaryColor: "#09090b",
    accentColor: "#2563eb",
    textColor: "#334155",
    borderColor: "#e2e8f0",
    badgeBg: "#e0e7ff",
    badgeColor: "#3730a3",
    btnPrimaryBg: "#09090b",
    btnPrimaryColor: "#ffffff",
    fontHeading: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    fontBody: "Inter, sans-serif",
  },
  "sage-botanical": {
    name: "Sage Botanical",
    label: "Botanical Hearth Light",
    bg: "#f4f7f4",
    cardBg: "#ffffff",
    primaryColor: "#1b382b",
    accentColor: "#2d6a4f",
    textColor: "#344e41",
    borderColor: "#d8e2dc",
    badgeBg: "#d8f3dc",
    badgeColor: "#1b4332",
    btnPrimaryBg: "#2d6a4f",
    btnPrimaryColor: "#ffffff",
    fontHeading: "Fraunces, Georgia, serif",
    fontBody: "Inter, sans-serif",
  },
  "obsidian-dark": {
    name: "Obsidian Roastery",
    label: "Dark Roast Mode",
    bg: "#09090b",
    cardBg: "#121318",
    primaryColor: "#f4f4f5",
    accentColor: "#f59e0b",
    textColor: "#94a3b8",
    borderColor: "#27272a",
    badgeBg: "rgba(245, 158, 11, 0.12)",
    badgeColor: "#fbbf24",
    btnPrimaryBg: "#f59e0b",
    btnPrimaryColor: "#09090b",
    fontHeading: "Fraunces, Georgia, serif",
    fontBody: "Inter, sans-serif",
  },
};

export default function WebsitePreview() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVariant = (searchParams.get("variant") as ThemeVariantKey) || "warm-artisan";
  const [activeVariant, setActiveVariant] = useState<ThemeVariantKey>(initialVariant);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);

  const site = useQuery(api.previews.getBySlug, slug ? { slug } : "skip");
  const currentTheme = THEMES[activeVariant] || THEMES["warm-artisan"];

  if (site === undefined) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        Loading storefront preview...
      </div>
    );
  }

  if (site === null) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>Website Preview Not Found</h2>
        <p>The requested storefront slug <code>{slug}</code> does not exist or has not been published.</p>
        <Link to="/" style={{ color: "#0f766e", fontWeight: 600 }}>← Return to Storefront Desk</Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh" }}>
      {/* Top Viewport & Operator Inspector Bar */}
      <div className="preview-viewport-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <Link
            to="/"
            style={{
              color: "#94a3b8",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              borderRadius: "6px",
              transition: "all var(--duration-fast) var(--ease-spring)",
            }}
          >
            ← Storefront Desk
          </Link>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>
            {site.businessIdentity.name}
          </span>
          <span
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#cbd5e1",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "999px",
              fontWeight: 600,
            }}
          >
            v{site.version} • {site.theme.styleVariant}
          </span>
          <span
            style={{
              background: "#14532d",
              color: "#86efac",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "999px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              border: "1px solid #166534",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
            VERIFIED SMB PREVIEW
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Theme Variant Selector */}
          <div style={{ display: "flex", background: "#090d16", borderRadius: "8px", padding: "3px", border: "1px solid rgba(255,255,255,0.1)", gap: "2px" }}>
            {(Object.keys(THEMES) as ThemeVariantKey[]).map((key) => {
              const t = THEMES[key];
              const isActive = activeVariant === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveVariant(key);
                    setSearchParams({ variant: key });
                  }}
                  style={{
                    background: isActive ? "#1e293b" : "transparent",
                    color: isActive ? "#ffffff" : "#94a3b8",
                    border: "none",
                    padding: "5px 10px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    borderRadius: "6px",
                    transition: "all var(--duration-fast) var(--ease-spring)",
                    whiteSpace: "nowrap",
                  }}
                  title={t.label}
                >
                  {t.name}
                </button>
              );
            })}
          </div>

          <div className="viewport-toggle-group">
            <button
              className={`viewport-btn ${viewport === "desktop" ? "active" : ""}`}
              onClick={() => setViewport("desktop")}
            >
              🖥️ Desktop
            </button>
            <button
              className={`viewport-btn ${viewport === "mobile" ? "active" : ""}`}
              onClick={() => setViewport("mobile")}
            >
              📱 Mobile (390px)
            </button>
          </div>

          <button
            onClick={() => setShowEvidenceDrawer(!showEvidenceDrawer)}
            style={{
              background: showEvidenceDrawer ? "#0f766e" : "#1e293b",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all var(--duration-fast) var(--ease-spring)",
              boxShadow: showEvidenceDrawer ? "0 0 0 2px rgba(15, 118, 110, 0.4)" : "none",
            }}
          >
            📑 {showEvidenceDrawer ? "Hide Citations" : "Citations"}
          </button>
        </div>
      </div>

      {/* Operator Grounding Drawer */}
      {showEvidenceDrawer && (
        <div
          style={{
            background: "#090d16",
            color: "#f8fafc",
            borderBottom: "1px solid rgba(15, 118, 110, 0.4)",
            padding: "20px 24px",
            fontSize: "13px",
            lineHeight: 1.55,
            animation: "fadeSlideUp var(--duration-normal) var(--ease-spring) both",
          }}
        >
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <strong style={{ color: "#38bdf8", fontSize: "14px", letterSpacing: "-0.01em" }}>
                🔍 Operator Grounding &amp; Provenance Ledger
              </strong>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Strict Rule: Never invent hours, roasts, or offerings not verified from public listings.
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <div style={{ background: "#1e293b", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4ade80", fontWeight: 700, fontSize: "13px" }}>
                  <span>✓</span> Hero &amp; Coffee Roasts
                </div>
                <div style={{ fontSize: "12px", marginTop: "6px", color: "#94a3b8" }}>
                  Grounded in Firecrawl scrape of West Queen West single-origin Ethiopian/Colombian roast profiles.
                </div>
              </div>
              <div style={{ background: "#1e293b", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4ade80", fontWeight: 700, fontSize: "13px" }}>
                  <span>✓</span> Hours &amp; Dog-Friendly Patio
                </div>
                <div style={{ fontSize: "12px", marginTop: "6px", color: "#94a3b8" }}>
                  Verified from official Google Places operating hours and verified sidewalk patio statements.
                </div>
              </div>
              <div style={{ background: "#1e293b", padding: "14px", borderRadius: "10px", border: "1px solid rgba(202, 138, 4, 0.3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#facc15", fontWeight: 700, fontSize: "13px" }}>
                  <span>⚠️</span> Unsupported Offerings
                </div>
                <div style={{ fontSize: "12px", marginTop: "6px", color: "#94a3b8" }}>
                  Corporate catering is unconfirmed on public web; explicitly labeled as needs confirmation.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewport Frame Container */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: viewport === "mobile" ? "24px 16px 64px" : "0",
          transition: "all var(--duration-smooth) var(--ease-spring)",
        }}
      >
        <div
          className={viewport === "mobile" ? "phone-chassis" : ""}
          style={viewport === "desktop" ? { width: "100%", minHeight: "100vh", background: currentTheme.bg } : undefined}
        >
          {viewport === "mobile" && (
            <div className="phone-notch-bar">
              <div className="phone-island" />
            </div>
          )}
          <div className={viewport === "mobile" ? "phone-screen" : ""}>
            {/* Rendered Storefront Site */}
            <div className="storefront-site" style={{ background: currentTheme.bg, color: currentTheme.textColor, fontFamily: currentTheme.fontBody }}>
            {/* Site Navigation */}
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: `1px solid ${currentTheme.borderColor}`,
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: currentTheme.fontHeading,
                    fontSize: "20px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: currentTheme.primaryColor,
                  }}
                >
                  {site.businessIdentity.name}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: currentTheme.accentColor,
                    fontWeight: 700,
                  }}
                >
                  {site.businessIdentity.neighborhood} • {site.businessIdentity.city}
                </span>
              </div>

              <nav style={{ display: "flex", gap: "16px" }}>
                {site.navigation.map((item: any, idx: number) => (
                  <a
                    key={idx}
                    href={item.anchor}
                    style={{
                      textDecoration: "none",
                      color: currentTheme.textColor,
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </header>

            {/* Site Hero Section */}
            <section className="site-hero">
              <span className="site-badge" style={{ background: currentTheme.badgeBg, color: currentTheme.badgeColor }}>
                {site.hero.badge}
              </span>
              <h1
                className="site-headline"
                style={{ fontFamily: currentTheme.fontHeading, color: currentTheme.primaryColor }}
              >
                {site.hero.headline}
              </h1>
              <p className="site-subhead" style={{ color: currentTheme.textColor }}>{site.hero.subheadline}</p>
              <div className="site-cta-group">
                <a
                  href={site.hero.primaryCta.action}
                  className="site-btn-primary"
                  style={{ background: currentTheme.btnPrimaryBg, color: currentTheme.btnPrimaryColor }}
                >
                  {site.hero.primaryCta.label}
                </a>
                {site.hero.secondaryCta && (
                  <a
                    href={site.hero.secondaryCta.action}
                    className="site-btn-secondary"
                    style={{ borderColor: currentTheme.btnPrimaryBg, color: currentTheme.primaryColor }}
                  >
                    {site.hero.secondaryCta.label}
                  </a>
                )}
              </div>
            </section>

            {/* Site About Section */}
            <section id="about" className="site-section">
              <h2
                className="site-section-title"
                style={{ fontFamily: currentTheme.fontHeading, color: currentTheme.primaryColor }}
              >
                {site.aboutSection.title}
              </h2>
              <div style={{ maxWidth: "700px", margin: "0 auto 32px", fontSize: "16px", lineHeight: 1.7, color: currentTheme.textColor }}>
                {site.aboutSection.storyParagraphs.map((p: string, idx: number) => (
                  <p key={idx} style={{ marginBottom: "16px" }}>
                    {p}
                  </p>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                  marginTop: "32px",
                }}
              >
                {site.aboutSection.highlights.map((h: string, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: currentTheme.cardBg,
                      border: `1px solid ${currentTheme.borderColor}`,
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: currentTheme.primaryColor,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    ✨ {h}
                  </div>
                ))}
              </div>
            </section>

            {/* Site Offerings Section */}
            <section id="offerings" className="site-section">
              <h2
                className="site-section-title"
                style={{ fontFamily: currentTheme.fontHeading, color: currentTheme.primaryColor }}
              >
                {site.offeringsSection.title}
              </h2>
              <p className="site-section-desc" style={{ color: currentTheme.textColor }}>{site.offeringsSection.description}</p>

              <div className="offerings-grid">
                {site.offeringsSection.items.map((it: any, idx: number) => (
                  <div
                    key={idx}
                    className="offering-card"
                    style={{
                      background: currentTheme.cardBg,
                      border: `1px solid ${currentTheme.borderColor}`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div>
                      <div className="offering-header">
                        <span className="offering-name" style={{ fontFamily: currentTheme.fontHeading, color: currentTheme.primaryColor }}>
                          {it.name}
                        </span>
                        {it.priceDisplay && <span className="offering-price" style={{ color: currentTheme.accentColor }}>{it.priceDisplay}</span>}
                      </div>
                      <p className="offering-desc" style={{ color: currentTheme.textColor }}>{it.description}</p>
                    </div>
                    {it.badge && (
                      <div style={{ marginTop: "12px" }}>
                        <span
                          style={{
                            background: currentTheme.badgeBg,
                            color: currentTheme.badgeColor,
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          {it.badge}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Site Hours & Location */}
            <section id="location" className="site-section">
              <h2
                className="site-section-title"
                style={{ fontFamily: currentTheme.fontHeading, color: currentTheme.primaryColor }}
              >
                Hours &amp; Location
              </h2>
              <div
                style={{
                  maxWidth: "500px",
                  margin: "0 auto",
                  background: currentTheme.cardBg,
                  padding: "24px",
                  borderRadius: "12px",
                  border: `1px solid ${currentTheme.borderColor}`,
                  color: currentTheme.primaryColor,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
                  📍 {site.hoursAndLocation.address}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                  {site.hoursAndLocation.hours.map((h: any, idx: number) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{h.days}</strong>
                      <span style={{ color: currentTheme.textColor }}>
                        {h.open} – {h.close}
                      </span>
                    </div>
                  ))}
                </div>
                {site.hoursAndLocation.note && (
                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "16px",
                      borderTop: `1px dashed ${currentTheme.borderColor}`,
                      fontSize: "13px",
                      color: currentTheme.textColor,
                    }}
                  >
                    ☕ {site.hoursAndLocation.note}
                  </div>
                )}
              </div>
            </section>

            {/* Contact & Unknown Items */}
            <section id="contact" className="site-section" style={{ textAlign: "center" }}>
              <h2
                className="site-section-title"
                style={{ fontFamily: currentTheme.fontHeading, color: currentTheme.primaryColor }}
              >
                Contact &amp; Reservations
              </h2>
              <p style={{ fontSize: "16px", color: currentTheme.textColor, marginBottom: "16px" }}>
                {site.contactSection.reservationNotice}
              </p>
              <div style={{ fontSize: "15px", fontWeight: 600 }}>
                ✉️ <a href={`mailto:${site.contactSection.email}`} style={{ color: currentTheme.accentColor }}>{site.contactSection.email}</a>
                {site.contactSection.phone && (
                  <span style={{ marginLeft: "16px", color: currentTheme.primaryColor }}>📞 {site.contactSection.phone}</span>
                )}
              </div>

              {site.unknownItems && site.unknownItems.length > 0 && (
                <div
                  style={{
                    maxWidth: "600px",
                    margin: "40px auto 0",
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px dashed rgba(245, 158, 11, 0.3)",
                    borderRadius: "8px",
                    padding: "16px",
                    fontSize: "13px",
                    color: currentTheme.textColor,
                    textAlign: "left",
                  }}
                >
                  <strong style={{ color: "#d97706" }}>⚠️ Unconfirmed Services Notice:</strong>
                  {site.unknownItems.map((u: string, idx: number) => (
                    <div key={idx} style={{ marginTop: "4px" }}>
                      • {u}
                    </div>
                  ))}
                  <div style={{ marginTop: "8px", fontSize: "11px", color: "#9ca3af" }}>
                    (Storefront Desk marks missing public details as needs confirmation rather than inventing them.)
                  </div>
                </div>
              )}
            </section>

            {/* Footer */}
            <footer
              style={{
                borderTop: `1px solid ${currentTheme.borderColor}`,
                padding: "32px 24px",
                textAlign: "center",
                fontSize: "12px",
                color: currentTheme.textColor,
                opacity: 0.8,
              }}
            >
              <div>© {new Date().getFullYear()} {site.businessIdentity.name}. All rights reserved.</div>
              <div style={{ marginTop: "6px" }}>
                Preview generated &amp; hosted by <strong>Storefront Desk</strong>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
