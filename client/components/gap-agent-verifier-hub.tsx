import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Zap,
  RotateCcw,
  Play,
  Terminal,
  Activity,
  Layers,
  Sliders,
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
import { ScrollArea } from "@/components/ui/scroll-area";

export interface GapPlannedStep {
  id: string;
  stepNumber: number;
  command: string;
  expectedText?: string;
  status: "completed" | "verified" | "gap_detected" | "pending";
}

export const GapAgentVerifierHub: React.FC = () => {
  const [plannedSteps, setPlannedSteps] = useState<GapPlannedStep[]>([
    {
      id: "s1",
      stepNumber: 1,
      command: "MOVE 600,450",
      expectedText: "Username",
      status: "verified",
    },
    {
      id: "s2",
      stepNumber: 2,
      command: "TYPE user_admin",
      expectedText: "user_admin",
      status: "verified",
    },
    {
      id: "s3",
      stepNumber: 3,
      command: "CLICK 960,742",
      expectedText: "Submit Success",
      status: "gap_detected",
    },
    {
      id: "s4",
      stepNumber: 4,
      command: "VERIFY Welcome Dashboard",
      expectedText: "Welcome Dashboard",
      status: "pending",
    },
  ]);

  const [gapWarningMessage, setGapWarningMessage] = useState(
    "The following step was not verified by OCR: Step #3 (CLICK 960,742 -> Expected 'Submit Success'). Auto-Retry Prompt Formulated.",
  );

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                VerifierAgent Status
              </p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                Active (OCR)
              </h4>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                GapAgent Watcher
              </p>
              <h4 className="text-xl font-bold text-amber-400 font-mono">
                1 Gap Flagged
              </h4>
            </div>
            <ShieldAlert className="w-8 h-8 text-amber-500/40 animate-pulse" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Structured Parser
              </p>
              <h4 className="text-xl font-bold text-cyan-400 font-mono">
                11 Opcodes
              </h4>
            </div>
            <Terminal className="w-8 h-8 text-cyan-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                FailSafe Abort
              </p>
              <h4 className="text-xl font-bold text-purple-400 font-mono">
                Top-Left (0,0)
              </h4>
            </div>
            <Crosshair className="w-8 h-8 text-purple-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Main Gap & Verifier Table Card */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Planned Steps vs Completed Verification Stream</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Audits each AI command, verifies post-action OCR result, and
                catches missing action gaps
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {plannedSteps.map((s) => (
            <div
              key={s.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                s.status === "gap_detected"
                  ? "bg-amber-950/40 border-amber-800/80"
                  : s.status === "verified"
                    ? "bg-slate-950/80 border-emerald-800/80"
                    : "bg-slate-950/60 border-slate-800"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-100 font-bold">
                    Step #{s.stepNumber}: {s.command}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] py-0 capitalize ${
                      s.status === "gap_detected"
                        ? "text-amber-300 border-amber-700 bg-amber-950"
                        : "text-emerald-300 border-emerald-800 bg-emerald-950"
                    }`}
                  >
                    {s.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                {s.expectedText && (
                  <p className="text-[10px] text-slate-300">
                    OCR Verification Target:{" "}
                    <strong className="text-cyan-300">
                      "{s.expectedText}"
                    </strong>
                  </p>
                )}
              </div>

              {s.status === "gap_detected" && (
                <Button
                  size="sm"
                  className="h-7 text-[10px] bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Retry Step
                </Button>
              )}
            </div>
          ))}

          {/* Gap Prompt Alert Box */}
          <div className="p-3.5 bg-amber-950/30 rounded-xl border border-amber-900/60 text-xs font-mono space-y-1">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>GapAgent Auto-Formulated Retry Payload:</span>
            </span>
            <p className="text-slate-300">{gapWarningMessage}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
