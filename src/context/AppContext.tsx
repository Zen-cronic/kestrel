import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface AppContextType {
  workspaceId: Id<"workspaces"> | null;
  activeCampaign: any;
  prospects: any[] | undefined;
  selectedProspectId: Id<"prospects"> | null;
  setSelectedProspectId: (id: Id<"prospects"> | null) => void;
  selectedProspect: any;
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  toggleTheme: () => void;
  previewThemeVariant: string;
  setPreviewThemeVariant: (v: string) => void;
  toastNotice: string | null;
  showToast: (msg: string) => void;
  isResetting: boolean;
  handleResetDemo: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("storefront_desk_theme") as "dark" | "light") || "light";
  });
  const [previewThemeVariant, setPreviewThemeVariant] = useState<string>("warm-artisan");
  const [selectedProspectId, setSelectedProspectId] = useState<Id<"prospects"> | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Sync theme to document body
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("storefront_desk_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => {
      setToastNotice((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // Queries & setup
  const defaultWs = useMutation(api.workspaces.getOrCreateDefault);
  const resetDemo = useMutation(api.demo.reset);
  const [workspaceId, setWorkspaceId] = useState<Id<"workspaces"> | null>(null);

  useEffect(() => {
    defaultWs()
      .then((ws) => setWorkspaceId(ws._id))
      .catch(console.error);
  }, []);

  const campaigns = useQuery(api.campaigns.list, workspaceId ? { workspaceId } : "skip");
  const activeCampaign = campaigns && campaigns.length > 0 ? campaigns[0] : null;

  const prospects = useQuery(
    api.prospects.listByCampaign,
    activeCampaign ? { campaignId: activeCampaign._id } : "skip"
  );

  // Auto-select first prospect if none selected
  useEffect(() => {
    if (!selectedProspectId && prospects && prospects.length > 0) {
      setSelectedProspectId(prospects[0]._id);
    }
  }, [prospects, selectedProspectId]);

  const selectedProspect = useQuery(
    api.prospects.get,
    selectedProspectId ? { prospectId: selectedProspectId } : "skip"
  );

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await resetDemo();
      showToast("Demo fixtures initialized with clean state & live feeds.");
    } catch (err) {
      console.error(err);
      showToast("Failed to reset demo dataset.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        workspaceId,
        activeCampaign,
        prospects,
        selectedProspectId,
        setSelectedProspectId,
        selectedProspect,
        theme,
        setTheme,
        toggleTheme,
        previewThemeVariant,
        setPreviewThemeVariant,
        toastNotice,
        showToast,
        isResetting,
        handleResetDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}
