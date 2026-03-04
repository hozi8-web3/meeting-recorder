/**
 * DEVORA DEVS — Premium Desktop Overlay Window
 * http://devoradevs.xyz/
 *
 * Awwwards-Style Glassmorphism:
 * - High blur & saturation (Liquid Glass effect)
 * - Gradient borders via box-shadow inset
 * - Multi-layered smooth drop shadows
 * - Magnetic / micro-interaction animations
 */
import { useEffect, useState } from "react";
import { GripHorizontal, Mic, Square } from "lucide-react";
import "../../index.css";

export function OverlayApp() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState<string>("Devora AI Listening...");

    useEffect(() => {
        // Rust audio events will feed this state
    }, []);

    const toggleRecording = () => {
        setIsRecording(!isRecording);
        setTranscript(isRecording ? "Meeting Paused" : "Devora AI Listening...");
    };

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                padding: 12,
            }}
        >
            {/* 
        Awwwards "Liquid Glass" Pill
        Uses pseudo-elements in CSS below for the gradient border glow
      */}
            <div
                className={`premium-glass-pill ${isRecording ? "is-recording" : ""}`}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "8px 10px 8px 16px",
                    position: "relative",
                    borderRadius: 40,
                    maxWidth: "100%",
                    width: "max-content",
                }}
            >
                {/* Drag Handle */}
                <div
                    data-tauri-drag-region
                    className="drag-handle"
                    title="Drag to move"
                    style={{
                        cursor: "grab",
                        display: "flex",
                        alignItems: "center",
                        padding: "4px 0",
                        zIndex: 10,
                    }}
                >
                    <GripHorizontal size={15} strokeWidth={2.5} style={{ pointerEvents: "none" }} />
                </div>

                {/* Status Indicator */}
                <div style={{ display: "flex", alignItems: "center", zIndex: 10 }}>
                    <div className={`status-dot ${isRecording ? "active" : "standby"}`} />
                </div>

                {/* Mini Transcript */}
                <div
                    style={{
                        fontSize: 12.5,
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.95)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 160,
                        letterSpacing: "0.02em",
                        zIndex: 10,
                        textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                    }}
                >
                    {transcript}
                </div>

                {/* Record/Stop Button */}
                <button
                    onClick={toggleRecording}
                    className={`action-btn ${isRecording ? "stop" : "record"}`}
                    style={{ zIndex: 10 }}
                >
                    {isRecording ? <Square size={10} strokeWidth={3} /> : <Mic size={10} strokeWidth={2.5} />}
                    <span>{isRecording ? "STOP" : "RECORD"}</span>
                </button>
            </div>

            {/* Premium UI Styles */}
            <style>{`
        /* Global Transparent Reset */
        body, #root { 
          margin: 0; 
          background: transparent !important; 
          overflow: hidden;
        }

        /* The Glass Pill Base */
        .premium-glass-pill {
          background: rgba(12, 18, 28, 0.55);
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          
          /* Ambient Shadows */
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.5), 
            0 1px 3px rgba(0, 0, 0, 0.4),
            inset 0 1px 1px rgba(255, 255, 255, 0.15),
            inset 0 -1px 1px rgba(0, 0, 0, 0.4);
            
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Animated Gradient Border via Pseudo-element */
        .premium-glass-pill::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 40px;
          padding: 1px; /* border width */
          background: linear-gradient(
            135deg, 
            rgba(255,255,255,0.2) 0%, 
            rgba(255,255,255,0.05) 50%, 
            rgba(255,255,255,0.0) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        /* Active Recording Glow State */
        .premium-glass-pill.is-recording {
          background: rgba(26, 14, 14, 0.65);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.5), 
            0 1px 3px rgba(0, 0, 0, 0.4),
            0 0 30px rgba(255, 60, 60, 0.15),
            inset 0 1px 1px rgba(255, 120, 120, 0.2),
            inset 0 -1px 1px rgba(0, 0, 0, 0.4);
        }
        .premium-glass-pill.is-recording::before {
           background: linear-gradient(
            135deg, 
            rgba(255,100,100,0.4) 0%, 
            rgba(255,100,100,0.05) 50%, 
            rgba(0,0,0,0) 100%
          );
        }

        /* Drag Handle */
        .drag-handle {
          color: rgba(255,255,255,0.3);
          transition: color 0.3s ease;
        }
        .drag-handle:hover {
          color: rgba(255,255,255,0.9);
        }

        /* Status Dot */
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        .status-dot.standby {
          background: #3ddc84;
          box-shadow: 0 0 12px rgba(61,220,132,0.8);
          animation: pulse-standby 3s infinite alternate;
        }
        .status-dot.active {
          background: #ff4f4f;
          box-shadow: 0 0 16px rgba(255,79,79,0.9);
          animation: pulse-active 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-standby {
          0% { opacity: 0.6; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-active {
          0% { opacity: 1; transform: scale(1); box-shadow: 0 0 16px rgba(255,79,79,0.9); }
          50% { opacity: 0.5; transform: scale(0.85); box-shadow: 0 0 4px rgba(255,79,79,0.4); }
          100% { opacity: 1; transform: scale(1); box-shadow: 0 0 16px rgba(255,79,79,0.9); }
        }

        /* Premium Button */
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          font-family: var(--font-ui);
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.05em;
          border: none;
          outline: none;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }

        /* Subtle inner shine on button */
        .action-btn::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 50%;
          background: linear-gradient(to bottom, rgba(255,255,255,0.1), transparent);
          border-radius: 20px 20px 0 0;
          pointer-events: none;
        }

        .action-btn.record {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .action-btn.record:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: scale(1.03) translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .action-btn.stop {
          background: rgba(255, 60, 60, 0.2);
          color: #ff6b6b;
          border: 1px solid rgba(255, 60, 60, 0.3);
          box-shadow: 0 2px 12px rgba(255,60,60,0.15);
        }
        .action-btn.stop:hover {
          background: rgba(255, 60, 60, 0.3);
          color: #ff8585;
          transform: scale(1.03) translateY(-1px);
          box-shadow: 0 4px 16px rgba(255,60,60,0.25);
        }
        
        /* Entrance Animation */
        .premium-glass-pill {
          animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
        </div>
    );
}
