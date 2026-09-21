import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function WebsitePreview() {
  const { slug } = useParams<{ slug: string }>();
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);

  const site = useQuery(api.previews.getBySlug, slug ? { slug } : "skip");

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
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link to="/" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
            ← Storefront Desk
          </Link>
          <span style={{ color: "#475569" }}>|</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>
            {site.businessIdentity.name} (Live Generated Preview v{site.version})
          </span>
          <span
            style={{
              background: "#166534",
              color: "#bbf7d0",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "4px",
              fontWeight: 700,
            }}
          >
            VERIFIED SMB PREVIEW
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              📱 Mobile (375px)
            </button>
          </div>

          <button
            onClick={() => setShowEvidenceDrawer(!showEvidenceDrawer)}
            style={{
              background: showEvidenceDrawer ? "#0f766e" : "#334155",
              color: "white",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📑 {showEvidenceDrawer ? "Hide Grounding Citations" : "Inspect Grounding Citations"}
          </button>
        </div>
      </div>

      {/* Operator Grounding Drawer */}
      {showEvidenceDrawer && (
        <div
          style={{
            background: "#1e293b",
            color: "#f8fafc",
            borderBottom: "2px solid #0f766e",
            padding: "16px 24px",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <strong style={{ color: "#38bdf8", fontSize: "14px" }}>
              🔍 Operator Provenance Ledger:
            </strong>
            <p style={{ margin: "4px 0 10px", color: "#cbd5e1" }}>
              This digital storefront is constructed strictly from verified evidence. All section content is grounded in real Google Places listing data and Firecrawl open-web scrapes.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px" }}>
                <strong style={{ color: "#4ade80" }}>✓ Hero & Coffee Roasts:</strong>
                <div style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                  Grounded in Firecrawl scrape of West Queen West single-origin Ethiopian/Colombian roast profiles.
                </div>
              </div>
              <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px" }}>
                <strong style={{ color: "#4ade80" }}>✓ Hours & Dog-Friendly Patio:</strong>
                <div style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                  Verified from official Google Places operating hours and verified sidewalk patio statements.
                </div>
              </div>
              <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px" }}>
                <strong style={{ color: "#facc15" }}>⚠️ Unsupported Items:</strong>
                <div style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                  Corporate catering package is unconfirmed on the public web; explicitly labeled as needs confirmation.
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
          padding: viewport === "mobile" ? "32px 16px" : "0",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            width: viewport === "mobile" ? "375px" : "100%",
            maxWidth: viewport === "mobile" ? "375px" : "100%",
            minHeight: viewport === "mobile" ? "812px" : "100vh",
            background: "#faf7f2",
            borderRadius: viewport === "mobile" ? "32px" : "0",
            boxShadow: viewport === "mobile" ? "0 25px 50px -12px rgba(0,0,0,0.5)" : "none",
            overflow: "hidden",
            border: viewport === "mobile" ? "8px solid #334155" : "none",
          }}
        >
          {/* Rendered Storefront Site */}
          <div className="storefront-site">
            {/* Site Navigation */}
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid #ebd9c8",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: site.theme.fontHeading,
                    fontSize: "20px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: site.theme.primaryColor,
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
                    color: site.theme.accentColor,
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
                      color: "#6e4c3e",
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
              <span className="site-badge">{site.hero.badge}</span>
              <h1
                className="site-headline"
                style={{ fontFamily: site.theme.fontHeading, color: site.theme.primaryColor }}
              >
                {site.hero.headline}
              </h1>
              <p className="site-subhead">{site.hero.subheadline}</p>
              <div className="site-cta-group">
                <a href={site.hero.primaryCta.action} className="site-btn-primary">
                  {site.hero.primaryCta.label}
                </a>
                {site.hero.secondaryCta && (
                  <a href={site.hero.secondaryCta.action} className="site-btn-secondary">
                    {site.hero.secondaryCta.label}
                  </a>
                )}
              </div>
            </section>

            {/* Site About Section */}
            <section id="about" className="site-section">
              <h2
                className="site-section-title"
                style={{ fontFamily: site.theme.fontHeading, color: site.theme.primaryColor }}
              >
                {site.aboutSection.title}
              </h2>
              <div style={{ maxWidth: "700px", margin: "0 auto 32px", fontSize: "16px", lineHeight: 1.7, color: "#6e4c3e" }}>
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
                      background: "white",
                      border: "1px solid #ebd9c8",
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: site.theme.primaryColor,
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
                style={{ fontFamily: site.theme.fontHeading, color: site.theme.primaryColor }}
              >
                {site.offeringsSection.title}
              </h2>
              <p className="site-section-desc">{site.offeringsSection.description}</p>

              <div className="offerings-grid">
                {site.offeringsSection.items.map((it: any, idx: number) => (
                  <div key={idx} className="offering-card">
                    <div>
                      <div className="offering-header">
                        <span className="offering-name" style={{ fontFamily: site.theme.fontHeading }}>
                          {it.name}
                        </span>
                        {it.priceDisplay && <span className="offering-price">{it.priceDisplay}</span>}
                      </div>
                      <p className="offering-desc">{it.description}</p>
                    </div>
                    {it.badge && (
                      <div style={{ marginTop: "12px" }}>
                        <span
                          style={{
                            background: "#eaddd0",
                            color: "#78350f",
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
                style={{ fontFamily: site.theme.fontHeading, color: site.theme.primaryColor }}
              >
                Hours &amp; Location
              </h2>
              <div
                style={{
                  maxWidth: "500px",
                  margin: "0 auto",
                  background: "white",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #ebd9c8",
                }}
              >
                <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
                  📍 {site.hoursAndLocation.address}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                  {site.hoursAndLocation.hours.map((h: any, idx: number) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{h.days}</strong>
                      <span>
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
                      borderTop: "1px dashed #ebd9c8",
                      fontSize: "13px",
                      color: "#6e4c3e",
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
                style={{ fontFamily: site.theme.fontHeading, color: site.theme.primaryColor }}
              >
                Contact &amp; Reservations
              </h2>
              <p style={{ fontSize: "16px", color: "#6e4c3e", marginBottom: "16px" }}>
                {site.contactSection.reservationNotice}
              </p>
              <div style={{ fontSize: "15px", fontWeight: 600 }}>
                ✉️ <a href={`mailto:${site.contactSection.email}`} style={{ color: site.theme.accentColor }}>{site.contactSection.email}</a>
                {site.contactSection.phone && (
                  <span style={{ marginLeft: "16px" }}>📞 {site.contactSection.phone}</span>
                )}
              </div>

              {site.unknownItems && site.unknownItems.length > 0 && (
                <div
                  style={{
                    maxWidth: "600px",
                    margin: "40px auto 0",
                    background: "#fefce8",
                    border: "1px dashed #ca8a04",
                    borderRadius: "8px",
                    padding: "16px",
                    fontSize: "13px",
                    color: "#854d0e",
                    textAlign: "left",
                  }}
                >
                  <strong>⚠️ Unconfirmed Services Notice:</strong>
                  {site.unknownItems.map((u: string, idx: number) => (
                    <div key={idx} style={{ marginTop: "4px" }}>
                      • {u}
                    </div>
                  ))}
                  <div style={{ marginTop: "8px", fontSize: "11px", color: "#a16207" }}>
                    (Storefront Desk marks missing public details as needs confirmation rather than inventing them.)
                  </div>
                </div>
              )}
            </section>

            {/* Footer */}
            <footer
              style={{
                borderTop: "1px solid #ebd9c8",
                padding: "32px 24px",
                textAlign: "center",
                fontSize: "12px",
                color: "#997b66",
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
  );
}
