import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useApp } from "../context/AppContext";
import { IconExternalLink } from "../components/Icons";

const THEME_VARIANTS = [
  { id: "warm-artisan", name: "Warm Artisan", tag: "Terracotta & Cream", accent: "#c2410c" },
  { id: "nordic-light", name: "Nordic Alabaster", tag: "Cool Slate & Light", accent: "#0f172a" },
  { id: "sage-botanical", name: "Sage Botanical", tag: "Olive & Linen", accent: "#15803d" },
  { id: "obsidian-dark", name: "Obsidian Roastery", tag: "Dark Copper & Coal", accent: "#ea580c" },
];

export default function StudioPage() {
  const { selectedProspectId, previewThemeVariant, setPreviewThemeVariant, showToast } =
    useApp();

  const [viewportMode, setViewportMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const websiteVersions = useQuery(
    api.previews.listVersions,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );

  const activeSlug = websiteVersions?.[0]?.slug || "rustic-kettle-preview-v1";
  const previewUrl = `/preview/${activeSlug}?variant=${previewThemeVariant}`;

  const copyShareLink = () => {
    const fullUrl = `${window.location.origin}${previewUrl}`;
    navigator.clipboard.writeText(fullUrl);
    showToast("Shareable storefront preview URL copied to clipboard.");
  };

  return (
    <div className="spa-page-container">
      {/* Header */}
      <div className="spa-page-header">
        <div>
          <h1 className="spa-page-title">
            Storefront Studio & Theme Engine
            <span className="spa-badge-live">Live Responsive Canvas</span>
          </h1>
          <p className="spa-page-sub">
            Dynamic client-facing storefronts with tailored editorial typography, menu systems, and
            RFC-92 verified business claims. Switch themes instantly or test across device viewports.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={copyShareLink} className="spa-btn-topbar-outline">
            Copy Client Link
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="spa-btn-topbar-primary"
          >
            <IconExternalLink size={13} />
            <span>Open Standalone Tab</span>
          </a>
        </div>
      </div>

      {/* Control Strip: Theme Variants & Viewport Switcher */}
      <div className="spa-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        {/* Theme Variant Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginRight: "4px" }}>
            Theme Variant:
          </span>
          {THEME_VARIANTS.map((variant) => {
            const isSelected = previewThemeVariant === variant.id;
            return (
              <button
                key={variant.id}
                onClick={() => setPreviewThemeVariant(variant.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? "var(--text-primary)" : "var(--bg-primary)",
                  color: isSelected ? "var(--bg-primary)" : "var(--text-secondary)",
                  border: `1px solid ${isSelected ? "var(--text-primary)" : "var(--border)"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: variant.accent,
                    display: "inline-block",
                  }}
                />
                <span>{variant.name}</span>
                <span style={{ fontSize: "9px", opacity: 0.7 }}>({variant.tag})</span>
              </button>
            );
          })}
        </div>

        {/* Viewport Width Toggles */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px", borderRadius: "6px", background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
          <button
            onClick={() => setViewportMode("desktop")}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              border: "none",
              cursor: "pointer",
              background: viewportMode === "desktop" ? "var(--bg-card)" : "transparent",
              color: viewportMode === "desktop" ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: viewportMode === "desktop" ? 700 : 500,
            }}
          >
            Desktop (100%)
          </button>
          <button
            onClick={() => setViewportMode("tablet")}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              border: "none",
              cursor: "pointer",
              background: viewportMode === "tablet" ? "var(--bg-card)" : "transparent",
              color: viewportMode === "tablet" ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: viewportMode === "tablet" ? 700 : 500,
            }}
          >
            Tablet (768px)
          </button>
          <button
            onClick={() => setViewportMode("mobile")}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              border: "none",
              cursor: "pointer",
              background: viewportMode === "mobile" ? "var(--bg-card)" : "transparent",
              color: viewportMode === "mobile" ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: viewportMode === "mobile" ? 700 : 500,
            }}
          >
            Mobile (375px)
          </button>
        </div>
      </div>

      {/* Live Responsive Canvas Container */}
      <div className="spa-card" style={{ padding: "16px", display: "flex", justifyContent: "center", minHeight: "720px", overflowX: "auto" }}>
        <div
          style={{
            maxWidth:
              viewportMode === "desktop"
                ? "100%"
                : viewportMode === "tablet"
                ? "768px"
                : "375px",
            width: "100%",
            height: "820px",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid var(--border-strong)",
            boxShadow: "var(--shadow-hover)",
            background: "#ffffff",
            transition: "all 0.3s var(--ease-spring)",
          }}
        >
          <iframe
            src={previewUrl}
            title="Storefront Preview Canvas"
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        </div>
      </div>
    </div>
  );
}
