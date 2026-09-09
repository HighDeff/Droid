import React, { useState } from "react";
import {
  Compass,
  Crosshair,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Sliders,
  ShieldCheck,
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

export interface NavigationTestpoint {
  id: string;
  name: string;
  plannedX: number;
  plannedY: number;
  actualX: number;
  actualY: number;
  driftDx: number;
  driftDy: number;
  driftDistance: number;
  toleranceLimit: number;
  status: "aligned" | "realigned_spline" | "pending";
}

export const NavigationTestpointsDriftManager: React.FC = () => {
  const [testpoints, setTestpoints] = useState<NavigationTestpoint[]>([
    {
      id: "tp_1",
      name: "Testpoint T1: Midpoint Acceleration Check",
      plannedX: 400,
      plannedY: 240,
      actualX: 406,
      actualY: 244,
      driftDx: 6,
      driftDy: 4,
      driftDistance: 7,
      toleranceLimit: 15,
      status: "aligned",
    },
    {
      id: "tp_2",
      name: "Testpoint T2: Curve Inflexion Anchor",
      plannedX: 780,
      plannedY: 390,
      actualX: 798,
      actualY: 406,
      driftDx: 18,
      driftDy: 16,
      driftDistance: 24,
      toleranceLimit: 15,
      status: "realigned_spline",
    },
    {
      id: "tp_3",
      name: "Testpoint T3: Pre-CTA Approach Vector",
      plannedX: 1150,
      plannedY: 580,
      actualX: 1154,
      actualY: 582,
      driftDx: 4,
      driftDy: 2,
      driftDistance: 4,
      toleranceLimit: 15,
      status: "aligned",
    },
  ]);

  const [autoRealignEnabled, setAutoRealignEnabled] = useState(true);

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Navigation Testpoints
              </p>
              <h4 className="text-xl font-bold text-cyan-400 font-mono">
                {testpoints.length} Checkpoints
              </h4>
            </div>
            <Compass className="w-8 h-8 text-cyan-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Max Drift Tolerated
              </p>
              <h4 className="text-xl font-bold text-purple-400 font-mono">
                15 px
              </h4>
            </div>
            <Crosshair className="w-8 h-8 text-purple-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Splines Realigned
              </p>
              <h4 className="text-xl font-bold text-amber-400 font-mono">
                1 Realigned
              </h4>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Trajectory Alignment
              </p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                98.4% Acc
              </h4>
            </div>
            <ShieldCheck className="w-8 h-8 text-emerald-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Testpoints Table Card */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <Crosshair className="w-4 h-4" />
                <span>Navigation Testpoints & Drift Management Ledger</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Audits trajectory checkpoints and recalculates spline curves
                when deviation exceeds threshold
              </CardDescription>
            </div>
            <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px] font-mono">
              Auto-Realign Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {testpoints.map((tp) => (
            <div
              key={tp.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                tp.status === "realigned_spline"
                  ? "bg-purple-950/40 border-purple-800/80"
                  : "bg-slate-950/70 border-slate-800"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-bold">{tp.name}</span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] py-0 capitalize ${
                      tp.status === "realigned_spline"
                        ? "text-purple-300 border-purple-700 bg-purple-950"
                        : "text-emerald-300 border-emerald-800 bg-emerald-950"
                    }`}
                  >
                    {tp.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex gap-4 text-[10px] text-slate-300">
                  <span>
                    Planned: ({tp.plannedX}, {tp.plannedY})
                  </span>
                  <span>
                    Actual: ({tp.actualX}, {tp.actualY})
                  </span>
                  <span>
                    Drift:{" "}
                    <strong
                      className={
                        tp.driftDistance > tp.toleranceLimit
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }
                    >
                      {tp.driftDistance}px
                    </strong>{" "}
                    (Limit: {tp.toleranceLimit}px)
                  </span>
                </div>
              </div>

              {tp.status === "realigned_spline" && (
                <span className="text-[10px] font-bold text-purple-300 bg-purple-900/60 px-2 py-1 rounded">
                  Curve Corrected
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
