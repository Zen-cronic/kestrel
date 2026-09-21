import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import WebsitePreview from "./pages/WebsitePreview";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/preview/:slug" element={<WebsitePreview />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}
