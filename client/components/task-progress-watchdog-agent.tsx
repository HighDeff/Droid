import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Activity,
  HeartHandshake,
  Eye,
  Sliders,
  Compass,
  Play,
  Pause,
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

export interface WatchdogAuditRecord {
  id: string;
  timestamp: string;
  stepIndex: number;
  stepName: string;
  latencyMs: number;
  stateDeltaAdvancement: boolean;
  status:
    | "nominal"
    | "stall_detected"
    | "remedy_applied"
    | "checkpoint_verified";
  remedyAction?: string;
}

export const TaskProgressWatchdogAgent: React.FC = () => {
  const [isWatchdogActive, setIsWatchdogActive] = useState(true);
  const [stallTimeoutThreshold, setStallTimeoutThreshold] = useState(2500); // ms
  const [currentStepProgress, setCurrentStepProgress] = useState(78); // %
  const [activeStepLatency, setActiveStepLatency] = useState(380); // ms

  const [auditLog, setAuditLog] = useState<WatchdogAuditRecord[]>([
    {
      id: "aud_1",
      timestamp: "11:06:12",
      stepIndex: 1,
      stepName: "Ground Central Input Field",
      latencyMs: 340,
      stateDeltaAdvancement: true,
      status: "checkpoint_verified",
    },
    {
      id: "aud_2",
      timestamp: "11:06:15",
      stepIndex: 2,
      stepName: "Verified Typing Character Stream",
      latencyMs: 1240,
      stateDeltaAdvancement: true,
      status: "nominal",
    },
    {
      id: "aud_3",
      timestamp: "11:06:18",
      stepIndex: 3,
      stepName: "Post-Input CTA Submit Button Click",
      latencyMs: 2750,
      stateDeltaAdvancement: false,
      status: "remedy_applied",
      remedyAction:
        "Dispatched focus_and_click double trigger to break 2.7s stall",
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Watchdog Agent Status
              </p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                {isWatchdogActive ? "Auditing (60Hz)" : "Paused"}
              </h4>
            </div>
            <Activity className="w-8 h-8 text-emerald-500/40 animate-pulse" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Step Latency
              </p>
              <h4 className="text-xl font-bold text-cyan-400 font-mono">
                {activeStepLatency} ms
              </h4>
            </div>
            <Clock className="w-8 h-8 text-cyan-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Stall Timeout Limit
              </p>
              <h4 className="text-xl font-bold text-amber-400 font-mono">
                {(stallTimeoutThreshold / 1000).toFixed(1)}s
              </h4>
            </div>
            <ShieldAlert className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Stalls Auto-Remedied
              </p>
              <h4 className="text-xl font-bold text-purple-400 font-mono">
                1 Remedied
              </h4>
            </div>
            <Zap className="w-8 h-8 text-purple-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Main Watchdog Control & Live Audit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchdog Configuration Card */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>Watchdog Configuration</span>
              </CardTitle>
              <Switch
                checked={isWatchdogActive}
                onCheckedChange={setIsWatchdogActive}
              />
            </div>
            <CardDescription className="text-xs text-slate-300">
              Automatic progress health verification and stall auto-recovery
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Live Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold">
                  Active Operation Milestone:
                </span>
                <span className="text-cyan-400 font-bold">
                  {currentStepProgress}% Complete
                </span>
              </div>
              <Progress value={currentStepProgress} className="h-2" />
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
              <span className="text-slate-300 font-bold block">
                Autonomous Remedy Policies:
              </span>
              <p>
                • <strong>Threshold Stall (&gt;2.5s):</strong> Triggers instant
                micro-retry & focus lock.
              </p>
              <p>
                • <strong>State Regress Detected:</strong> Re-anchors cursor to
                last verified checkpoint.
              </p>
              <p>
                • <strong>Unresponsive Button:</strong> Upgrades action to
                double dispatch.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Audit Log Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>
                    Live Operation Audit Stream ({auditLog.length} Checks)
                  </span>
                </CardTitle>
                <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] font-mono">
                  Sub-Second Auditing
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <ScrollArea className="h-72 pr-2 space-y-2">
                <div className="space-y-2">
                  {auditLog.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border space-y-1.5 text-xs font-mono ${
                        item.status === "remedy_applied"
                          ? "bg-purple-950/40 border-purple-800/80"
                          : "bg-slate-950/70 border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            {item.timestamp}
                          </span>
                          <span className="text-slate-200 font-bold">
                            Step #{item.stepIndex}: {item.stepName}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] py-0 capitalize ${
                            item.status === "remedy_applied"
                              ? "text-purple-300 border-purple-700 bg-purple-950"
                              : "text-emerald-300 border-emerald-800 bg-emerald-950"
                          }`}
                        >
                          {item.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-300">
                        <span>Latency: {item.latencyMs}ms</span>
                        <span>
                          State Delta Advance:{" "}
                          {item.stateDeltaAdvancement ? "Yes" : "Stalled"}
                        </span>
                      </div>

                      {item.remedyAction && (
                        <div className="text-[10px] text-cyan-300 pt-1 border-t border-slate-800">
                          <strong>Remedy:</strong> {item.remedyAction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
