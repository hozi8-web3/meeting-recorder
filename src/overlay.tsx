import React from "react";
import { createRoot } from "react-dom/client";
import { OverlayApp } from "./components/Overlay";
import "./index.css";

// Dedicated React entry point for the transparent overlay window
createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <OverlayApp />
    </React.StrictMode>
);
