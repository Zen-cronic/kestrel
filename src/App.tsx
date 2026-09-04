import { Route, Routes, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Home from "./pages/Home";
import Project from "./pages/Project";
import ChangeOrder from "./pages/ChangeOrder";

export default function App() {
  const status = useQuery(api.demo.status, {});
  const live = status ? Object.entries(status.providers).filter(([, v]) => v !== "mock").map(([k]) => k) : [];
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">Change Order Desk</Link>
        <span className="muted">{status ? (live.length ? `live: ${live.join(", ")}` : "demo mode — providers mocked and labelled") : ""}</span>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/p/:projectId" element={<Project />} />
          <Route path="/p/:projectId/co/:changeOrderId" element={<ChangeOrder />} />
        </Routes>
      </main>
    </div>
  );
}
