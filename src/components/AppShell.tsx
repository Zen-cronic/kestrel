import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  IconSearch,
  IconShieldCheck,
  IconMail,
  IconMessageSquare,
  IconFileText,
  IconMonitor,
  IconActivity,
  IconGitHub,
  IconGitBranch,
  IconSun,
  IconMoon,
} from "./Icons";

interface NavItem {
  path: string;
  label: string;
  index: string;
  badge?: string;
  icon: (props: any) => React.JSX.Element;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Overview", index: "01", icon: IconActivity },
  { path: "/discovery", label: "Discovery Radar", index: "02", icon: IconSearch },
  { path: "/intelligence", label: "RFC-92 Evidence", index: "03", icon: IconShieldCheck },
  { path: "/outreach", label: "Outreach Desk", index: "04", icon: IconMail },
  { path: "/inbox", label: "AgentMail Live", index: "05", icon: IconMessageSquare },
  { path: "/proposals", label: "Agreement Desk", index: "06", icon: IconFileText },
  { path: "/studio", label: "Storefront Studio", index: "07", icon: IconMonitor },
  { path: "/deployments", label: "GitHub CI/CD", index: "08", icon: IconGitHub },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const {
    theme,
    toggleTheme,
    prospects,
    selectedProspectId,
    setSelectedProspectId,
    selectedProspect,
    toastNotice,
    handleResetDemo,
    isResetting,
  } = useApp();

  const currentPath = location.pathname;

  return (
    <div className="spa-app-root">

      {/* Toast Notification Banner */}
      {toastNotice && (
        <div className="spa-toast-banner">
          <span className="spa-toast-ping" />
          <span className="spa-toast-text">{toastNotice}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="spa-sidebar">
        {/* Workspace Brand Monogram */}
        <div className="spa-brand-header">
          <Link to="/" className="spa-brand-link">
            <div className="spa-brand-monogram">K</div>
            <div>
              <div className="spa-brand-title">
                Kestrel <span className="spa-online-dot" />
              </div>
              <div className="spa-brand-subtitle">Autonomous Forge v1.0</div>
            </div>
          </Link>
        </div>

        {/* Prospect Selector */}
        <div className="spa-prospect-selector">
          <label className="spa-selector-label">Active Target</label>
          <select
            value={selectedProspectId || ""}
            onChange={(e) => setSelectedProspectId(e.target.value as any)}
            className="spa-select"
          >
            {prospects?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.outreachStatus})
              </option>
            ))}
          </select>
        </div>

        {/* Navigation List */}
        <nav className="spa-nav-list">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`spa-nav-item ${isActive ? "active" : ""}`}
              >
                <div className="spa-nav-item-left">
                  <span className="spa-nav-item-index">{item.index}</span>
                  <Icon size={14} color={isActive ? "currentColor" : "var(--text-muted)"} />
                  <span className="spa-nav-item-label">{item.label}</span>
                </div>
                {item.badge && <span className="spa-nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Developer Integration Status */}
        <div className="spa-sidebar-integration">
          <Link to="/deployments" className="spa-integration-card">
            <div className="spa-integration-left">
              <IconGitBranch size={13} color="var(--accent)" />
              <div>
                <div className="spa-integration-repo">Zen-cronic/desk</div>
                <div className="spa-integration-sub">main · auto-deploy ON</div>
              </div>
            </div>
            <span className="spa-integration-beacon" />
          </Link>
        </div>

        {/* Bottom Utility Bar */}
        <div className="spa-sidebar-footer">
          <button
            onClick={toggleTheme}
            className="spa-btn-theme"
            title="Toggle Light / Dark Theme"
          >
            {theme === "dark" ? (
              <>
                <IconSun size={13} color="var(--accent)" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <IconMoon size={13} color="var(--accent)" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <button
            onClick={handleResetDemo}
            disabled={isResetting}
            className="spa-btn-reset"
            title="Reset Demo Dataset"
          >
            {isResetting ? "..." : "Reset"}
          </button>
        </div>
      </aside>

      {/* Main Stage */}
      <div className="spa-main-stage">
        {/* Top Header Strip */}
        <header className="spa-topbar">
          <div className="spa-topbar-left">
            <span className="spa-topbar-breadcrumb">Change Order</span>
            <span className="spa-topbar-slash">/</span>
            <span className="spa-topbar-section">
              {location.pathname === "/"
                ? "Command Center"
                : NAV_ITEMS.find((n) => n.path === location.pathname)?.label || "Workspace"}
            </span>
            {selectedProspect && (
              <>
                <span className="spa-topbar-slash">·</span>
                <span className="spa-topbar-target">{selectedProspect.name}</span>
              </>
            )}
          </div>

          <div className="spa-topbar-right">
            <div className="spa-topbar-meta">
              <span className="spa-online-dot" />
              <span>Convex Edge Live</span>
              <span className="spa-topbar-slash">·</span>
              <Link to="/deployments" className="spa-topbar-git-link">
                <IconGitHub size={12} />
                <span>main: 970733c</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="spa-content-container">
          <div className="spa-content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
