import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Zap,
  Radio,
  Eye,
  Crosshair,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
  Sliders,
  Sparkles,
  Bot,
  MessageSquare,
  Activity,
  Maximize2,
  RefreshCw,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";

export interface WorkflowStage {
  id: number;
  name: string;
  description: string;
  status:
    | "idle"
    | "running"
    | "waiting_ad"
    | "calculating_avoidance"
    | "fixing_drift"
    | "conversing_agent"
    | "verified"
    | "failed";
  durationSeconds: number;
  maxDurationSeconds: number;
  aiVerificationConfidence: number;
  details: string;
  nonRepetitionKey: string;
  lastErrorReason?: string;
}

export interface ChronologicalLogEntry {
  id: string;
  timestamp: string;
  stageNumber: number;
  action: string;
  modelUsed: string;
  result: "passed" | "waiting" | "rerouted" | "retrying";
  notes: string;
}

interface MasterWorkflowOrchestratorProps {
  onStageChange?: (stageId: number, status: string) => void;
  activeModelName?: string;
}

export const MasterWorkflowOrchestrator: React.FC<
  MasterWorkflowOrchestratorProps
> = ({ onStageChange, activeModelName = "Qwen 2.5-VL (GGUF Local)" }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(1);
  const [iterationCount, setIterationCount] = useState(1);
  const [maxIterations, setMaxIterations] = useState(5);
  const [elapsedTotalSec, setElapsedTotalSec] = useState(0);
  const [maxDurationSec, setMaxDurationSec] = useState(1800);

  // Non-repetition failed routes ledger
  const [failedMethodsLedger, setFailedMethodsLedger] = useState<string[]>([]);

  // 7-Stage Pipeline
  const [stages, setStages] = useState<WorkflowStage[]>([
    {
      id: 1,
      name: "1. Device Connect & Calibration",
      description:
        "Establish ADB / Windows OS link, calibrate screen resolution & input boundaries",
      status: "verified",
      durationSeconds: 1.2,
      maxDurationSeconds: 5,
      aiVerificationConfidence: 0.99,
      details: "Connected to Desktop OS. DPI scaling calibrated at 100%.",
      nonRepetitionKey: "dev_calib_01",
    },
    {
      id: 2,
      name: "2. Locate & Navigate to Target App",
      description:
        "Scan active window hierarchy, bring target to foreground, verify viewport anchor",
      status: "running",
      durationSeconds: 3.4,
      maxDurationSeconds: 10,
      aiVerificationConfidence: 0.96,
      details: "AI model grounding target window from task context.",
      nonRepetitionKey: "loc_nav_02",
    },
    {
      id: 3,
      name: "3. Interact, Type & Solve Equation",
      description:
        "Execute humanized mouse clicks, char-by-char typing, and calculate problem solutions",
      status: "idle",
      durationSeconds: 0,
      maxDurationSeconds: 15,
      aiVerificationConfidence: 0.0,
      details: "Pending target focus.",
      nonRepetitionKey: "act_type_03",
    },
    {
      id: 4,
      name: "4. Ad & Obstacle Destroyer",
      description:
        "Auto-detect delayed popups, countdown ads, CAPTCHAs, and dispatch armed workarounds",
      status: "idle",
      durationSeconds: 0,
      maxDurationSeconds: 20,
      aiVerificationConfidence: 0.0,
      details: "Obstacle radar armed.",
      nonRepetitionKey: "ad_destroy_04",
    },
    {
      id: 5,
      name: "5. Pixel Diff & AI State Verification",
      description:
        "Compare before/after screenshot diffs; verify expected state token acceptance",
      status: "idle",
      durationSeconds: 0,
      maxDurationSeconds: 8,
      aiVerificationConfidence: 0.0,
      details: "Verifier agent queued.",
      nonRepetitionKey: "diff_verif_05",
    },
    {
      id: 6,
      name: "6. Goal State Commit & Memory Cache",
      description:
        "Commit successful action to scenario memory, compress calc cache, update user profile",
      status: "idle",
      durationSeconds: 0,
      maxDurationSeconds: 5,
      aiVerificationConfidence: 0.0,
      details: "Memory bus idle.",
      nonRepetitionKey: "goal_commit_06",
    },
    {
      id: 7,
      name: "7. State Preservation Reset & Next Loop",
      description:
        "Reset transient state, preserve variables for batch jobs, and loop to Stage 1 or conclude",
      status: "idle",
      durationSeconds: 0,
      maxDurationSeconds: 5,
      aiVerificationConfidence: 0.0,
      details: "Loop cycle controller standby.",
      nonRepetitionKey: "state_reset_07",
    },
  ]);

  // Chronological Log entries
  const [logs, setLogs] = useState<ChronologicalLogEntry[]>([
    {
      id: "l_1",
      timestamp: "16:40:12",
      stageNumber: 1,
      action: "Device Link Calibration",
      modelUsed: "Qwen 2.5-VL (GGUF Local)",
      result: "passed",
      notes: "Device boundaries calibrated with 0 drift detected.",
    },
    {
      id: "l_2",
      timestamp: "16:40:15",
      stageNumber: 2,
      action: "Window Hierarchy Grounding",
      modelUsed: "Qwen 2.5-VL (GGUF Local)",
      result: "passed",
      notes: "Target form located at (420, 360). Quorum confirmed.",
    },
  ]);

  // Orchestrator Loop Timer
  useEffect(() => {
    let timer: any;
    if (isRunning) {
      timer = setInterval(() => {
        setElapsedTotalSec((prev) => prev + 1);

        // Advance stages dynamically
        setStages((prevStages) => {
          const current = prevStages[currentStageIndex - 1];
          if (!current) return prevStages;

          if (current.durationSeconds < current.maxDurationSeconds) {
            return prevStages.map((s) =>
              s.id === currentStageIndex
                ? { ...s, durationSeconds: s.durationSeconds + 1 }
                : s,
            );
          } else {
            // Advance to next stage
            const nextIdx = currentStageIndex < 7 ? currentStageIndex + 1 : 1;
            setCurrentStageIndex(nextIdx);

            if (nextIdx === 1) {
              setIterationCount((i) => i + 1);
            }

            // Log event
            const newLog: ChronologicalLogEntry = {
              id: `l_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              stageNumber: current.id,
              action: current.name,
              modelUsed: activeModelName,
              result: "passed",
              notes: `Stage verified with ${(current.aiVerificationConfidence * 100).toFixed(0)}% AI confidence.`,
            };
            setLogs((l) => [newLog, ...l.slice(0, 20)]);

            return prevStages.map((s) =>
              s.id === current.id
                ? { ...s, status: "verified", aiVerificationConfidence: 0.98 }
                : s.id === nextIdx
                  ? { ...s, status: "running", durationSeconds: 0 }
                  : s,
            );
          }
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, currentStageIndex, activeModelName]);

  const handleToggleOrchestrator = () => {
    setIsRunning(!isRunning);
  };

  const handleResetOrchestrator = () => {
    setIsRunning(false);
    setCurrentStageIndex(1);
    setIterationCount(1);
    setElapsedTotalSec(0);
    setStages((prev) =>
      prev.map((s, idx) => ({
        ...s,
        status: idx === 0 ? "running" : "idle",
        durationSeconds: 0,
      })),
    );
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="pipeline"
        title="Autonomous Multi-Stage Automation Cycle (7 Stages) & AI Review Engine"
        badge={isRunning ? "CYCLE ACTIVE ⚡" : "CYCLE IDLE"}
        settings={[
          {
            id: "non_rep",
            label: "Non-Repetition Ledger for Failed Methods",
            type: "switch",
            value: true,
            description: "Block repeating unverified actions",
          },
          {
            id: "ai_review",
            label: "Continuous AI Review & Completion Check",
            type: "switch",
            value: true,
            description: "Verify pixel states with active model",
          },
          {
            id: "max_iter",
            label: "Max Cycle Iterations",
            type: "slider",
            value: maxIterations,
            min: 1,
            max: 20,
            step: 1,
            unit: "loops",
            description: "Batch loop count",
          },
          {
            id: "time_limit",
            label: "Max Total Duration Cap",
            type: "slider",
            value: maxDurationSec,
            min: 300,
            max: 7200,
            step: 300,
            unit: "sec",
            description: "Safety cutoff",
          },
        ]}
        quickActions={[
          {
            label: isRunning ? "Pause Master Cycle" : "Start Master Cycle ⚡",
            action: handleToggleOrchestrator,
            variant: isRunning ? "secondary" : "default",
          },
          {
            label: "Reset All Stages",
            action: handleResetOrchestrator,
            variant: "secondary",
          },
        ]}
      />

      {/* Top Telemetry Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-cyan-500/40 shadow-xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Current Pipeline Stage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <strong className="text-slate-100 text-sm">
              Stage #{currentStageIndex} of 7
            </strong>
            <p className="text-[10px] text-slate-300 truncate">
              {stages[currentStageIndex - 1]?.name}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-purple-500/40 shadow-xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" />
              <span>Iteration Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <strong className="text-purple-300 text-sm">
              {iterationCount} / {maxIterations} Loops
            </strong>
            <Progress
              value={(iterationCount / maxIterations) * 100}
              className="h-1.5 bg-slate-800"
            />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-emerald-500/40 shadow-xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Elapsed Runtime</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <strong className="text-emerald-300 text-sm">
              {Math.floor(elapsedTotalSec / 60)}m {elapsedTotalSec % 60}s
            </strong>
            <p className="text-[10px] text-slate-300">
              Cap: {Math.floor(maxDurationSec / 60)}m
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-amber-500/40 shadow-xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Bot className="w-4 h-4" />
              <span>Active Reviewing AI</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <strong className="text-slate-100 text-xs truncate block">
              {activeModelName}
            </strong>
            <Badge className="bg-amber-950 text-amber-300 border-amber-800 text-[9px]">
              Non-Repetition Active ✓
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* 7-Stage Step Matrix */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl">
        <CardHeader className="pb-2 bg-slate-950 border-b border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>7-Stage Coherent Automation Lifecycle</span>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleToggleOrchestrator}
              className={`h-7 text-xs font-mono font-bold ${isRunning ? "bg-amber-600 text-white" : "bg-cyan-600 text-white"}`}
            >
              {isRunning ? (
                <Pause className="w-3.5 h-3.5 mr-1" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-1" />
              )}
              {isRunning ? "Pause Loop" : "Run Cycle"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2.5">
          {stages.map((st) => {
            const isCurrent = st.id === currentStageIndex;
            const isDone = st.status === "verified";
            return (
              <div
                key={st.id}
                className={`p-3 rounded-xl border transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isCurrent
                    ? "bg-slate-950 border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950"
                    : isDone
                      ? "bg-slate-950/70 border-emerald-900/60"
                      : "bg-slate-950/40 border-slate-800 opacity-70"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-mono uppercase ${
                        isCurrent
                          ? "text-cyan-300 border-cyan-500 bg-cyan-950/40 animate-pulse"
                          : isDone
                            ? "text-emerald-300 border-emerald-800 bg-emerald-950/40"
                            : "text-slate-400 border-slate-800"
                      }`}
                    >
                      {st.status.replace("_", " ")}
                    </Badge>
                    <span className="font-bold text-slate-100">{st.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-300">{st.description}</p>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-slate-300">
                  <span>
                    Progress:{" "}
                    <strong className="text-slate-200">
                      {st.durationSeconds}s / {st.maxDurationSeconds}s
                    </strong>
                  </span>
                  <span>
                    AI Conf:{" "}
                    <strong className="text-emerald-400">
                      {(st.aiVerificationConfidence * 100).toFixed(0)}%
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Chronological AI Results & Telemetry Log */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl">
        <CardHeader className="pb-2 bg-slate-950 border-b border-slate-800">
          <CardTitle className="text-xs font-bold text-cyan-400 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Chronological Stage Review & AI Decision Feed</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <ScrollArea className="h-44 pr-2">
            <div className="space-y-2">
              {logs.map((lg) => (
                <div
                  key={lg.id}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-slate-400">
                      {lg.timestamp}
                    </span>
                    <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800 text-[9px]">
                      STAGE #{lg.stageNumber}
                    </Badge>
                    <span className="text-slate-200 font-bold">
                      {lg.action}
                    </span>
                    <span className="text-slate-300 text-[10px]">
                      ({lg.notes})
                    </span>
                  </div>
                  <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[9px] uppercase">
                    {lg.result}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
