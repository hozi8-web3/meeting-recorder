/**
 * DEVORA DEVS — Watermark Component
 * http://devoradevs.xyz/
 * Always visible — hardcoded enterprise branding.
 */

const BRAND_NAME = "Devora Devs";
const BRAND_URL = "http://devoradevs.xyz/";

interface WatermarkProps {
    variant?: "footer" | "inline" | "compact";
}

export function Watermark({ variant = "footer" }: WatermarkProps) {
    if (variant === "compact") {
        return (
            <a href={BRAND_URL} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#3d5469", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#8899aa")}
                onMouseLeave={e => (e.currentTarget.style.color = "#3d5469")}
            >
                Made by {BRAND_NAME}
            </a>
        );
    }

    if (variant === "inline") {
        return (
            <span style={{ fontSize: 11, color: "#3d5469" }}>
                Built by{" "}
                <a href={BRAND_URL} target="_blank" rel="noopener noreferrer"
                    style={{ color: "#00a8cc", textDecoration: "none" }}>
                    {BRAND_NAME}
                </a>
            </span>
        );
    }

    // footer (default)
    return (
        <a href={BRAND_URL} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
            title={`Visit ${BRAND_NAME}`}
        >
            {/* DD logo mark */}
            <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: "linear-gradient(135deg, #00c4ee 0%, #006b8a 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,196,238,0.3)",
            }}>
                <span style={{ fontSize: 8, fontWeight: 900, color: "#010d18", letterSpacing: "-0.02em" }}>DD</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                <span style={{ fontSize: 9, color: "#3d5469", letterSpacing: "0.04em" }}>Made by</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4a6580", letterSpacing: "0.01em" }}>
                    {BRAND_NAME}
                </span>
            </div>
        </a>
    );
}
