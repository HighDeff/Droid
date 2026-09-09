import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Crosshair,
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
import { Progress } from "@/components/ui/progress";

export interface AdChainStage {
  step: number;
  name: string;
  type:
    | "countdown_wait"
    | "forward_arrow"
    | "secondary_modal"
    | "close_x_hunter";
  durationSeconds: number;
  status: "pending" | "running" | "completed";
  closeXPosition: { x: number; y: number };
}

export const AdPopupDestroyer: React.FC = () => {
  const [adStages, setAdStages] = useState<AdChainStage[]>([
    {
      step: 1,
      name: "Interstitial Video Ad (Wait for Countdown)",
      type: "countdown_wait",
      durationSeconds: 5,
      status: "completed",
      closeXPosition: { x: 1780, y: 80 },
    },
    {
      step: 2,
      name: "Overlay Slide (Click Forward Arrow)",
      type: "forward_arrow",
      durationSeconds: 2,
      status: "completed",
      closeXPosition: { x: 1650, y: 480 },
    },
    {
      step: 3,
      name: "Delayed 'X' Close Button Discovery",
      type: "close_x_hunter",
      durationSeconds: 3,
      status: "running",
      closeXPosition: { x: 1820, y: 60 },
    },
  ]);

  const [countdownRemaining, setCountdownRemaining] = useState(3);
  const [isBustingActive, setIsBustingActive] = useState(true);

  useEffect(() => {
    if (!isBustingActive || countdownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCountdownRemaining((prev) => {
        if (prev <= 1) {
          setAdStages((stages) =>
            stages.map((s) =>
              s.step === 3 ? { ...s, status: "completed" } : s,
            ),
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBustingActive, countdownRemaining]);

  const handleResetBuster = () => {
    setCountdownRemaining(5);
    setIsBustingActive(true);
    setAdStages((prev) =>
      prev.map((s, idx) => ({
        ...s,
        status: idx === 0 ? "running" : "pending",
      })),
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Ad Chain Stages
              </p>
              <h4 className="text-xl font-bold text-amber-400 font-mono">
                Stage 3 of 3
              </h4>
            </div>
            <Layers className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Countdown Remaining
              </p>
              <h4 className="text-xl font-bold text-cyan-400 font-mono">
                {countdownRemaining}s Left
              </h4>
            </div>
            <Clock className="w-8 h-8 text-cyan-500/40 animate-spin" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                'X' Close Coordinate
              </p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                (1820, 60)
              </h4>
            </div>
            <Crosshair className="w-8 h-8 text-emerald-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Bypass Accuracy
              </p>
              <h4 className="text-xl font-bold text-purple-400 font-mono">
                99.4%
              </h4>
            </div>
            <Zap className="w-8 h-8 text-purple-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Main Multi-Stage Chain Resolver Card */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Multi-Stage Ad & Overlay Buster ('X' Hunter)</span>
            </CardTitle>
            <Button
              size="sm"
              onClick={handleResetBuster}
              className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Chain
            </Button>
          </div>
          <CardDescription className="text-xs text-slate-300">
            Waits for countdown timers, traverses forward arrows, and hunts
            delayed 'X' close buttons
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Step Progress Checklist */}
          <div className="space-y-3">
            {adStages.map((stage) => (
              <div
                key={stage.step}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  stage.status === "completed"
                    ? "bg-emerald-950/40 border-emerald-800/80"
                    : stage.status === "running"
                      ? "bg-amber-950/50 border-amber-500/80 shadow-md"
                      : "bg-slate-950/60 border-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      stage.status === "completed"
                        ? "bg-emerald-500 text-slate-950"
                        : stage.status === "running"
                          ? "bg-amber-500 text-slate-950 animate-pulse"
                          : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {stage.step}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      {stage.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-300">
                      Target Anchor: ({stage.closeXPosition.x},{" "}
                      {stage.closeXPosition.y}) | Duration:{" "}
                      {stage.durationSeconds}s
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono capitalize ${
                    stage.status === "completed"
                      ? "text-emerald-300 border-emerald-700 bg-emerald-950"
                      : stage.status === "running"
                        ? "text-amber-300 border-amber-600 bg-amber-950"
                        : "text-slate-400 border-slate-700"
                  }`}
                >
                  {stage.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
