import React, { useState } from "react";
import {
  Target,
  Sparkles,
  Bot,
  Brain,
  Zap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  TrendingUp,
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
import { Progress } from "@/components/ui/progress";
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";
import { audioSynthesizer } from "@/lib/audio-synthesizer";

export interface AutonomousSubGoal {
  id: string;
  order: number;
  title: string;
  preconditionOcr: string;
  actionPayload: string;
  targetCoords: { x: number; y: number };
  status: "pending" | "executing" | "verified" | "healed";
  confidence: number;
  selfHealingTries: number;
}

interface AutonomousGoalAgentStudioProps {
  currentLiveScreenshot?: string;
  onDispatchAction?: (coords: { x: number; y: number }, action: string) => void;
}

export const AutonomousGoalAgentStudio: React.FC<
  AutonomousGoalAgentStudioProps
> = ({ currentLiveScreenshot, onDispatchAction }) => {
  const [goalText, setGoalText] = useState<string>(
    "Log in to Workspace, solve equation token, bypass interstitial modal, and export final analytics report",
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeSubGoalIdx, setActiveSubGoalIdx] = useState<number>(0);
  const [progressPct, setProgressPct] = useState<number>(35);

  const [subGoals, setSubGoals] = useState<AutonomousSubGoal[]>([
    {
      id: "sg_1",
      order: 1,
      title: "Ground Workspace Portal & Calibrate Focus",
      preconditionOcr: "Workspace Portal",
      actionPayload: "Click Center Focus",
      targetCoords: { x: 960, y: 320 },
      status: "verified",
      confidence: 0.98,
      selfHealingTries: 0,
    },
    {
      id: "sg_2",
      order: 2,
      title: "Synthesize & Enter Credentials Key",
      preconditionOcr: "Passcode Input",
      actionPayload: "Clear & Type 'quantum_key_01'",
      targetCoords: { x: 480, y: 380 },
      status: "executing",
      confidence: 0.95,
      selfHealingTries: 0,
    },
    {
      id: "sg_3",
      order: 3,
      title: "Detect & Neutralize Interstitial Obstacle Modal",
      preconditionOcr: "Ad Banner / Dialog",
      actionPayload: "Click Modal Backdrop (100, 100) + Escape Pulse",
      targetCoords: { x: 620, y: 380 },
      status: "pending",
      confidence: 0.92,
      selfHealingTries: 1,
    },
    {
      id: "sg_4",
      order: 4,
      title: "Submit Action & Commit Final Transition",
      preconditionOcr: "Submit Button",
      actionPayload: "Physical Human Click",
      targetCoords: { x: 740, y: 520 },
      status: "pending",
      confidence: 0.97,
      selfHealingTries: 0,
    },
  ]);

  const [statusLog, setStatusLog] = useState<string>(
    "Autonomous Goal Agent idle. Ready to plan and execute high-level goals.",
  );

  // Run autonomous loop
  const handleStartAutonomousGoal = () => {
    setIsRunning(true);
    audioSynthesizer.playThinkingSound();
    setStatusLog(
      "🤖 Autonomous Goal Loop initialized. Decomposing goal into verifiable milestones...",
    );

    setTimeout(() => {
      audioSynthesizer.playWaypointSound();
      setActiveSubGoalIdx(1);
      setProgressPct(60);
      setStatusLog(
        "⚡ Sub-goal #2 in progress: Typing credentials with physical human cadence...",
      );
    }, 1500);

    setTimeout(() => {
      audioSynthesizer.playSuccessSound();
      setActiveSubGoalIdx(2);
      setProgressPct(100);
      setIsRunning(false);
      setStatusLog(
        "🏆 Autonomous Goal Achieved! All milestones verified with zero false positives.",
      );
    }, 3500);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="goals"
        title="Autonomous Goal-Oriented AI Agent & Self-Healing Loop"
        badge={isRunning ? "AGENT ACTIVE ⚡" : "AGENT IDLE"}
        settings={[
          {
            id: "auto_heal",
            label: "Self-Healing Obstacle Recovery",
            type: "switch",
            value: true,
            description: "Auto-retry with backdrop click & escape",
          },
          {
            id: "visual_verify",
            label: "Visual Precondition Verification",
            type: "switch",
            value: true,
            description: "Confirm OCR token before dispatch",
          },
          {
            id: "audio_cues",
            label: "Cyberpunk Audio Feedback",
            type: "switch",
            value: !audioSynthesizer.isMuted,
            description: "Procedural sound cues on state changes",
          },
        ]}
        quickActions={[
          {
            label: isRunning ? "Pause Agent ⏸️" : "Launch Goal Agent 🚀",
            action: handleStartAutonomousGoal,
            variant: "default",
          },
          {
            label: "Reset Milestones",
            action: () => setProgressPct(0),
            variant: "secondary",
          },
        ]}
      />

      {/* Main Goal Configuration & Progress Card */}
      <Card className="bg-slate-900 border-cyan-500/40 shadow-2xl overflow-hidden">
        <CardHeader className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <div>
              <CardTitle className="text-sm font-bold text-slate-100">
                Autonomous Goal Objective & Milestone Decomposition Tree
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Cognitive loop: Perceive ➔ Plan ➔ Execute ➔ Validate Delta ➔
                Self-Heal
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleStartAutonomousGoal}
              className={`h-8 px-4 text-xs font-mono font-bold ${
                isRunning
                  ? "bg-amber-600 hover:bg-amber-500 text-white animate-pulse"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg"
              }`}
            >
              {isRunning ? (
                <Pause className="w-3.5 h-3.5 mr-1.5" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isRunning
                ? "Running Autonomous Loop..."
                : "Execute High-Level Goal 🚀"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Goal Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>High-Level Goal Objective:</span>
            </label>
            <Input
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              className="bg-slate-950 border-slate-700 text-xs font-mono text-cyan-200"
              placeholder="Describe your end goal..."
            />
          </div>

          {/* Goal Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Overall Goal Progress:</span>
              <strong className="text-cyan-300 font-bold">
                {progressPct}% Complete
              </strong>
            </div>
            <Progress value={progressPct} className="h-2 bg-slate-950" />
          </div>

          {/* Sub-Goal Decomposition Tree */}
          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-bold text-slate-300 block">
              Decomposed Sub-Goal Milestones ({subGoals.length}):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subGoals.map((sg, idx) => (
                <div
                  key={sg.id}
                  className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                    sg.status === "verified"
                      ? "bg-emerald-950/40 border-emerald-500/80"
                      : sg.status === "executing"
                        ? "bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/40 animate-pulse"
                        : "bg-slate-950 border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-cyan-300">
                        {sg.order}
                      </span>
                      <strong className="text-slate-100">{sg.title}</strong>
                    </div>
                    <Badge
                      className={`text-[9px] uppercase font-mono ${
                        sg.status === "verified"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : sg.status === "executing"
                            ? "bg-amber-950 text-amber-300 border-amber-800"
                            : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {sg.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-850">
                    <div>
                      <span>Precondition: </span>
                      <strong className="text-purple-300">
                        "{sg.preconditionOcr}"
                      </strong>
                    </div>
                    <div>
                      <span>Target: </span>
                      <strong className="text-cyan-300">
                        ({sg.targetCoords.x}, {sg.targetCoords.y})
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telemetry Status Bar */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
        <span>
          <strong>Autonomous Telemetry:</strong> {statusLog}
        </span>
        <span className="text-emerald-400 font-bold">
          Self-Healing Pipeline Ready ✓
        </span>
      </div>
    </div>
  );
};
