import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import AppShell from "./components/AppShell";
import OverviewPage from "./pages/OverviewPage";
import DiscoveryPage from "./pages/DiscoveryPage";
import IntelligencePage from "./pages/IntelligencePage";
import OutreachPage from "./pages/OutreachPage";
import InboxPage from "./pages/InboxPage";
import ProposalsPage from "./pages/ProposalsPage";
import StudioPage from "./pages/StudioPage";
import DeploymentsPage from "./pages/DeploymentsPage";
import WebsitePreview from "./pages/WebsitePreview";

export default function App() {
  return (
    <AppProvider>
      <Routes>
        {/* Full-screen standalone storefront previews */}
        <Route path="/preview/:slug" element={<WebsitePreview />} />

        {/* Storefront Desk SPA Management Routes wrapped in modern AppShell */}
        <Route
          path="/"
          element={
            <AppShell>
              <OverviewPage />
            </AppShell>
          }
        />
        <Route
          path="/discovery"
          element={
            <AppShell>
              <DiscoveryPage />
            </AppShell>
          }
        />
        <Route
          path="/intelligence"
          element={
            <AppShell>
              <IntelligencePage />
            </AppShell>
          }
        />
        <Route
          path="/outreach"
          element={
            <AppShell>
              <OutreachPage />
            </AppShell>
          }
        />
        <Route
          path="/inbox"
          element={
            <AppShell>
              <InboxPage />
            </AppShell>
          }
        />
        <Route
          path="/proposals"
          element={
            <AppShell>
              <ProposalsPage />
            </AppShell>
          }
        />
        <Route
          path="/studio"
          element={
            <AppShell>
              <StudioPage />
            </AppShell>
          }
        />
        <Route
          path="/deployments"
          element={
            <AppShell>
              <DeploymentsPage />
            </AppShell>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}
