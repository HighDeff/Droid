import React, { useState } from "react";
import {
  RotateCcw,
  GitFork,
  Compass,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
  ArrowRight,
  TrendingUp,
  Shield,
  Eye,
  Sliders,
  MousePointer,
  Crosshair,
  GitBranch,
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface HierarchyNode {
  id: string;
  name: string;
  category: "primary" | "failover" | "creative_alt" | "recovery";
  confidence: number;
  status: "active" | "explored" | "recommended" | "stalled";
  actionSequence: string[];
  reboundCheckpoint: string;
}

export interface DriftDifferentialData {
  cursorX: number;
  cursorY: number;
  targetX: number;
  targetY: number;
  driftDx: number;
  driftDy: number;
  totalDriftDistance: number;
  applicationType: "browser" | "desktop_gui" | "game_window" | "form_portal";
  assistInterventionNeeded: boolean;
  intentAlignmentScore: number;
}

export const ScanReboundHierarchyEngine: React.FC = () => {
  const [isAutomaticReboundEnabled, setIsAutomaticReboundEnabled] =
    useState(true);
  const [isAdjacentAssistActive, setIsAdjacentAssistActive] = useState(true);

  const [reboundStatus, setReboundStatus] = useState({
    statePreserved: true,
    lastCheckpoint: "Waypoint #3: Field Grounded (600, 450)",
    activeBranch: "Branch B: Fast-Path Hotkey & Focus",
    reboundCount: 2,
    successRate: 98.2,
  });

  const [driftMetrics, setDriftMetrics] = useState<DriftDifferentialData>({
    cursorX: 620,
    cursorY: 468,
    targetX: 600,
    targetY: 450,
    driftDx: 20,
    driftDy: 18,
    totalDriftDistance: 27,
    applicationType: "form_portal",
    assistInterventionNeeded: false,
    intentAlignmentScore: 0.94,
  });

  const [hierarchyTree, setHierarchyTree] = useState<HierarchyNode[]>([
    {
      id: "node_1",
      name: "Path Alpha: Direct PyAutoGUI Click Sequence",
      category: "primary",
      confidence: 0.72,
      status: "stalled",
      actionSequence: ["Focus Input", "Type Payload", "Click Submit"],
      reboundCheckpoint: "Point #1: Initial Screen Grounding",
    },
    {
      id: "node_2",
      name: "Path Beta: Keyboard Focus + Clear & Enter (Recommended)",
      category: "failover",
      confidence: 0.96,
      status: "active",
      actionSequence: [
        "Tab to Input",
        "Ctrl+A Backspace",
        "Write Buffer",
        "Press Enter",
      ],
      reboundCheckpoint: "Point #3: Field Grounded (600, 450)",
    },
    {
      id: "node_3",
      name: "Path Gamma: Visual OCR Anchor Re-Grounding",
      category: "recovery",
      confidence: 0.89,
      status: "recommended",
      actionSequence: [
        "Scan Local Text BBox",
        "Recalibrate (X,Y)",
        "Double Click Lock",
      ],
      reboundCheckpoint: "Point #2: OCR Anchor Found",
    },
  ]);

  const handleTriggerManualRebound = () => {
    setReboundStatus((prev) => ({
      ...prev,
      reboundCount: prev.reboundCount + 1,
      lastCheckpoint: "Fresh Start from Checkpoint #3 (Preserved State)",
      activeBranch: "Path Beta: Re-selected Hierarchy Route",
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Scan Rebound Status
              </p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                State Preserved
              </h4>
            </div>
            <RotateCcw className="w-8 h-8 text-emerald-500/40 animate-spin" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Intent Alignment
              </p>
              <h4 className="text-xl font-bold text-cyan-400 font-mono">
                {(driftMetrics.intentAlignmentScore * 100).toFixed(0)}% Match
              </h4>
            </div>
            <Sparkles className="w-8 h-8 text-cyan-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Drift Differential
              </p>
              <h4 className="text-xl font-bold text-purple-400 font-mono">
                {driftMetrics.totalDriftDistance} px
              </h4>
            </div>
            <Crosshair className="w-8 h-8 text-purple-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Adjacent AI Assist
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-slate-200">
                  {isAdjacentAssistActive ? "Online" : "Standby"}
                </span>
                <Switch
                  checked={isAdjacentAssistActive}
                  onCheckedChange={setIsAdjacentAssistActive}
                />
              </div>
            </div>
            <Shield className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Main Dual Grid: Hierarchy Tree vs Adjacent Assist Mesh */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Dynamic Hierarchy Re-Selector */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <GitFork className="w-4 h-4" />
                <span>Automatic Hierarchy Re-Route Selector</span>
              </CardTitle>
              <Button
                size="sm"
                onClick={handleTriggerManualRebound}
                className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Rebound Now
              </Button>
            </div>
            <CardDescription className="text-xs text-slate-300">
              Resumes cleanly from last valid checkpoint without discarding
              execution state
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Checkpoint Status Banner */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">
                  Active Rebound Baseline:
                </span>
                <span className="text-emerald-300 font-bold">
                  {reboundStatus.lastCheckpoint}
                </span>
              </div>
              <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px]">
                {reboundStatus.reboundCount} Rebounds Clean
              </Badge>
            </div>

            {/* Hierarchy Tree Nodes */}
            <div className="space-y-2.5">
              {hierarchyTree.map((node) => (
                <div
                  key={node.id}
                  className={`p-3 rounded-xl border transition-all space-y-2 ${
                    node.status === "active"
                      ? "bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/40"
                      : node.status === "recommended"
                        ? "bg-purple-950/40 border-purple-800/80"
                        : "bg-slate-950/60 border-slate-800/80 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch
                        className={`w-4 h-4 ${node.status === "active" ? "text-cyan-400" : "text-purple-400"}`}
                      />
                      <span className="text-xs font-bold text-slate-200">
                        {node.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {(node.confidence * 100).toFixed(0)}% Conf
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                    <span>Actions:</span>
                    <span className="text-slate-300">
                      {node.actionSequence.join(" → ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Adjacent AI Co-Pilot & Drift Differential Mesh */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-purple-400 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span>Adjacent Co-Pilot: Multi-AI Drift Differential Mesh</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Monitors cursor drift relative to target goal, user intention, and
              app type ({driftMetrics.applicationType})
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Drift Coordinate Gauges */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">
                  Cursor Pos:
                </span>
                <span className="text-cyan-300 font-bold">
                  ({driftMetrics.cursorX}, {driftMetrics.cursorY})
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">
                  Goal Anchor:
                </span>
                <span className="text-emerald-300 font-bold">
                  ({driftMetrics.targetX}, {driftMetrics.targetY})
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">
                  Drift Vector (dx, dy):
                </span>
                <span className="text-purple-300 font-bold">
                  ({driftMetrics.driftDx}px, {driftMetrics.driftDy}px)
                </span>
              </div>
            </div>

            {/* Live Intent Alignment Bar */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold">
                  User Overarching Intention Fit:
                </span>
                <span className="text-cyan-400 font-bold">
                  Optimal Alignment (No Takeover Needed)
                </span>
              </div>
              <Progress
                value={driftMetrics.intentAlignmentScore * 100}
                className="h-2"
              />
            </div>

            {/* Assistance Log Matrix */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
              <p className="text-slate-200 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Adjacent Assist Telemetry Stream:</span>
              </p>
              <p>
                • Multi-AI consensus active for app context:{" "}
                <strong className="text-cyan-300">
                  {driftMetrics.applicationType}
                </strong>
              </p>
              <p>
                • Trajectory deviation under threshold (&lt;50px tolerance
                limit)
              </p>
              <p>
                • Auto-nudge ready if cursor wanders outside input field
                boundaries
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
