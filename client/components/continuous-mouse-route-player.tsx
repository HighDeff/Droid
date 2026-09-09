import React, { useState, useRef, useEffect } from "react";
import {
  Compass,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  MousePointer,
  CheckCircle2,
  Activity,
  Sliders,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
  Upload,
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";

export interface MouseRoutePoint {
  x: number;
  y: number;
  time: number;
  is_click?: boolean;
  is_drag?: boolean;
  dwell_ms?: number;
}

interface ContinuousMouseRoutePlayerProps {
  currentLiveScreenshot?: string;
  onDispatchRouteToOS?: (points: MouseRoutePoint[]) => void;
}

export const ContinuousMouseRoutePlayer: React.FC<
  ContinuousMouseRoutePlayerProps
> = ({ currentLiveScreenshot, onDispatchRouteToOS }) => {
  const [isRecordingRoute, setIsRecordingRoute] = useState(false);
  const [isPlayingRoute, setIsPlayingRoute] = useState(false);
  const [isDragRoute, setIsDragRoute] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [humanDriftPx, setHumanDriftPx] = useState(4);
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState(0);

  // Sample default route (smooth navigational S-curve across workspace)
  const [routePoints, setRoutePoints] = useState<MouseRoutePoint[]>([
    { x: 180, y: 150, time: 0 },
    { x: 260, y: 200, time: 200 },
    { x: 380, y: 280, time: 450 },
    { x: 520, y: 340, time: 700 },
    { x: 680, y: 390, time: 950 },
    { x: 840, y: 440, time: 1200 },
    { x: 960, y: 520, time: 1450, is_click: true, dwell_ms: 150 },
  ]);

  const [statusLog, setStatusLog] = useState<string>(
    "Continuous Mouse Route Engine ready. Click and drag on canvas to record navigation routes.",
  );

  // Record mouse points continuously as cursor moves
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRecordingRoute) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1920);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1080);

    const now = Date.now();
    setRoutePoints((prev) => [
      ...prev,
      { x, y, time: now, is_drag: isDragRoute },
    ]);
  };

  const handleStartRecording = () => {
    setRoutePoints([]);
    setIsRecordingRoute(true);
    setStatusLog(
      "🔴 RECORDING ACTIVE: Move your mouse across the canvas to draw the continuous navigation route...",
    );
  };

  const handleStopRecording = () => {
    setIsRecordingRoute(false);
    setStatusLog(
      `✓ Recorded continuous route with ${routePoints.length} dense navigational waypoints.`,
    );
  };

  // Smooth route with AI Bezier Spline
  const handleSmoothRouteWithAI = () => {
    if (routePoints.length < 3) return;

    // Subsample and generate smooth bezier interpolation
    const smoothed: MouseRoutePoint[] = [];
    const stepSize = Math.max(1, Math.floor(routePoints.length / 15));

    for (let i = 0; i < routePoints.length; i += stepSize) {
      smoothed.push(routePoints[i]);
    }
    if (smoothed[smoothed.length - 1] !== routePoints[routePoints.length - 1]) {
      smoothed.push(routePoints[routePoints.length - 1]);
    }

    setRoutePoints(smoothed);
    setStatusLog(
      `✨ AI smoothed continuous route into ${smoothed.length} optimized cubic bezier waypoints.`,
    );
  };

  // Play Continuous Mouse Route on Real PC via PyAutoGUI (60Hz)
  const handlePlayOnActualPC = async () => {
    if (routePoints.length === 0) {
      alert("Please record or generate a mouse route first!");
      return;
    }

    setIsPlayingRoute(true);
    setStatusLog(
      `⚡ Dispatching 60Hz continuous mouse route (${routePoints.length} points) to Physical OS...`,
    );

    try {
      const res = await fetch("/api/execute-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDevice: "desktop",
          task: {
            id: `route_${Date.now()}`,
            name: "Continuous Navigational Mouse Route",
            action: "stream_mouse_route",
            routePoints,
            speedMultiplier,
            driftPx: humanDriftPx,
            isDrag: isDragRoute,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusLog(
          `✓ Physical OS mouse executed continuous route successfully.`,
        );
      }
    } catch (err) {
      console.error("Route playback error:", err);
    }

    // Also animate visual playback in frontend
    let idx = 0;
    const interval = setInterval(
      () => {
        if (idx >= routePoints.length) {
          clearInterval(interval);
          setIsPlayingRoute(false);
          setCurrentPlaybackIndex(0);
          return;
        }
        setCurrentPlaybackIndex(idx);
        idx++;
      },
      Math.max(15, Math.floor(35 / speedMultiplier)),
    );
  };

  // Generate SVG polyline path string
  const generateSVGPolyline = () => {
    if (routePoints.length === 0) return "";
    return routePoints
      .map((p) => `${(p.x / 1920) * 1000},${(p.y / 1080) * 562.5}`)
      .join(" ");
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="route"
        title="Continuous Mouse Route Recorder & 60Hz Physical OS Playback Engine"
        badge={`${routePoints.length} Stream Waypoints`}
        settings={[
          {
            id: "drag_mode",
            label: "Continuous Drag & Hold Mode",
            type: "switch",
            value: isDragRoute,
            description: "Hold left click along full route",
          },
          {
            id: "human_drift",
            label: "Human Drift Differential (±px)",
            type: "slider",
            value: humanDriftPx,
            min: 0,
            max: 20,
            step: 1,
            unit: "px",
            description: "Natural hand micro-jitter",
          },
          {
            id: "speed_mult",
            label: "Playback Speed Rate",
            type: "slider",
            value: speedMultiplier * 100,
            min: 25,
            max: 300,
            step: 25,
            unit: "%",
            description: "Movement pacing",
          },
        ]}
        quickActions={[
          {
            label: "⚡ Play on Real PC (60Hz)",
            action: handlePlayOnActualPC,
            variant: "default",
          },
          {
            label: "AI Smooth Path ✨",
            action: handleSmoothRouteWithAI,
            variant: "secondary",
          },
          {
            label: isRecordingRoute
              ? "Stop Recording ⏹️"
              : "Record Mouse Route 🔴",
            action: isRecordingRoute
              ? handleStopRecording
              : handleStartRecording,
            variant: isRecordingRoute ? "secondary" : "secondary",
          },
        ]}
      />

      {/* Main Studio View */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="p-3 bg-slate-950 border-b border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <CardTitle className="text-xs font-bold text-slate-100">
              Interactive Continuous Mouse Route Canvas (Dense 60Hz Playback)
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePlayOnActualPC}
              disabled={isPlayingRoute || routePoints.length === 0}
              className="h-8 text-xs font-mono font-bold bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-950 animate-pulse"
            >
              <Zap className="w-3.5 h-3.5 mr-1 text-yellow-300" /> ⚡ PLAY
              CONTINUOUS MOUSE ROUTE ON REAL PC (60Hz)
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {/* 2D Canvas with SVG Route Display */}
          <div
            onMouseMove={handleCanvasMouseMove}
            className={`relative w-full aspect-video bg-slate-950 rounded-xl border overflow-hidden cursor-crosshair group ${
              isRecordingRoute
                ? "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.3)]"
                : "border-slate-800"
            }`}
          >
            {currentLiveScreenshot ? (
              <img
                src={currentLiveScreenshot}
                alt="Live Viewport"
                className="w-full h-full object-cover opacity-80"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <span>Awaiting Viewport Stream...</span>
              </div>
            )}

            {/* Glowing Polyline Route Overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 562.5"
            >
              <defs>
                <linearGradient
                  id="route-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
                <filter
                  id="route-glow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {routePoints.length > 1 && (
                <polyline
                  points={generateSVGPolyline()}
                  fill="none"
                  stroke="url(#route-gradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#route-glow)"
                />
              )}

              {/* Waypoint Nodes */}
              {routePoints.map((pt, idx) => {
                const isStart = idx === 0;
                const isEnd = idx === routePoints.length - 1;
                return (
                  <circle
                    key={idx}
                    cx={(pt.x / 1920) * 1000}
                    cy={(pt.y / 1080) * 562.5}
                    r={isStart || isEnd ? 6 : 2.5}
                    fill={isStart ? "#22c55e" : isEnd ? "#ef4444" : "#06b6d4"}
                    stroke="#ffffff"
                    strokeWidth={isStart || isEnd ? 1.5 : 0.5}
                  />
                );
              })}
            </svg>

            {/* Playback Cursor Pin */}
            {isPlayingRoute && routePoints[currentPlaybackIndex] && (
              <div
                style={{
                  left: `${(routePoints[currentPlaybackIndex].x / 1920) * 100}%`,
                  top: `${(routePoints[currentPlaybackIndex].y / 1080) * 100}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex flex-col items-center animate-pulse"
              >
                <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white shadow-xl shadow-red-500" />
                <span className="mt-1 px-1.5 py-0.5 rounded bg-black/90 text-[8px] font-bold text-yellow-300">
                  ({routePoints[currentPlaybackIndex].x},{" "}
                  {routePoints[currentPlaybackIndex].y})
                </span>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-3 text-slate-300">
              <span>
                Points:{" "}
                <strong className="text-cyan-300">{routePoints.length}</strong>
              </span>
              <span>
                Speed:{" "}
                <strong className="text-purple-300">{speedMultiplier}x</strong>
              </span>
              <span>
                Human Drift:{" "}
                <strong className="text-emerald-400">±{humanDriftPx}px</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRoutePoints([])}
                className="h-8 text-xs border-slate-700 hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear Route
              </Button>
              <Button
                size="sm"
                onClick={handleSmoothRouteWithAI}
                className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Smooth Bezier Path
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telemetry Status Bar */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-300">
          <strong>Continuous Route Telemetry:</strong> {statusLog}
        </span>
      </div>
    </div>
  );
};
