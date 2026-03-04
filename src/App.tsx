/**
 * DEVORA DEVS — App Shell & Router
 * http://devoradevs.xyz/
 */

import "./index.css";
import { useState } from "react";
import { Sidebar } from "./components/shared/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Recorder } from "./components/Recorder";
import { ActionBoard } from "./components/ActionBoard";
import { Analytics } from "./components/Analytics";
import { Settings } from "./components/Settings";

export default function App() {
  const [page, setPage] = useState("dashboard");

  function renderPage() {
    if (page === "dashboard") return <Dashboard onNavigate={setPage} />;
    if (page === "recorder") return <Recorder />;
    if (page === "actions") return <ActionBoard />;
    if (page === "analytics") return <Analytics />;
    if (page === "settings") return <Settings />;
    return <Dashboard onNavigate={setPage} />;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "var(--color-bg-primary)",
      }}
    >
      <Sidebar active={page} onChange={setPage} />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {renderPage()}
      </main>
    </div>
  );
}
