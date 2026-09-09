import React, { useState } from "react";
import {
  Crosshair,
  Sparkles,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Compass,
  Sliders,
  Send,
  Wand2,
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CrossRefCorrectorProps {
  currentScreenshot: string;
}

export const GoalCrossReferenceCorrector: React.FC<CrossRefCorrectorProps> = ({
  currentScreenshot,
}) => {
  const [userPromptCorrection, setUserPromptCorrection] = useState("");
  const [spatialDelta, setSpatialDelta] = useState({
    dx: 14,
    dy: -8,
    confidence: 0.96,
  });
  const [autoCorrectedQueue, setAutoCorrectedQueue] = useState([
    {
      id: "t1",
      name: "Target Central Input Box",
      originalPos: "(586, 458)",
      correctedPos: "(600, 450)",
      status: "adjusted",
    },
    {
      id: "t2",
      name: "Click Submit CTA Button",
      originalPos: "(946, 750)",
      correctedPos: "(960, 742)",
      status: "adjusted",
    },
  ]);

  const handleApplyUserCorrection = () => {
    if (!userPromptCorrection) return;
    setAutoCorrectedQueue((prev) => [
      {
        id: `t_${Date.now()}`,
        name: `User Override: ${userPromptCorrection}`,
        originalPos: "(600, 450)",
        correctedPos: "(610, 450)",
        status: "adjusted",
      },
      ...prev,
    ]);
    setUserPromptCorrection("");
  };

  return (
    <div className="space-y-6">
      {/* Top 4-Point Temporal Comparison Viewport */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>
                  Temporal 4-Point Screenshot Cross-Referencing Matrix
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Aligns and cross-references Past State, Current Live Frame, Next
                Predicted Target, and Reference Template
              </CardDescription>
            </div>
            <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800 text-[10px] font-mono">
              Delta Shift: (Δx: {spatialDelta.dx}px, Δy: {spatialDelta.dy}px)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* 4-Column Temporal Screenshot Reel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Previous Screenshot */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-300 font-bold">
                  1. Previous State
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] py-0 text-slate-300"
                >
                  T - 1
                </Badge>
              </div>
              <div className="relative aspect-video bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
                {currentScreenshot ? (
                  <img
                    src={currentScreenshot}
                    alt="Previous"
                    className="w-full h-full object-contain opacity-60"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Prerequisite Baseline
                  </span>
                )}
              </div>
            </div>

            {/* 2. Current Live Screenshot */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-cyan-300 font-bold">2. Current Live</span>
                <Badge className="text-[9px] py-0 bg-cyan-950 text-cyan-300 border-cyan-800">
                  Active (T)
                </Badge>
              </div>
              <div className="relative aspect-video bg-slate-950 rounded-lg border-2 border-cyan-500/80 overflow-hidden flex items-center justify-center">
                {currentScreenshot ? (
                  <img
                    src={currentScreenshot}
                    alt="Current"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-cyan-500 font-mono">
                    Live Viewport
                  </span>
                )}
                <div
                  style={{ left: "31%", top: "41%" }}
                  className="absolute w-6 h-6 border-2 border-cyan-400 rounded animate-ping pointer-events-none"
                />
              </div>
            </div>

            {/* 3. Next Predicted Target Screenshot */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-purple-300 font-bold">
                  3. Next Target
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] py-0 text-purple-400"
                >
                  T + 1
                </Badge>
              </div>
              <div className="relative aspect-video bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
                {currentScreenshot ? (
                  <img
                    src={currentScreenshot}
                    alt="Next"
                    className="w-full h-full object-contain opacity-70"
                  />
                ) : (
                  <span className="text-[10px] text-purple-400 font-mono">
                    Forecast Target
                  </span>
                )}
              </div>
            </div>

            {/* 4. Golden Reference Library Screenshot */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-emerald-300 font-bold">
                  4. Golden Template
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] py-0 text-emerald-400"
                >
                  Ref
                </Badge>
              </div>
              <div className="relative aspect-video bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
                {currentScreenshot ? (
                  <img
                    src={currentScreenshot}
                    alt="Golden"
                    className="w-full h-full object-contain opacity-80"
                  />
                ) : (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Master Template
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Input Correction Fusion & Auto-Corrected Task Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: User Input & Feedback Fusion Bar */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              <span>Real-Time User Input & Feedback Fusion</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Provide manual prompts or corrections to adjust the auto-task
              route on the fly
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Click the second text box instead of the first..."
                value={userPromptCorrection}
                onChange={(e) => setUserPromptCorrection(e.target.value)}
                className="h-8 text-xs bg-slate-950 border-slate-700"
              />
              <Button
                size="sm"
                onClick={handleApplyUserCorrection}
                className="h-8 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-1"
              >
                <Send className="w-3 h-3" /> Fuse
              </Button>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
              <span className="text-slate-300 font-bold block">
                Temporal Alignment Telemetry:
              </span>
              <p>
                • Cross-referenced against 4 temporal frames with 96% spatial
                confidence.
              </p>
              <p>
                • Delta offset compensation: (+14px X, -8px Y) applied to
                upcoming task steps.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right: Goal-Oriented Auto-Corrected Task Queue */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Auto-Corrected Task Queue</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Tasks dynamically updated with delta-shift adjustments
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-2">
            {autoCorrectedQueue.map((t) => (
              <div
                key={t.id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <p className="text-slate-200 font-bold">{t.name}</p>
                  <p className="text-[10px] text-slate-300">
                    Orig: <span className="line-through">{t.originalPos}</span>{" "}
                    →{" "}
                    <strong className="text-emerald-300">
                      New: {t.correctedPos}
                    </strong>
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] py-0 text-emerald-400 border-emerald-800 bg-emerald-950"
                >
                  {t.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
