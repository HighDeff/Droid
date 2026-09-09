import React, { useState, useEffect, useRef } from "react";
import {
  MousePointer,
  Activity,
  ShieldAlert,
  Layers,
  Sparkles,
  Zap,
  Eye,
  Crosshair,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Gauge,
  Compass,
  Play,
  RotateCcw,
  Sliders,
  Shield,
  EyeOff,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

export interface QuantumMouseData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  acceleration: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  interactionType: "hover" | "click" | "drag" | "scroll";
  timestamp: number;
}

export interface DetectedModalOverlay {
  id: string;
  name: string;
  type: "modal" | "tooltip" | "notification" | "cookie_notice" | "backdrop";
  blockingLevel: "full" | "partial" | "none";
  removalMethod: "close_button" | "escape_key" | "backdrop_click" | "dom_wipe";
  status: "detected" | "bypassed" | "dismissed";
}

export interface VisualErrorItem {
  id: string;
  type:
    | "visual_error"
    | "layout_shift"
    | "unresponsive_button"
    | "obscured_target";
  severity: "critical" | "high" | "medium" | "low";
  location: { x: number; y: number; width: number; height: number };
  description: string;
  suggestedFix: string;
  confidence: number;
  autoFixAvailable: boolean;
}

export interface DifferenceMetric {
  similarityScore: number;
  pixelDifferences: number;
  significantChanges: boolean;
  changedRegionsCount: number;
  lastComparedTime: string;
}

