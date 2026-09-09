import React, { useState } from "react";
import {
  Flame,
  Sparkles,
  Zap,
  Activity,
  RotateCcw,
  Play,
  Pause,
  Layers,
  Search,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Cpu,
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

export const AggressiveLoopDataAssembly: React.FC = () => {
  const [isRunning, setIsRunning] = useState(true);
  const [fractorRedrawDepth, setFractorRedrawDepth] = useState(4);
  const [refocusPacingMs, setRefocusPacingMs] = useState(120);
  const [meshIntegrity, setMeshIntegrity] = useState(98.4);
  const [infoLossDrift, setInfoLossDrift] = useState(0.6);
  const [aiFavorRating, setAiFavorRating] = useState(96.8);

  const [assemblyPhases, setAssemblyPhases] = useState([
    {
      name: "Phase 1: Fractal Redraw & Viewport Slicing",
      status: "completed",
      latencyMs: 14,
      accuracy: "99.2%",
    },
    {
      name: "Phase 2: Live Positioning & Differential Meshing",
      status: "running",
      latencyMs: 18,
      accuracy: "98.7%",
    },
    {
      name: "Phase 3: Screen Refocus & Topology Reforming",
      status: "pending",
      latencyMs: 22,
      accuracy: "97.9%",
    },
    {
      name: "Phase 4: Info Loss Audit & AI Drift Suppression",
      status: "pending",
      latencyMs: 12,
      accuracy: "99.5%",
    },
    {
      name: "Phase 5: Aggressive Data Assembly & Precog Commit",
      status: "pending",
      latencyMs: 16,
      accuracy: "98.9%",
    },
  ]);

  const handleRunRefocusCycle = () => {
    setIsRunning(true);
    setAssemblyPhases((prev) =>
      prev.map((p, idx) => ({
        ...p,
        status: idx === 0 ? "running" : "pending",
      })),
    );
  };

  return (
    <div className="space-y-4">
      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="aggro"
        title="Aggressive Loop Engine: Fractal Redraw, Mesh Reforming & Info Loss Auditor"
        badge="Fractor Depth 4x Active"
        settings={[
          {
            id: "fractor_depth",
            label: "Fractal Redraw Slicing Depth",
            type: "slider",
            value: fractorRedrawDepth,
            min: 1,
            max: 8,
            step: 1,
            unit: "lvl",
            description: "Spatial resolution mesh",
          },
          {
            id: "refocus_pacing",
            label: "Refocus & Meshing Interval",
            type: "slider",
            value: refocusPacingMs,
            min: 50,
            max: 500,
            step: 10,
            unit: "ms",
            description: "Loop heartbeat",
          },
          {
            id: "drift_suppression",
            label: "Info Loss & Drift Suppressor",
            type: "switch",
            value: true,
            description: "Prevent model hallucination and loss of favor",
          },
          {
            id: "precog_commit",
            label: "Aggressive Precog Assembly Commit",
            type: "switch",
            value: true,
            description: "Stream opcodes to executor queue",
          },
        ]}
        quickActions={[
          {
            label: "Run Refocus Cycle",
            action: handleRunRefocusCycle,
            variant: "default",
          },
          {
            label: "Recalibrate Mesh",
            action: () => setMeshIntegrity(99.8),
            variant: "secondary",
          },
        ]}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <Card className="bg-slate-900 border-red-500/40 shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                <span>Difference Mesh Integrity</span>
              </CardTitle>
              <Badge className="bg-red-950 text-red-300 border-red-800 text-[10px]">
                {meshIntegrity}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <Progress value={meshIntegrity} className="h-1.5 bg-slate-800" />
            <p className="text-[10px] text-slate-300 pt-1">
              Topology nodes reformed:{" "}
              <strong className="text-slate-200">1,024 / 1,024</strong>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-cyan-500/40 shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                <span>Info Loss & Drift Rate</span>
              </CardTitle>
              <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800 text-[10px]">
                {infoLossDrift}% (Low)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <Progress
              value={100 - infoLossDrift * 10}
              className="h-1.5 bg-slate-800"
            />
            <p className="text-[10px] text-slate-300 pt-1">
              Zero-blank loss protection:{" "}
              <strong className="text-emerald-400">ACTIVE</strong>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-purple-500/40 shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Favor & Trust Index</span>
              </CardTitle>
              <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[10px]">
                {aiFavorRating}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <Progress value={aiFavorRating} className="h-1.5 bg-slate-800" />
            <p className="text-[10px] text-slate-300 pt-1">
              Consensus alignment across swarm:{" "}
              <strong className="text-purple-300">Optimal</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stepper */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl font-mono">
        <CardHeader className="pb-2 bg-slate-950 border-b border-slate-800">
          <CardTitle className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>5-Phase Aggressive Loop & Precog Assembly Pipeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2.5">
          {assemblyPhases.map((ph, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Badge
                  variant="outline"
                  className={`text-[9px] font-mono py-0 ${
                    ph.status === "completed"
                      ? "text-emerald-400 border-emerald-800 bg-emerald-950/40"
                      : ph.status === "running"
                        ? "text-cyan-400 border-cyan-800 bg-cyan-950/40 animate-pulse"
                        : "text-slate-400 border-slate-800"
                  }`}
                >
                  {ph.status.toUpperCase()}
                </Badge>
                <span className="text-slate-200 font-bold">{ph.name}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-300">
                <span>
                  Latency:{" "}
                  <strong className="text-slate-200">{ph.latencyMs}ms</strong>
                </span>
                <span>
                  Accuracy:{" "}
                  <strong className="text-cyan-300">{ph.accuracy}</strong>
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
