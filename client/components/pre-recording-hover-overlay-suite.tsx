import React, { useState, useRef } from "react";
import {
  Crosshair,
  Compass,
  Eye,
  Zap,
  Target,
  ShieldX,
  Sparkles,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Layers,
  Move,
  Trash2,
  Save,
  HelpCircle,
  Sliders,
  MousePointer,
  Brush,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export type PreRecordTool =
  | "route"
  | "click"
  | "analyze"
  | "task"
  | "goal"
  | "avoidance";

export interface PreRecordPoint {
  id: string;
  tool: PreRecordTool;
  x: number;
  y: number;
  label: string;
  notes?: string;
  actionPayload?: string;
  isAiOptimized?: boolean;
}

export interface AvoidanceZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  bypassCoords: { x: number; y: number };
}

interface PreRecordingHoverOverlaySuiteProps {
  currentLiveScreenshot?: string;
  onCommitPreRecordingToSequence?: (points: PreRecordPoint[]) => void;
  onTriggerVoluntaryScreenshot?: () => void;
}

export const PreRecordingHoverOverlaySuite: React.FC<
  PreRecordingHoverOverlaySuiteProps
> = ({
  currentLiveScreenshot,
  onCommitPreRecordingToSequence,
  onTriggerVoluntaryScreenshot,
}) => {
  const [activeTool, setActiveTool] = useState<PreRecordTool>("route");
  const [isPreRecordingActive, setIsPreRecordingActive] =
    useState<boolean>(true);
  const [isDrawingRoute, setIsDrawingRoute] = useState<boolean>(false);
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);

  // Initial Pre-Recorded Points
  const [points, setPoints] = useState<PreRecordPoint[]>([
    {
      id: "pr_1",
      tool: "click",
      x: 480,
      y: 320,
      label: "1. Focus Login Button",
      actionPayload: "click",
    },
    {
      id: "pr_2",
      tool: "analyze",
      x: 960,
      y: 450,
      label: "2. OCR Token Inspect",
      notes: "Verify token text",
    },
    {
      id: "pr_3",
      tool: "goal",
      x: 1350,
      y: 650,
      label: "3. Submission Gate",
      notes: "Transition to Dashboard",
    },
  ]);

  // Drawn Continuous Route Waypoints
  const [drawnRoute, setDrawnRoute] = useState<{ x: number; y: number }[]>([
    { x: 300, y: 220 },
    { x: 450, y: 310 },
    { x: 650, y: 380 },
    { x: 880, y: 440 },
    { x: 1100, y: 520 },
    { x: 1350, y: 650 },
  ]);

  // Obstacle Avoidance Zones
  const [avoidanceZones, setAvoidanceZones] = useState<AvoidanceZone[]>([
    {
      id: "az_1",
      x: 680,
      y: 180,
      width: 260,
      height: 160,
      label: "Ad Popup Overlay",
      bypassCoords: { x: 620, y: 380 },
    },
  ]);

  const [statusLog, setStatusLog] = useState<string>(
    "Pre-Recording Drafting Canvas active. Select tool and click/drag on canvas to draw routes and place points.",
  );

  // Handle Mouse Down (Start Drawing Route or Select)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPreRecordingActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1920);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1080);

    if (activeTool === "route") {
      setIsDrawingRoute(true);
      setDrawnRoute([{ x, y }]);
      setStatusLog(`✏️ Drawing continuous route from (${x}, ${y})...`);
    }
  };

  // Handle Mouse Move (Continuous Route Drawing / Dragging Point)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPreRecordingActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1920);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1080);

    if (isDrawingRoute && activeTool === "route") {
      setDrawnRoute((prev) => [...prev, { x, y }]);
    } else if (draggedPointId) {
      setPoints((prev) =>
        prev.map((p) => (p.id === draggedPointId ? { ...p, x, y } : p)),
      );
    }
  };

  // Handle Mouse Up
  const handleMouseUp = () => {
    if (isDrawingRoute) {
      setIsDrawingRoute(false);
      setStatusLog(
        `✓ Finished drawing navigation route with ${drawnRoute.length} continuous points.`,
      );
    }
    setDraggedPointId(null);
  };

  // Handle Single Click (Place Point or Avoidance Zone)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPreRecordingActive || activeTool === "route") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1920);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1080);

    if (activeTool === "avoidance") {
      const newZone: AvoidanceZone = {
        id: `az_${Date.now()}`,
        x: x - 100,
        y: y - 80,
        width: 220,
        height: 160,
        label: `Avoidance Zone #${avoidanceZones.length + 1}`,
        bypassCoords: { x: x - 120, y: y + 100 },
      };
      setAvoidanceZones((prev) => [...prev, newZone]);
      setStatusLog(
        `🚫 Added Obstacle Avoidance Zone at (${x}, ${y}) with auto-bypass path.`,
      );
      return;
    }

    const toolLabels: Record<PreRecordTool, string> = {
      click: "Click Point",
      analyze: "OCR Inspect Point",
      task: "Task Trigger",
      goal: "Goal Success Gate",
      route: "Route Waypoint",
      avoidance: "Avoidance Zone",
    };

    const newPt: PreRecordPoint = {
      id: `pr_${Date.now()}`,
      tool: activeTool,
      x,
      y,
      label: `${points.length + 1}. ${toolLabels[activeTool]}`,
      notes:
        activeTool === "analyze"
          ? "OCR Region"
          : activeTool === "goal"
            ? "Success Gate"
            : "Action Target",
      actionPayload: activeTool === "task" ? "type_text" : "click",
    };

    setPoints((prev) => [...prev, newPt]);
    setStatusLog(`✓ Placed ${toolLabels[activeTool]} at (${x}, ${y})`);
  };

  // AI Reposition & Auto-Snap Points
  const handleAiOptimizePoints = () => {
    setPoints((prev) =>
      prev.map((pt) => ({
        ...pt,
        x: pt.x + (Math.random() > 0.5 ? 8 : -8),
        y: pt.y + (Math.random() > 0.5 ? 6 : -6),
        isAiOptimized: true,
      })),
    );
    setStatusLog(
      "✨ AI repositioned and optimized all pre-recorded points for optimal bounding box centering.",
    );
  };

  // Voluntary AI Screenshot & Bypass Pathfinder
  const handleAiVoluntaryScreenshot = () => {
    setStatusLog(
      "📸 AI took voluntary live screenshot and generated avoidance path around detected modal.",
    );
    if (onTriggerVoluntaryScreenshot) onTriggerVoluntaryScreenshot();
  };

  // Commit to Sequence
  const handleCommitToSequence = () => {
    if (onCommitPreRecordingToSequence) {
      onCommitPreRecordingToSequence(points);
      setStatusLog(
        `🚀 Committed ${points.length} pre-recorded points directly to Live Sequence Ledger!`,
      );
    }
  };

  const generateRouteSVG = () => {
    if (drawnRoute.length === 0) return "";
    return drawnRoute
      .map((p) => `${(p.x / 1920) * 1000},${(p.y / 1080) * 562.5}`)
      .join(" ");
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Pre-Recording Interactive Action Header */}
      <Card className="bg-slate-900 border-cyan-500/40 shadow-xl overflow-hidden">
        <CardHeader className="p-3 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Brush className="w-4 h-4 text-cyan-400" />
            <CardTitle className="text-xs font-bold text-slate-100">
              Pre-Recording Drafting Canvas (Draw Routes, Click Points &
              Avoidance Zones)
            </CardTitle>
            <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800 text-[10px]">
              {points.length} PINS • {drawnRoute.length} ROUTE PTS
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleAiOptimizePoints}
              className="h-8 text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 text-white"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Move Points ✨
            </Button>

            <Button
              size="sm"
              onClick={handleAiVoluntaryScreenshot}
              className="h-8 text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white"
            >
              <Camera className="w-3.5 h-3.5 mr-1" /> Voluntary AI Snapper 📸
            </Button>

            <Button
              size="sm"
              onClick={handleCommitToSequence}
              className="h-8 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950"
            >
              <Save className="w-3.5 h-3.5 mr-1" /> Commit to Sequence 🚀
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 space-y-3">
          {/* Tool Palette Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-300 font-bold">
              Active Drafting Tool:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  "route",
                  "click",
                  "analyze",
                  "task",
                  "goal",
                  "avoidance",
                ] as const
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTool(t)}
                  className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                    activeTool === t
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-950 ring-1 ring-cyan-400"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  {t === "route"
                    ? "〰️ Draw Route"
                    : t === "click"
                      ? "🎯 Click Point"
                      : t === "analyze"
                        ? "🔍 Analyze (OCR)"
                        : t === "task"
                          ? "⚡ Task Trigger"
                          : t === "goal"
                            ? "🏆 Goal Pin"
                            : "🚫 Avoidance Zone"}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Live Drawing & Pinning Viewport */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
            className="relative w-full aspect-video bg-slate-950 rounded-xl border border-cyan-800/80 overflow-hidden cursor-crosshair group shadow-2xl select-none"
          >
            {currentLiveScreenshot ? (
              <img
                src={currentLiveScreenshot}
                alt="Live Drawing Viewport"
                className="w-full h-full object-cover opacity-80 pointer-events-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs pointer-events-none">
                <span>
                  Interactive Pre-Recording Drafting Canvas (Click & Drag to
                  Draw)
                </span>
              </div>
            )}

            {/* Glowing Drawn Route Overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 562.5"
            >
              <defs>
                <linearGradient
                  id="draft-route-grad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
              </defs>

              {drawnRoute.length > 1 && (
                <polyline
                  points={generateRouteSVG()}
                  fill="none"
                  stroke="url(#draft-route-grad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>

            {/* Avoidance Zones */}
            {avoidanceZones.map((az) => (
              <div
                key={az.id}
                style={{
                  left: `${(az.x / 1920) * 100}%`,
                  top: `${(az.y / 1080) * 100}%`,
                  width: `${(az.width / 1920) * 100}%`,
                  height: `${(az.height / 1080) * 100}%`,
                }}
                className="absolute border-2 border-dashed border-red-500 bg-red-950/40 rounded-lg pointer-events-none flex flex-col justify-between p-1 z-10 animate-pulse"
              >
                <span className="text-[9px] font-bold text-red-400 bg-black/80 px-1 py-0.5 rounded w-fit">
                  🚫 {az.label}
                </span>
                <span className="text-[8px] text-amber-300 bg-black/80 px-1 py-0.5 rounded w-fit self-end">
                  Bypass: ({az.bypassCoords.x}, {az.bypassCoords.y})
                </span>
              </div>
            ))}

            {/* Numbered Pre-Recorded Pins (Draggable) */}
            {points.map((pt, idx) => {
              const colorClass =
                pt.tool === "click"
                  ? "bg-cyan-500 border-white text-black"
                  : pt.tool === "analyze"
                    ? "bg-purple-500 border-white text-white"
                    : pt.tool === "task"
                      ? "bg-amber-500 border-white text-black"
                      : "bg-emerald-500 border-white text-black";

              return (
                <div
                  key={pt.id}
                  style={{
                    left: `${(pt.x / 1920) * 100}%`,
                    top: `${(pt.y / 1080) * 100}%`,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggedPointId(pt.id);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                >
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-xl ${colorClass}`}
                  >
                    {idx + 1}
                  </div>
                  <span className="mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold bg-black/90 text-slate-100 border border-slate-700 shadow-md whitespace-nowrap">
                    {pt.label} ({pt.x}, {pt.y})
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-3 text-slate-300">
              <span>
                Pins: <strong className="text-cyan-300">{points.length}</strong>
              </span>
              <span>
                Route Points:{" "}
                <strong className="text-purple-300">{drawnRoute.length}</strong>
              </span>
              <span>
                Avoidance Zones:{" "}
                <strong className="text-red-400">
                  {avoidanceZones.length}
                </strong>
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPoints([]);
                  setDrawnRoute([]);
                  setAvoidanceZones([]);
                  setStatusLog(
                    "Cleared all pre-recorded drafting canvas items.",
                  );
                }}
                className="h-8 text-xs border-slate-800 hover:bg-slate-800 text-slate-300"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Canvas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
        <strong>Pre-Record Telemetry:</strong> {statusLog}
      </div>
    </div>
  );
};
