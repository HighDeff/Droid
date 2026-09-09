import React, { useState } from "react";
import {
  Brain,
  Eye,
  Crosshair,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Target,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export interface DetectedUIElement {
  id: string;
  name: string;
  type:
    | "button"
    | "input"
    | "icon"
    | "text"
    | "toggle"
    | "captcha"
    | "target"
    | "dialog"
    | "checkbox"
    | "other";
  boundingBox: { x: number; y: number; width: number; height: number };
  center: { x: number; y: number };
  confidence: number;
  interactive: boolean;
  textValue?: string;
}

export interface ScreenPerceptionReport {
  timestamp: number;
  screenDescription: string;
  activeWindow: string;
  visualStateChange: string;
  elements: DetectedUIElement[];
  feedbackPosition: { x: number; y: number };
  primarySuggestion: string;
  confidence: number;
}

export interface AIThinkingChain {
  observation: string;
  reasoning: string;
  strategy: string;
  confidence: number;
}

export interface SubTask {
  id: string;
  title: string;
  actionType:
    | "click"
    | "double_click"
    | "right_click"
    | "type_text"
    | "scroll"
    | "wait";
  targetName?: string;
  x?: number;
  y?: number;
  textPayload?: string;
  delayMs: number;
  status: "pending" | "in_progress" | "completed" | "failed";
}

export interface GoalNode {
  id: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  status: "pending" | "in_progress" | "completed" | "blocked";
  subtasks: SubTask[];
  category?:
    | "navigation"
    | "data_entry"
    | "captcha"
    | "interaction"
    | "verification";
}

export interface VerificationRule {
  expectedChange: string;
  targetRegion: { x: number; y: number; width: number; height: number };
  successCondition: string;
  retryStrategy: string;
  verified?: boolean;
}

export interface PlannerActDecision {
  timestamp: number;
  thinking: AIThinkingChain;
  goals: GoalNode[];
  nextAction: SubTask | null;
  verificationRule: VerificationRule | null;
  statusSummary: string;
}

interface DualAICopilotPanelProps {
  perception: ScreenPerceptionReport | null;
  plannerDecision: PlannerActDecision | null;
  isAutonomousRunning: boolean;
  isAnalyzing: boolean;
  userObjective: string;
  loopIntervalMs: number;
  onUserObjectiveChange: (obj: string) => void;
  onLoopIntervalChange: (ms: number) => void;
  onTriggerDescribe: () => void;
  onTriggerPlanAndAct: () => void;
  onToggleAutonomousLoop: () => void;
  onSelectElementTarget: (x: number, y: number, name: string) => void;
}

export const DualAICopilotPanel: React.FC<DualAICopilotPanelProps> = ({
  perception,
  plannerDecision,
  isAutonomousRunning,
  isAnalyzing,
  userObjective,
  loopIntervalMs,
  onUserObjectiveChange,
  onLoopIntervalChange,
  onTriggerDescribe,
  onTriggerPlanAndAct,
  onToggleAutonomousLoop,
  onSelectElementTarget,
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [isThinkingOpen, setIsThinkingOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"perception" | "planner">(
    "planner",
  );

  const filteredElements = (perception?.elements || []).filter((el) =>
    selectedTypeFilter === "all" ? true : el.type === selectedTypeFilter,
  );

  return (
    <div className="space-y-4">
      {/* Master Autonomous Co-Pilot Control Bar */}
      <Card className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/30 shadow-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Brain className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Dual-AI Autonomous Co-Pilot Pipeline</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                    Qwen 2.5-VL + Planner
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Perception Engine (AI #1) grounds screen elements • Reasoning
                  Planner (AI #2) reorganizes goals & verifies actions
                </p>
              </div>
            </div>

            {/* Controls - Active Across All Modes */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onTriggerDescribe}
                className="gap-1.5 text-xs border-cyan-500/50 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50 hover:text-cyan-100 font-bold"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                {isAnalyzing
                  ? "Scanning Viewport..."
                  : "Perceive Screen (AI #1)"}
              </Button>

              <Button
                size="sm"
                onClick={onTriggerPlanAndAct}
                className="gap-1.5 text-xs border border-purple-500/50 bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 font-bold shadow-md shadow-purple-950"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                Plan & Act (AI #2)
              </Button>

              <Button
                size="sm"
                onClick={onToggleAutonomousLoop}
                className={`gap-1.5 text-xs font-bold shadow-lg transition-all ${
                  isAutonomousRunning
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                }`}
              >
                {isAutonomousRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause Loop
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Run Autonomous Loop
                  </>
                )}
              </Button>

              {/* Dedicated Red Emergency Stop Button */}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (isAutonomousRunning) onToggleAutonomousLoop();
                }}
                className="gap-1.5 text-xs font-bold bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-950"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Emergency STOP
              </Button>
            </div>
          </div>

          {/* Goal Input & Cycle Interval Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800/80">
            <div className="md:col-span-2">
              <label className="text-[11px] font-mono text-slate-300 mb-1 block">
                Target User Objective / Task Prompt:
              </label>
              <Input
                value={userObjective}
                onChange={(e) => onUserObjectiveChange(e.target.value)}
                placeholder="e.g. Automatically solve the captcha verification and fill the customer invoice..."
                className="h-8 text-xs bg-slate-950/80 border-slate-700 text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1">
                <span>Autonomous Cycle Delay:</span>
                <span className="text-cyan-400 font-bold">
                  {loopIntervalMs} ms
                </span>
              </div>
              <Slider
                value={[loopIntervalMs]}
                min={500}
                max={5000}
                step={250}
                onValueChange={([val]) => onLoopIntervalChange(val)}
                className="w-full mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dual Column: AI #1 Perception vs AI #2 Reasoning Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ================= AI #1 QWEN VISION PERCEPTION ================= */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>AI #1: Qwen Vision Perception Feed</span>
              </CardTitle>
              {perception && (
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                  Conf: {(perception.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <CardDescription className="text-xs text-slate-300">
              Auto-description, UI element grounding & feedback positioning
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-3.5">
            {/* Screen Description Narrative */}
            <div>
              <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Screen Auto-Description Narrative</span>
              </label>
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed min-h-[60px]">
                {perception?.screenDescription ||
                  "Awaiting first visual perception sweep..."}
              </div>
            </div>

            {/* State Delta & Focus Point */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950/50 rounded border border-slate-800">
                <span className="text-slate-300 text-[10px] block">
                  Visual State Delta:
                </span>
                <span className="text-slate-200 font-semibold">
                  {perception?.visualStateChange || "Idle"}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/50 rounded border border-slate-800">
                <span className="text-slate-300 text-[10px] block">
                  Feedback Position:
                </span>
                <span className="text-cyan-300 font-semibold">
                  ({perception?.feedbackPosition.x || 960},{" "}
                  {perception?.feedbackPosition.y || 540})
                </span>
              </div>
            </div>

            {/* Detected Elements Catalog */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-mono text-slate-300">
                  Detected Elements ({filteredElements.length})
                </label>
                {/* Filter Selector */}
                <div className="flex gap-1">
                  {["all", "button", "input", "captcha", "target"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTypeFilter(t)}
                      className={`text-[10px] px-2 py-0.5 rounded capitalize font-mono transition-colors ${
                        selectedTypeFilter === t
                          ? "bg-cyan-500 text-black font-bold"
                          : "bg-slate-800 text-slate-300 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <ScrollArea className="h-48 rounded border border-slate-800 bg-slate-950/40 p-2">
                {filteredElements.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No elements found matching filter.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredElements.map((el) => (
                      <div
                        key={el.id}
                        onClick={() =>
                          onSelectElementTarget(
                            el.center.x,
                            el.center.y,
                            el.name,
                          )
                        }
                        className="p-2 bg-slate-900/80 hover:bg-slate-800/90 rounded border border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span className="font-semibold text-slate-200 group-hover:text-cyan-300">
                            {el.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 px-1 font-mono uppercase"
                          >
                            {el.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                          <span>
                            ({el.center.x}, {el.center.y})
                          </span>
                          <span className="text-cyan-400">
                            {(el.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* ================= AI #2 REASONING PLANNER & ACTOR ================= */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-purple-400 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>AI #2: Reasoning Planner & Verification</span>
              </CardTitle>
              {plannerDecision && (
                <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">
                  Thinking Conf:{" "}
                  {(plannerDecision.thinking.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <CardDescription className="text-xs text-slate-300">
              Chain-of-Thought reasoning, dynamic goal reorganization & action
              formulation
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-3.5">
            {/* Thinking Chain Accordion */}
            <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 overflow-hidden">
              <button
                onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-purple-300 bg-purple-950/40 hover:bg-purple-900/30 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>AI Thinking Process (Chain of Thought)</span>
                </div>
                {isThinkingOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {isThinkingOpen && (
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-300 text-[10px] block font-bold">
                      1. OBSERVATION:
                    </span>
                    <p className="text-slate-300">
                      {plannerDecision?.thinking.observation ||
                        "Analyzing environment elements..."}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-300 text-[10px] block font-bold">
                      2. REASONING:
                    </span>
                    <p className="text-slate-300">
                      {plannerDecision?.thinking.reasoning ||
                        "Deducing optimal path to user goal..."}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-300 text-[10px] block font-bold">
                      3. STRATEGY:
                    </span>
                    <p className="text-cyan-300">
                      {plannerDecision?.thinking.strategy ||
                        "Formulating sequence..."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Next Planned Action Card */}
            {plannerDecision?.nextAction && (
              <div className="p-3 bg-gradient-to-r from-slate-950 to-indigo-950/60 rounded-lg border border-indigo-500/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    Immediate Next Action
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {plannerDecision.nextAction.actionType}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-100">
                    {plannerDecision.nextAction.title}
                  </span>
                  <span className="font-mono text-cyan-300">
                    Pos: ({plannerDecision.nextAction.x},{" "}
                    {plannerDecision.nextAction.y}) •{" "}
                    {plannerDecision.nextAction.delayMs}ms
                  </span>
                </div>
              </div>
            )}

            {/* Verification Rule Card */}
            {plannerDecision?.verificationRule && (
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Action Verification Rule
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    Auto-Verified on Next Frame
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] mb-1">
                  <strong>Expected:</strong>{" "}
                  {plannerDecision.verificationRule.expectedChange}
                </p>
                <p className="text-slate-300 text-[10px] font-mono">
                  <strong>Retry Fallback:</strong>{" "}
                  {plannerDecision.verificationRule.retryStrategy}
                </p>
              </div>
            )}

            {/* Dynamic Goal Tree Reorganization */}
            <div>
              <label className="text-[11px] font-mono text-slate-300 mb-1.5 block">
                Active Goal & Task Tree ({(plannerDecision?.goals || []).length}{" "}
                Goals)
              </label>
              <ScrollArea className="h-44 rounded border border-slate-800 bg-slate-950/40 p-2">
                <div className="space-y-2">
                  {(plannerDecision?.goals || []).map((goal) => (
                    <div
                      key={goal.id}
                      className="p-2.5 bg-slate-900/90 rounded border border-slate-800"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-200">
                          {goal.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            P{goal.priority}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded capitalize ${
                              goal.status === "completed"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : goal.status === "in_progress"
                                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                                  : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {goal.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 mb-2">
                        {goal.description}
                      </p>

                      {/* Subtasks */}
                      {goal.subtasks && goal.subtasks.length > 0 && (
                        <div className="space-y-1 pl-2 border-l-2 border-slate-700">
                          {goal.subtasks.map((st) => (
                            <div
                              key={st.id}
                              className="flex items-center justify-between text-[10px] font-mono text-slate-300"
                            >
                              <span>• {st.title}</span>
                              <span className="text-slate-400">
                                {st.actionType}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
