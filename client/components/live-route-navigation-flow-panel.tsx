import React, { useState, useEffect } from "react";
import {
  Map,
  Navigation,
  MousePointer,
  Gauge,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  Compass,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Crosshair,
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
import { Progress } from "@/components/ui/progress";

export interface RouteWaypoint {
  id: string;
  name: string;
  x: number;
  y: number;
  action: string;
  dwellTimeMs: number;
  status: "pending" | "traversing" | "completed";
}

export const LiveRouteNavigationFlowPanel: React.FC = () => {
  const [flowPreset, setFlowPreset] = useState<
    "slow" | "natural" | "gamer" | "sprint"
  >("natural");
  const [cursorVelocity, setCursorVelocity] = useState(650); // px/s
  const [clickDwellTime, setClickDwellTime] = useState(120); // ms
  const [reactionLatency, setReactionLatency] = useState(180); // ms
  const [microJitterAmount, setMicroJitterAmount] = useState(2.5); // px

  const [cursorPosition, setCursorPosition] = useState({ x: 220, y: 160 });
  const [isTraversingRoute, setIsTraversingRoute] = useState(false);
  const [routeTraversalProgress, setRouteTraversalProgress] = useState(45); // %
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(1);

  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([
    {
      id: "wp_1",
      name: "Origin Anchor",
      x: 220,
      y: 160,
      action: "start",
      dwellTimeMs: 100,
      status: "completed",
    },
    {
      id: "wp_2",
      name: "Form Field A Focus",
      x: 580,
      y: 320,
      action: "click",
      dwellTimeMs: 150,
      status: "traversing",
    },
    {
      id: "wp_3",
      name: "CAPTCHA Anchor",
      x: 960,
      y: 480,
      action: "spline_drag",
      dwellTimeMs: 300,
      status: "pending",
    },
    {
      id: "wp_4",
      name: "Submit CTA Button",
      x: 1340,
      y: 680,
      action: "click",
      dwellTimeMs: 180,
      status: "pending",
    },
  ]);

  const handleApplyPreset = (
    preset: "slow" | "natural" | "gamer" | "sprint",
  ) => {
    setFlowPreset(preset);
    if (preset === "slow") {
      setCursorVelocity(300);
      setClickDwellTime(250);
      setReactionLatency(320);
    } else if (preset === "natural") {
      setCursorVelocity(650);
      setClickDwellTime(120);
      setReactionLatency(180);
    } else if (preset === "gamer") {
      setCursorVelocity(1200);
      setClickDwellTime(80);
      setReactionLatency(110);
    } else if (preset === "sprint") {
      setCursorVelocity(2500);
      setClickDwellTime(40);
      setReactionLatency(50);
    }
  };

  const handleStartRouteTraversal = () => {
    setIsTraversingRoute(true);
    let step = 0;
    const totalSteps = 40;

    const startX = waypoints[0].x;
    const startY = waypoints[0].y;
    const endX = waypoints[3].x;
    const endY = waypoints[3].y;

    const interval = setInterval(() => {
      step++;
      const t = step / totalSteps;
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const curX = Math.round(startX + (endX - startX) * easeT);
      const curY = Math.round(startY + (endY - startY) * easeT);

      setCursorPosition({ x: curX, y: curY });
      setRouteTraversalProgress(Math.round(t * 100));

      if (step >= totalSteps) {
        clearInterval(interval);
        setIsTraversingRoute(false);
      }
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Navigation Speed
              </p>
              <h4 className="text-xl font-bold text-cyan-400 font-mono">
                {cursorVelocity} px/s
              </h4>
            </div>
            <Gauge className="w-8 h-8 text-cyan-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Route Traversal
              </p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                {routeTraversalProgress}% Done
              </h4>
            </div>
            <Navigation className="w-8 h-8 text-emerald-500/40 animate-pulse" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Click Dwell Time
              </p>
              <h4 className="text-xl font-bold text-purple-400 font-mono">
                {clickDwellTime} ms
              </h4>
            </div>
            <Activity className="w-8 h-8 text-purple-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Human Reaction Lag
              </p>
              <h4 className="text-xl font-bold text-amber-400 font-mono">
                {reactionLatency} ms
              </h4>
            </div>
            <Sparkles className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Flowrate Controls vs Live Topological Route Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Flowrate & Navigation Settings */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Navigation Flowrates & Settings</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Customize natural spline curve pacing, dwell time, and human
              reflexes
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Flow Presets Grid */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                onClick={() => handleApplyPreset("slow")}
                className={`h-8 text-xs font-bold ${flowPreset === "slow" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300"}`}
              >
                Slow & Deliberate
              </Button>
              <Button
                size="sm"
                onClick={() => handleApplyPreset("natural")}
                className={`h-8 text-xs font-bold ${flowPreset === "natural" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300"}`}
              >
                Natural Human
              </Button>
              <Button
                size="sm"
                onClick={() => handleApplyPreset("gamer")}
                className={`h-8 text-xs font-bold ${flowPreset === "gamer" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300"}`}
              >
                Pro Gamer Flow
              </Button>
              <Button
                size="sm"
                onClick={() => handleApplyPreset("sprint")}
                className={`h-8 text-xs font-bold ${flowPreset === "sprint" ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-300"}`}
              >
                Hyper Sprint Max
              </Button>
            </div>

            {/* Fine Tuning Sliders */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Cursor Velocity:</span>
                  <span className="text-cyan-300 font-bold">
                    {cursorVelocity} px/s
                  </span>
                </div>
                <Slider
                  value={[cursorVelocity]}
                  min={100}
                  max={3000}
                  step={50}
                  onValueChange={([v]) => setCursorVelocity(v)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Click Dwell Time:</span>
                  <span className="text-purple-300 font-bold">
                    {clickDwellTime} ms
                  </span>
                </div>
                <Slider
                  value={[clickDwellTime]}
                  min={20}
                  max={500}
                  step={10}
                  onValueChange={([v]) => setClickDwellTime(v)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Reaction Latency:</span>
                  <span className="text-amber-300 font-bold">
                    {reactionLatency} ms
                  </span>
                </div>
                <Slider
                  value={[reactionLatency]}
                  min={10}
                  max={600}
                  step={10}
                  onValueChange={([v]) => setReactionLatency(v)}
                />
              </div>
            </div>

            <Button
              onClick={handleStartRouteTraversal}
              disabled={isTraversingRoute}
              className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Execute Spline Route Traversal
            </Button>
          </CardContent>
        </Card>

        {/* Right: Live Topological Route Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  <span>Live Topological Route Canvas</span>
                </CardTitle>
                <Badge className="bg-slate-800 text-cyan-300 border-slate-700 text-[10px] font-mono">
                  Pos: ({cursorPosition.x}, {cursorPosition.y})
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Route Map Canvas */}
              <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                {/* SVG Spline Curves Connecting Waypoints */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path
                    d={`M 110 80 Q 290 160 480 240 T 670 340`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="6 3"
                  />
                </svg>

                {/* Waypoint Markers */}
                {waypoints.map((wp, idx) => (
                  <div
                    key={wp.id}
                    style={{
                      left: `${(wp.x / 1920) * 100}%`,
                      top: `${(wp.y / 1080) * 100}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border shadow-lg ${
                      wp.status === "completed"
                        ? "bg-emerald-950/90 border-emerald-500 text-emerald-300"
                        : wp.status === "traversing"
                          ? "bg-cyan-950/90 border-cyan-400 text-cyan-300 animate-pulse"
                          : "bg-slate-900 border-slate-700 text-slate-300"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-[9px]">
                      {idx + 1}
                    </span>
                    <span>{wp.name}</span>
                  </div>
                ))}

                {/* Real Human Cursor Avatar */}
                <div
                  style={{
                    left: `${(cursorPosition.x / 1920) * 100}%`,
                    top: `${(cursorPosition.y / 1080) * 100}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 pointer-events-none flex items-center gap-1.5 bg-purple-950/90 border border-purple-400 px-2 py-0.5 rounded-full text-[10px] font-mono text-purple-200 shadow-xl"
                >
                  <MousePointer className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                  <span>Human Cursor ({cursorVelocity} px/s)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
