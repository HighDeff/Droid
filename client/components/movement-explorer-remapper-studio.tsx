import React, { useState } from "react";
import {
  Compass,
  Sparkles,
  RotateCcw,
  Play,
  Pause,
  Shuffle,
  RefreshCw,
  Zap,
  MousePointer,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Layers,
  ArrowRight,
  GitFork,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";

export interface CongigatorPath {
  id: string;
  name: string;
  originalTrajectory: { x: number; y: number }[];
  remappedTrajectory: { x: number; y: number }[];
  status: "retested" | "remapping" | "restarted" | "replanned";
  altMethod:
    | "bezier_spline"
    | "tab_enter_key"
    | "arrow_scan"
    | "escape_reanchor";
  driftDistancePx: number;
  flowrateSpeed: number;
  passRate: number;
}

export const MovementExplorerRemapperStudio: React.FC = () => {
  const [paths, setPaths] = useState<CongigatorPath[]>([
    {
      id: "p_1",
      name: "Path #1: Auth Passcode Focus Curve",
      originalTrajectory: [
        { x: 100, y: 100 },
        { x: 300, y: 250 },
        { x: 420, y: 360 },
      ],
      remappedTrajectory: [
        { x: 100, y: 100 },
        { x: 280, y: 230 },
        { x: 420, y: 360 },
      ],
      status: "retested",
      altMethod: "bezier_spline",
      driftDistancePx: 3.2,
      flowrateSpeed: 750,
      passRate: 99.4,
    },
    {
      id: "p_2",
      name: "Path #2: CAPTCHA Slider Drag & Snap",
      originalTrajectory: [
        { x: 400, y: 500 },
        { x: 620, y: 500 },
        { x: 780, y: 500 },
      ],
      remappedTrajectory: [
        { x: 400, y: 500 },
        { x: 640, y: 498 },
        { x: 780, y: 500 },
      ],
      status: "replanned",
      altMethod: "arrow_scan",
      driftDistancePx: 1.8,
      flowrateSpeed: 600,
      passRate: 98.6,
    },
    {
      id: "p_3",
      name: "Path #3: Primary Submit CTA Button",
      originalTrajectory: [
        { x: 500, y: 400 },
        { x: 680, y: 480 },
        { x: 740, y: 520 },
      ],
      remappedTrajectory: [
        { x: 500, y: 400 },
        { x: 690, y: 490 },
        { x: 740, y: 520 },
      ],
      status: "restarted",
      altMethod: "escape_reanchor",
      driftDistancePx: 2.1,
      flowrateSpeed: 850,
      passRate: 99.8,
    },
  ]);

  const [activePathId, setActivePathId] = useState<string>("p_1");
  const [statusLog, setStatusLog] = useState<string>(
    "Congigator Retester & Remapper active.",
  );

  const selectedPath = paths.find((p) => p.id === activePathId) || paths[0];

  const handleRetestAll = () => {
    setStatusLog(
      "🔄 Congigator Retesting all past movement trajectories with alt-method failovers...",
    );
    setPaths((prev) =>
      prev.map((p) => ({
        ...p,
        status: "retested",
        passRate: Math.min(100, p.passRate + 0.3),
      })),
    );
    setTimeout(() => {
      setStatusLog(
        "✓ All movement trajectories retested with 0 collision and 99.6% pass rate.",
      );
    }, 1000);
  };

  const handleRemapWithAlt = () => {
    setStatusLog(
      `⚡ Remapping "${selectedPath.name}" with Alt Method (${selectedPath.altMethod})...`,
    );
    setPaths((prev) =>
      prev.map((p) =>
        p.id === activePathId
          ? { ...p, status: "remapping", driftDistancePx: 0.9 }
          : p,
      ),
    );
    setTimeout(() => {
      setStatusLog(
        `✓ "${selectedPath.name}" successfully remapped and committed.`,
      );
    }, 800);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="explorer"
        title="Movement Explorer, Congigator Retester, Replanner & Remapper Studio"
        badge="Congigator Engine Active"
        settings={[
          {
            id: "human_spline",
            label: "Human Cubic Bezier Splines",
            type: "switch",
            value: true,
            description: "Organic mouse trajectories with micro-jitter",
          },
          {
            id: "flowrate_speed",
            label: "Global Cursor Flowrate Speed",
            type: "slider",
            value: 750,
            min: 300,
            max: 2500,
            step: 50,
            unit: "px/s",
            description: "Movement pacing",
          },
          {
            id: "alt_failover",
            label: "Auto Alt-Method Failover",
            type: "switch",
            value: true,
            description: "Switch to keys/arrows if click fails",
          },
          {
            id: "collision_dedup",
            label: "Route Collision De-Duplication",
            type: "switch",
            value: true,
            description: "Prevent repeated redundant loops",
          },
        ]}
        quickActions={[
          {
            label: "Retest All Trajectories",
            action: handleRetestAll,
            variant: "default",
          },
          {
            label: "Remap with Alt Method",
            action: handleRemapWithAlt,
            variant: "secondary",
          },
        ]}
      />

      {/* Main Studio View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 4 Cols: Trajectory List & Status */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-2 bg-slate-950 border-b border-slate-800">
              <CardTitle className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                <Compass className="w-4 h-4" />
                <span>Congigator Recorded Paths</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {paths.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setActivePathId(p.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                    p.id === activePathId
                      ? "bg-slate-950 border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {p.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] uppercase text-cyan-300 border-cyan-800 bg-cyan-950/40"
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>
                      Drift:{" "}
                      <strong className="text-emerald-400">
                        {p.driftDistancePx}px
                      </strong>
                    </span>
                    <span>
                      Pass:{" "}
                      <strong className="text-cyan-300">{p.passRate}%</strong>
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 8 Cols: Visual Trajectory Remapper & Alt Method Bench */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-2 bg-slate-950 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-cyan-400" />
                <span>{selectedPath.name} • Congigator Trajectory Remap</span>
              </CardTitle>
              <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[10px]">
                ALT METHOD: {selectedPath.altMethod.toUpperCase()}
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* 2D Trajectory Canvas Preview */}
              <div className="relative w-full aspect-video bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-6">
                <svg className="w-full h-full" viewBox="0 0 1000 600">
                  {/* Grid Lines */}
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="1000" height="600" fill="url(#grid)" />

                  {/* Original Trajectory (Cyan) */}
                  <path
                    d="M 100 100 Q 300 250 420 360"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3"
                    strokeDasharray="6,6"
                  />

                  {/* Remapped Optimized Spline (Purple) */}
                  <path
                    d="M 100 100 Q 280 230 420 360"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="4"
                  />

                  {/* Waypoints */}
                  <circle cx="100" cy="100" r="7" fill="#06b6d4" />
                  <circle cx="280" cy="230" r="5" fill="#a855f7" />
                  <circle cx="420" cy="360" r="9" fill="#22c55e" />
                </svg>

                <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-[10px] text-cyan-300 border border-cyan-800">
                  Cyan Dashed: Original | Purple Solid: Congigator Remapped
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-300">
                  Flowrate:{" "}
                  <strong className="text-cyan-300">
                    {selectedPath.flowrateSpeed} px/s
                  </strong>{" "}
                  • Drift:{" "}
                  <strong className="text-emerald-400">
                    {selectedPath.driftDistancePx}px
                  </strong>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRetestAll}
                    className="h-8 text-xs border-slate-700 font-mono"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retest Trajectory
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRemapWithAlt}
                    className="h-8 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white font-mono"
                  >
                    <Shuffle className="w-3.5 h-3.5 mr-1" /> Remap with Alt
                    Method
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Telemetry Status Bar */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-300">
          <strong>Congigator Telemetry:</strong> {statusLog}
        </span>
      </div>
    </div>
  );
};
