import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useApp } from "../context/AppContext";
import {
  IconSearch,
  IconMapPin,
  IconStar,
  IconCheck,
} from "../components/Icons";

export default function DiscoveryPage() {
  const { activeCampaign, setSelectedProspectId, showToast } = useApp();

  const [searchCategory, setSearchCategory] = useState("independent café");
  const [searchLocation, setSearchLocation] = useState("Toronto, ON");
  const [isSearching, setIsSearching] = useState(false);

  const candidates = useQuery(
    api.discovery.listCandidates,
    activeCampaign ? { campaignId: activeCampaign._id } : "skip"
  );

  const searchPlacesAction = useAction(api.discovery.search);
  const approveCandidate = useMutation(api.discovery.approveCandidate);
  const dismissCandidate = useMutation(api.discovery.dismissCandidate);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeCampaign) return;
    setIsSearching(true);
    try {
      const result = await searchPlacesAction({
        campaignId: activeCampaign._id,
        query: searchCategory,
        location: searchLocation,
      });
      showToast(`Scanned ${result.count} local businesses via Google Places.`);
    } catch (err) {
      console.error(err);
      showToast("Places discovery scan failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleApprove = async (candidateId: any) => {
    try {
      const prospectId = await approveCandidate({ candidateId });
      if (prospectId) {
        setSelectedProspectId(prospectId);
        showToast("Candidate approved into verified target pipeline.");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to approve candidate.");
    }
  };

  return (
    <div className="spa-page-container">
      {/* Page Header */}
      <div className="spa-page-header">
        <div>
          <h1 className="spa-page-title">
            Local Business Discovery Radar
            <span className="spa-badge-live">Live Screener</span>
          </h1>
          <p className="spa-page-sub">
            Scan high-intent local businesses via Google Places API & Firecrawl to detect digital gaps,
            missing online menus, weak responsive sites, or heavy delivery app commissions.
          </p>
        </div>

        <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          Active Targets: <strong style={{ color: "var(--text-primary)" }}>{candidates?.length ?? 0} candidates</strong>
        </div>
      </div>

      {/* Radar Console & Places Query Bar */}
      <div className="spa-grid-12">
        {/* Left: Spatial Radar Visualizer */}
        <div className="spa-col-4 spa-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "260px", position: "relative" }}>
          {/* Animated Concentric Rings */}
          <div style={{ position: "relative", width: "150px", height: "150px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid var(--border)", opacity: 0.5, animation: "pulseGlow 2.5s infinite" }} />
            <div style={{ position: "absolute", inset: "16px", borderRadius: "50%", border: "1px dashed var(--accent)", opacity: 0.4 }} />
            <div style={{ position: "absolute", inset: "32px", borderRadius: "50%", border: "1px solid var(--border)" }} />
            <div style={{ position: "absolute", inset: "48px", borderRadius: "50%", border: "1px solid var(--border)" }} />
            {/* Center Beacon */}
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--status-active)", boxShadow: "0 0 10px var(--status-active)" }} />
            {/* Target Blips */}
            <div style={{ position: "absolute", top: "26px", right: "32px", width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
            <div style={{ position: "absolute", bottom: "34px", left: "28px", width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "var(--text-muted)" }} />
          </div>

          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-primary)", fontWeight: 700 }}>
              Spatial Radar Screener
            </div>
            <div style={{ fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: "2px" }}>
              {searchLocation} · {searchCategory}
            </div>
          </div>
        </div>

        {/* Right: Search Query Panel */}
        <div className="spa-col-8 spa-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="spa-card-header">
              <h2 className="spa-card-title">Places Query Parameters</h2>
              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                Google Places + Firecrawl
              </span>
            </div>

            <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                    Business Category
                  </label>
                  <input
                    type="text"
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    placeholder="independent café, bakery, artisan roastery"
                    className="spa-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                    Geographic Focus (City / Region)
                  </label>
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="Toronto, ON"
                    className="spa-input"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="spa-btn-submit"
                >
                  <IconSearch size={13} />
                  <span>{isSearching ? "Scanning Neighborhood Radar..." : "Launch Places Radar Scan"}</span>
                </button>
              </div>
            </form>
          </div>

          <div style={{ paddingTop: "14px", borderTop: "1px solid var(--border)", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Filter Criteria: Weak website presence, high rating (≥ 4.2★)</span>
            <span style={{ color: "var(--status-active)", fontWeight: 600 }}>Zero Hallucinations</span>
          </div>
        </div>
      </div>

      {/* Discovered Candidates Grid */}
      <div className="spa-card">
        <div className="spa-card-header">
          <h2 className="spa-card-title">
            Discovered Business Candidates ({candidates?.length ?? 0})
          </h2>
          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            Ready for Evidence Grounding
          </span>
        </div>

        {candidates && candidates.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {candidates.map((c) => (
              <div
                key={c._id}
                style={{
                  padding: "16px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {c.name}
                    </h3>
                    <span className="spa-badge-live" style={{ fontSize: "9px" }}>
                      {c.status}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: "4px" }}>
                    <IconMapPin size={11} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.formattedAddress}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginTop: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <IconStar size={11} color="var(--status-amber)" />
                      <span>{c.rating}</span>
                      <span style={{ color: "var(--text-muted)" }}>({c.userRatingsTotal})</span>
                    </div>
                    <span>·</span>
                    <span>{c.priceLevel ? "$".repeat(c.priceLevel) : "$$"}</span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                    {c.weakPresenceSignals?.slice(0, 3).map((sig: string, idx: number) => (
                      <span key={idx} className="spa-nav-badge" style={{ fontSize: "9px" }}>
                        {sig.replace("Existing site is not mobile-responsive (fails viewport test)", "Non-Responsive")
                            .replace("No official first-party website", "No Website")
                            .replace("Heavy reliance on third-party delivery apps with 30% commission cuts", "30% Delivery Fee")}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  {c.status === "approved" ? (
                    <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--status-active)", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                      <IconCheck size={13} />
                      <span>Promoted to Prospect Pipeline</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleApprove(c._id)}
                        className="spa-btn-submit"
                        style={{ flex: 1, padding: "6px 12px" }}
                      >
                        Approve Target
                      </button>
                      <button
                        onClick={() => dismissCandidate({ candidateId: c._id })}
                        className="spa-btn-topbar-outline"
                        style={{ padding: "6px 12px" }}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "36px 0", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            No candidates found yet. Launch a Places Radar Scan above to populate the pipeline.
          </div>
        )}
      </div>
    </div>
  );
}
