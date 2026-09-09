import React, { useState } from "react";
import {
  MousePointer,
  Hand,
  Sparkles,
  Zap,
  Sliders,
  Play,
  RotateCcw,
  Compass,
  TrendingUp,
  Activity,
  Smartphone,
  Move,
  Layers,
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

export const HumanMouseTouchSimulator: React.FC = () => {
  const [controlMode, setControlMode] = useState<
    "human_spline" | "mobile_touch" | "instant"
  >("human_spline");
  const [curveDuration, setCurveDuration] = useState(600); // ms
  const [overshootAmount, setOvershootAmount] = useState(12); // px
  const [microJitter, setMicroJitter] = useState(3); // px
  const [touchPressure, setTouchPressure] = useState(85); // %

  const [cursorPos, setCursorPos] = useState({ x: 250, y: 180 });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simTrail, setSimTrail] = useState<Array<{ x: number; y: number }>>([]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimTrail([]);

    const startX = cursorPos.x;
    const startY = cursorPos.y;
    const targetX = 650;
    const targetY = 280;

    const steps = 30;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const t = step / steps;
      // Cubic Bezier curve interpolation with overshoot
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const jitterX = (Math.random() - 0.5) * microJitter;
      const jitterY = (Math.random() - 0.5) * microJitter;

      const currentX = Math.round(
        startX + (targetX - startX) * easeT + jitterX,
      );
      const currentY = Math.round(
        startY + (targetY - startY) * easeT + jitterY,
      );

      setCursorPos({ x: currentX, y: currentY });
      setSimTrail((prev) => [...prev, { x: currentX, y: currentY }]);

      if (step >= steps) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, curveDuration / steps);
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setControlMode("human_spline")}
          className={`h-9 gap-2 text-xs font-bold ${
            controlMode === "human_spline"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-950"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <MousePointer className="w-4 h-4" /> Real AI Human Mouse (Cubic
          Splines)
        </Button>

        <Button
          onClick={() => setControlMode("mobile_touch")}
          className={`h-9 gap-2 text-xs font-bold ${
            controlMode === "mobile_touch"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-950"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Smartphone className="w-4 h-4" /> Mobile Touch Drag & Press
        </Button>

        <Button
          onClick={() => setControlMode("instant")}
          className={`h-9 gap-2 text-xs font-bold ${
            controlMode === "instant"
              ? "bg-slate-700 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Zap className="w-4 h-4" /> Instant Point & Click
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trajectory Tuning Controls */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Trajectory & Touch Physics</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Customize natural spline curves, jitter, and finger tap weighting
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Curve Duration:</span>
                <span className="text-purple-300 font-bold">
                  {curveDuration} ms
                </span>
              </div>
              <Slider
                value={[curveDuration]}
                min={200}
                max={2000}
                step={50}
                onValueChange={([v]) => setCurveDuration(v)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Overshoot Distance:</span>
                <span className="text-cyan-300 font-bold">
                  {overshootAmount} px
                </span>
              </div>
              <Slider
                value={[overshootAmount]}
                min={0}
                max={30}
                step={2}
                onValueChange={([v]) => setOvershootAmount(v)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Micro-Jitter Noise:</span>
                <span className="text-amber-300 font-bold">
                  {microJitter} px
                </span>
              </div>
              <Slider
                value={[microJitter]}
                min={0}
                max={10}
                step={1}
                onValueChange={([v]) => setMicroJitter(v)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Touch Press Weight:</span>
                <span className="text-emerald-300 font-bold">
                  {touchPressure}%
                </span>
              </div>
              <Slider
                value={[touchPressure]}
                min={10}
                max={100}
                step={5}
                onValueChange={([v]) => setTouchPressure(v)}
              />
            </div>

            <Button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold gap-2"
            >
              <Play className="w-3.5 h-3.5" /> Simulate Motion Trajectory
            </Button>
          </CardContent>
        </Card>

        {/* Live Simulation Visualizer Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Trajectory Sandbox</span>
                </CardTitle>
                <Badge className="bg-slate-800 text-cyan-300 border-slate-700 text-[10px] font-mono">
                  Pos: ({cursorPos.x}, {cursorPos.y})
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                {/* SVG Spline Path Rendering */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {simTrail.length > 1 && (
                    <polyline
                      points={simTrail.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                  )}
                </svg>

                {/* Target Anchor */}
                <div
                  style={{ left: 650, top: 280 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-emerald-400 bg-emerald-950/40 flex items-center justify-center animate-pulse"
                >
                  <span className="text-[9px] font-mono text-emerald-300 font-bold">
                    TARGET
                  </span>
                </div>

                {/* Live Simulated Cursor */}
                <div
                  style={{ left: cursorPos.x, top: cursorPos.y }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 pointer-events-none"
                >
                  {controlMode === "mobile_touch" ? (
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/30 border-2 border-cyan-400 animate-ping absolute inset-0" />
                      <div className="w-6 h-6 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/80 flex items-center justify-center">
                        <Hand className="w-3.5 h-3.5 text-slate-950" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-purple-950/90 border border-purple-400 px-2 py-0.5 rounded-full text-[10px] font-mono text-purple-200 shadow-lg">
                      <MousePointer className="w-3 h-3 text-purple-400 fill-purple-400" />
                      <span>AI Cursor</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
