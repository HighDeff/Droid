import React, { useState, useEffect, useRef } from "react";
import {
  MousePointer,
  Sparkles,
  Keyboard,
  Zap,
  Radio,
  Eye,
  Crosshair,
  Volume2,
} from "lucide-react";

export interface GlobalAICursorState {
  x: number;
  y: number;
  action:
    | "idle"
    | "moving"
    | "clicking"
    | "double_clicking"
    | "typing"
    | "dragging"
    | "verifying";
  targetLabel?: string;
  textPayload?: string;
  isActing: boolean;
}

export interface GlobalAICursorOverlayProps {
  enabled: boolean;
  theme?: "cyan" | "purple" | "amber" | "emerald";
  cursorState?: GlobalAICursorState | null;
}

export const GlobalAICursorOverlay: React.FC<GlobalAICursorOverlayProps> = ({
  enabled = true,
  theme = "cyan",
  cursorState,
}) => {
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number }>({
    x: 960,
    y: 540,
  });
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>(
    [],
  );
  const [ripples, setRipples] = useState<
    { id: string; x: number; y: number; action: string }[]
  >([]);
  const [typedChars, setTypedChars] = useState<string>("");
  const [isTypingActive, setIsTypingActive] = useState(false);

  const trailCounter = useRef(0);

  // Sync with incoming cursor state or animate smoothly
  useEffect(() => {
    if (!cursorState || !enabled) return;

    const targetX = cursorState.x || 960;
    const targetY = cursorState.y || 540;

    // Add trail point
    trailCounter.current += 1;
    const newPoint = { x: targetX, y: targetY, id: trailCounter.current };

    setTrail((prev) => [...prev.slice(-16), newPoint]);
    setCurrentPos({ x: targetX, y: targetY });

    // Handle click shockwaves
    if (
      cursorState.action === "clicking" ||
      cursorState.action === "double_clicking"
    ) {
      const ripId = `rip_${Date.now()}`;
      setRipples((prev) => [
        ...prev.slice(-4),
        {
          id: ripId,
          x: targetX,
          y: targetY,
          action: cursorState.action.toUpperCase(),
        },
      ]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripId));
      }, 1000);
    }

    // Handle character-by-character typing animation
    if (cursorState.action === "typing" && cursorState.textPayload) {
      setIsTypingActive(true);
      const text = cursorState.textPayload;
      let charIdx = 0;
      setTypedChars("");
      const typeInterval = setInterval(() => {
        if (charIdx <= text.length) {
          setTypedChars(text.slice(0, charIdx));
          charIdx++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => setIsTypingActive(false), 1200);
        }
      }, 60);
      return () => clearInterval(typeInterval);
    } else {
      setIsTypingActive(false);
    }
  }, [cursorState, enabled]);

  // Clean up old trail points periodically
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setTrail((prev) => (prev.length > 0 ? prev.slice(1) : prev));
    }, 90);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  const themeColors = {
    cyan: {
      stroke: "#06b6d4",
      fill: "rgba(6, 182, 212, 0.4)",
      glow: "rgba(6, 182, 212, 0.8)",
      text: "text-cyan-300",
      bg: "bg-cyan-950/90 border-cyan-500",
      accent: "#22d3ee",
    },
    purple: {
      stroke: "#a855f7",
      fill: "rgba(168, 85, 247, 0.4)",
      glow: "rgba(168, 85, 247, 0.8)",
      text: "text-purple-300",
      bg: "bg-purple-950/90 border-purple-500",
      accent: "#c084fc",
    },
    amber: {
      stroke: "#f59e0b",
      fill: "rgba(245, 158, 11, 0.4)",
      glow: "rgba(245, 158, 11, 0.8)",
      text: "text-amber-300",
      bg: "bg-amber-950/90 border-amber-500",
      accent: "#fbbf24",
    },
    emerald: {
      stroke: "#10b981",
      fill: "rgba(16, 185, 129, 0.4)",
      glow: "rgba(16, 185, 129, 0.8)",
      text: "text-emerald-300",
      bg: "bg-emerald-950/90 border-emerald-500",
      accent: "#34d399",
    },
  }[theme];

  // Generate SVG spline path string from trail points
  const generateTrailPath = () => {
    if (trail.length < 2) return "";
    let d = `M ${trail[0].x} ${trail[0].y}`;
    for (let i = 1; i < trail.length; i++) {
      const p = trail[i];
      d += ` L ${p.x} ${p.y}`;
    }
    return d;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* 1. Motion Ribbon Trail SVG Overlay */}
      <svg className="w-full h-full absolute inset-0">
        <defs>
          <filter id="trail-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {trail.length > 1 && (
          <path
            d={generateTrailPath()}
            fill="none"
            stroke={themeColors.stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#trail-glow)"
            opacity="0.85"
          />
        )}

        {/* Trail Particle Nodes */}
        {trail.map((pt, idx) => (
          <circle
            key={pt.id}
            cx={pt.x}
            cy={pt.y}
            r={2 + (idx / trail.length) * 3.5}
            fill={themeColors.accent}
            opacity={(idx / trail.length) * 0.9}
          />
        ))}
      </svg>

      {/* 2. Expanding Click Shockwaves */}
      {ripples.map((rip) => (
        <div
          key={rip.id}
          style={{ left: `${rip.x}px`, top: `${rip.y}px` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
        >
          <div className="w-16 h-16 rounded-full border-2 border-cyan-400 bg-cyan-500/20 animate-ping shadow-2xl shadow-cyan-400/80" />
          <div className="w-8 h-8 rounded-full border border-white bg-cyan-400/40 animate-pulse absolute" />
          <span className="mt-8 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/90 text-cyan-300 border border-cyan-800 shadow-xl whitespace-nowrap animate-bounce">
            🖱️ {rip.action} ({rip.x}, {rip.y})
          </span>
        </div>
      ))}

      {/* 3. Floating AI Mouse Cursor with Spline Glow */}
      <div
        style={{
          transform: `translate(${currentPos.x}px, ${currentPos.y}px)`,
          transition: "transform 0.08s ease-out",
        }}
        className="absolute top-0 left-0 -translate-x-1 -translate-y-1 flex flex-col items-start pointer-events-none"
      >
        {/* Futuristic Glowing Pointer Arrow */}
        <div className="relative">
          <svg
            className="w-7 h-7 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] transition-transform duration-100"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
              fill={themeColors.accent}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white animate-ping" />
        </div>

        {/* Live Coordinate & Action Badge */}
        <div className="mt-1 ml-4 flex flex-col gap-0.5 font-mono text-[10px]">
          <div
            className={`px-2 py-0.5 rounded-md border ${themeColors.bg} ${themeColors.text} font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-md`}
          >
            <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
            <span className="uppercase">
              {cursorState?.action || "AI MOTOR"}
            </span>
            <span className="text-slate-300">
              ({currentPos.x}, {currentPos.y})
            </span>
          </div>

          {cursorState?.targetLabel && (
            <div className="px-1.5 py-0.5 rounded bg-black/80 text-[9px] text-slate-300 border border-slate-700">
              Target: {cursorState.targetLabel}
            </div>
          )}
        </div>

        {/* 4. Live Typing Keystroke Balloon (Animates character-by-character) */}
        {isTypingActive && (
          <div className="mt-1 ml-4 px-2.5 py-1.5 rounded-lg bg-purple-950/95 border border-purple-500 text-purple-200 text-xs font-mono font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in zoom-in-95">
            <Keyboard className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>
              Typing:{" "}
              <span className="text-white bg-purple-900/80 px-1 py-0.5 rounded">
                {typedChars}
              </span>
              <span className="animate-pulse text-cyan-400">|</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