export const QuantumMouseTracker: React.FC = () => {
  const [mouseMetrics, setMouseMetrics] = useState<QuantumMouseData>({
    x: 960,
    y: 540,
    vx: 0,
    vy: 0,
    speed: 0,
    acceleration: 0,
    pressure: 0.5,
    tiltX: 0,
    tiltY: 0,
    interactionType: "hover",
    timestamp: Date.now(),
  });

  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [autoBypassPopups, setAutoBypassPopups] = useState(true);
  const [motionTrail, setMotionTrail] = useState<
    Array<{ x: number; y: number; opacity: number }>
  >([]);

  const [popups, setPopups] = useState<DetectedModalOverlay[]>([
    {
      id: "pop_1",
      name: "Cookie Consent Banner",
      type: "cookie_notice",
      blockingLevel: "partial",
      removalMethod: "dom_wipe",
      status: "bypassed",
    },
    {
      id: "pop_2",
      name: "Newsletter Promo Dialog",
      type: "modal",
      blockingLevel: "full",
      removalMethod: "escape_key",
      status: "dismissed",
    },
  ]);

  const [visualErrors, setVisualErrors] = useState<VisualErrorItem[]>([
    {
      id: "err_1",
      type: "layout_shift",
      severity: "medium",
      location: { x: 740, y: 400, width: 400, height: 60 },
      description: "Target input element shifted by 18px after modal render",
      suggestedFix: "Recalibrate coordinates via adaptive retry engine",
      confidence: 0.94,
      autoFixAvailable: true,
    },
    {
      id: "err_2",
      type: "unresponsive_button",
      severity: "high",
      location: { x: 960, y: 740, width: 140, height: 45 },
      description:
        "Submit button had no visual state transition on single click",
      suggestedFix:
        "Upgrade click action to focus_and_click with double dispatch",
      confidence: 0.91,
      autoFixAvailable: true,
    },
  ]);

  const [differenceMap, setDifferenceMap] = useState<DifferenceMetric>({
    similarityScore: 0.96,
    pixelDifferences: 42,
    significantChanges: false,
    changedRegionsCount: 2,
    lastComparedTime: "Just now",
  });

  const lastPosRef = useRef({ x: 960, y: 540, time: Date.now(), speed: 0 });

  useEffect(() => {
    if (!isLiveTracking) return;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dt = Math.max(0.001, (now - lastPosRef.current.time) / 1000);
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      const vx = Math.round(dx / dt);
      const vy = Math.round(dy / dt);
      const speed = Math.round(Math.hypot(vx, vy));
      const acc = Math.round(Math.abs(speed - lastPosRef.current.speed) / dt);

      lastPosRef.current = { x: e.clientX, y: e.clientY, time: now, speed };

      setMouseMetrics({
        x: e.clientX,
        y: e.clientY,
        vx,
        vy,
        speed,
        acceleration: acc,
        pressure: (e as any).pressure || 0.5,
        tiltX: (e as any).tiltX || 0,
        tiltY: (e as any).tiltY || 0,
        interactionType: e.buttons ? "click" : "hover",
        timestamp: now,
      });

      setMotionTrail((prev) => [
        { x: e.clientX, y: e.clientY, opacity: 1 },
        ...prev.slice(0, 8).map((p) => ({ ...p, opacity: p.opacity * 0.7 })),
      ]);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isLiveTracking]);

  const handleBypassAll = () => {
    setPopups((prev) => prev.map((p) => ({ ...p, status: "bypassed" })));
  };

  const handleFixError = (id: string) => {
    setVisualErrors((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Quantum Telemetry Top Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Cursor Velocity
              </p>
              <h4 className="text-xl font-bold text-cyan-400 font-mono">
                {mouseMetrics.speed} px/s
              </h4>
            </div>
            <Activity className="w-8 h-8 text-cyan-500/40 animate-pulse" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Acceleration
              </p>
              <h4 className="text-xl font-bold text-purple-400 font-mono">
                {mouseMetrics.acceleration} px/s²
              </h4>
            </div>
            <Gauge className="w-8 h-8 text-purple-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Frame Similarity
              </p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                {(differenceMap.similarityScore * 100).toFixed(1)}%
              </h4>
            </div>
            <Layers className="w-8 h-8 text-emerald-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Visual Errors Detected
              </p>
              <h4 className="text-xl font-bold text-amber-400 font-mono">
                {visualErrors.length} Issues
              </h4>
            </div>
            <ShieldAlert className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Main Dual Grid: Precision Radar & Popup Engine vs Error Diagnostics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: 60 FPS Mouse Physics & Popup Auto-Bypass */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <MousePointer className="w-4 h-4" />
                <span>60 FPS Quantum Mouse Physics & Vector Tracking</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-300">
                  Live 60Hz
                </span>
                <Switch
                  checked={isLiveTracking}
                  onCheckedChange={setIsLiveTracking}
                />
              </div>
            </div>
            <CardDescription className="text-xs text-slate-300">
              Real-time velocity vectors, pressure gradient, and modal overlay
              dismissal
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Live Vector Stream Matrix */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">
                  Position (X, Y):
                </span>
                <span className="text-cyan-300 font-bold">
                  ({mouseMetrics.x}, {mouseMetrics.y})
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">
                  Velocity (Vx, Vy):
                </span>
                <span className="text-purple-300 font-bold">
                  ({mouseMetrics.vx}, {mouseMetrics.vy})
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">
                  Interaction State:
                </span>
                <span className="text-amber-300 font-bold uppercase">
                  {mouseMetrics.interactionType}
                </span>
              </div>
            </div>

            {/* Popup & Modal Auto-Bypass Section */}
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Popup & Overlay Auto-Removal Engine
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleBypassAll}
                  className="h-6 text-[10px] bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Bypass All
                </Button>
              </div>

              <div className="space-y-1.5">
                {popups.map((pop) => (
                  <div
                    key={pop.id}
                    className="p-2 bg-slate-900/90 rounded border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                      <span className="text-slate-200">{pop.name}</span>
                      <Badge variant="outline" className="text-[9px] py-0">
                        {pop.type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">
                        Method: {pop.removalMethod}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold capitalize ${
                          pop.status === "bypassed"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}
                      >
                        {pop.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Visual Error Diagnostics & Frame Difference Map */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Visual Error Detection & Difference Mapping</span>
              </CardTitle>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                Active Monitoring
              </span>
            </div>
            <CardDescription className="text-xs text-slate-300">
              Frame-to-frame pixel differences, layout shifts, and unresponsive
              button diagnostics
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Frame Difference Metric Box */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">
                  Similarity Score:
                </span>
                <span className="text-emerald-300 font-bold">
                  {(differenceMap.similarityScore * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">
                  Pixel Differences:
                </span>
                <span className="text-cyan-300 font-bold">
                  {differenceMap.pixelDifferences} px
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">
                  Changed Regions:
                </span>
                <span className="text-amber-300 font-bold">
                  {differenceMap.changedRegionsCount} Regions
                </span>
              </div>
            </div>

            {/* Visual Errors List */}
            <ScrollArea className="h-60 rounded-xl border border-slate-800 bg-slate-950/40 p-2">
              {visualErrors.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-mono">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  All UI elements responsive. No visual layout shifts detected.
                </div>
              ) : (
                <div className="space-y-2">
                  {visualErrors.map((err) => (
                    <div
                      key={err.id}
                      className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-slate-100">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>{err.description}</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          {err.severity}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 font-mono">
                        <strong>Suggested Fix:</strong> {err.suggestedFix}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                        <span>
                          Location: ({err.location.x}, {err.location.y}) [
                          {err.location.width}x{err.location.height}px]
                        </span>
                        {err.autoFixAvailable && (
                          <Button
                            size="sm"
                            onClick={() => handleFixError(err.id)}
                            className="h-6 text-[10px] bg-amber-600 hover:bg-amber-500 text-white font-bold gap-1"
                          >
                            <Zap className="w-3 h-3" /> Auto-Fix
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
