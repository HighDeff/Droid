import React, { useState } from "react";
import {
  Target,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  ShieldAlert,
  Zap,
  Sliders,
  Settings,
  Eye,
  Crosshair,
  TrendingUp,
  Workflow,
  FileCode,
  Check,
  ChevronRight,
  ChevronDown,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";

export interface ComplexGoal {
  id: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
  category:
    | "navigation"
    | "combat"
    | "data_entry"
    | "captcha"
    | "verification"
    | "resource";
  targetRegion: { x: number; y: number; width: number; height: number };
  targetCenter: { x: number; y: number };
  targetLabel: string;
  policy: {
    mode: "autonomous" | "step_by_step" | "fast_paced" | "strict_verification";
    maxRetries: number;
    timeoutSeconds: number;
    requireVisualConfirmation: boolean;
    autoTriggerOnCaptcha: boolean;
  };
  dependencies: string[];
  subtasks: Array<{
    id: string;
    title: string;
    action: string;
    status: "pending" | "running" | "completed" | "failed";
  }>;
  progressPercent: number;
}

interface GoalsManagerPanelProps {
  screenshotUrl?: string;
  goals?: ComplexGoal[];
  onAddGoal?: (goal: ComplexGoal) => void;
  onUpdateGoal?: (id: string, updates: Partial<ComplexGoal>) => void;
  onDeleteGoal?: (id: string) => void;
  onExecuteGoal?: (id: string) => void;
  onSelectTargetCoordinates?: (x: number, y: number) => void;
}

export const GoalsManagerPanel: React.FC<GoalsManagerPanelProps> = ({
  screenshotUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
  goals: propGoals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onExecuteGoal,
  onSelectTargetCoordinates,
}) => {
  const defaultGoals: ComplexGoal[] = [
    {
      id: "goal_auth_submit",
      title: "G-1: Complete Form Authentication & Advance to Main Workspace",
      description:
        "Locate passcode inputs, execute char-by-char verification typing, and trigger Submit CTA",
      priority: 1,
      status: "in_progress",
      category: "data_entry",
      targetRegion: { x: 400, y: 300, width: 400, height: 260 },
      targetCenter: { x: 600, y: 430 },
      targetLabel: "Auth Container",
      policy: {
        mode: "strict_verification",
        maxRetries: 3,
        timeoutSeconds: 30,
        requireVisualConfirmation: true,
        autoTriggerOnCaptcha: true,
      },
      dependencies: [],
      subtasks: [
        {
          id: "sub_1",
          title: "Focus Passcode Field",
          action: "click",
          status: "completed",
        },
        {
          id: "sub_2",
          title: "Type Credentials with Validation",
          action: "type",
          status: "running",
        },
        {
          id: "sub_3",
          title: "Click Submit & Validate Response",
          action: "click",
          status: "pending",
        },
      ],
      progressPercent: 65,
    },
    {
      id: "goal_bypass_ad",
      title: "G-2: Neutralize Dynamic Popovers & Interstitial Overlays",
      description:
        "Track countdown timers, auto-escape overlays, and locate delayed 'X' close buttons",
      priority: 2,
      status: "pending",
      category: "captcha",
      targetRegion: { x: 750, y: 100, width: 350, height: 300 },
      targetCenter: { x: 925, y: 250 },
      targetLabel: "Ad Frame",
      policy: {
        mode: "fast_paced",
        maxRetries: 5,
        timeoutSeconds: 15,
        requireVisualConfirmation: false,
        autoTriggerOnCaptcha: true,
      },
      dependencies: ["goal_auth_submit"],
      subtasks: [
        {
          id: "sub_4",
          title: "Scan for Close Target",
          action: "ocr_verify",
          status: "pending",
        },
        {
          id: "sub_5",
          title: "Click Close / Key Esc",
          action: "click",
          status: "pending",
        },
      ],
      progressPercent: 20,
    },
  ];

  const [internalGoals, setInternalGoals] = useState<ComplexGoal[]>(
    propGoals || defaultGoals,
  );
  const goals = propGoals || internalGoals;
  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    goals[0]?.id || "",
  );
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeView, setActiveView] = useState<"list" | "dag" | "policy">(
    "list",
  );
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);

  // New Goal Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] =
    useState<ComplexGoal["category"]>("navigation");
  const [newPriority, setNewPriority] = useState<ComplexGoal["priority"]>(2);
  const [newTargetX, setNewTargetX] = useState(960);
  const [newTargetY, setNewTargetY] = useState(540);
  const [newTargetW, setNewTargetW] = useState(120);
  const [newTargetH, setNewTargetH] = useState(40);
  const [newTargetLabel, setNewTargetLabel] = useState("Target Button");
  const [newPolicyMode, setNewPolicyMode] =
    useState<ComplexGoal["policy"]["mode"]>("autonomous");

  const selectedGoal = goals.find((g) => g.id === selectedGoalId) || goals[0];

  const handleCreateGoal = () => {
    if (!newTitle.trim()) return;
    const goalId = `goal_${Date.now()}`;
    const newGoal: ComplexGoal = {
      id: goalId,
      title: newTitle,
      description: newDesc || "Custom user defined automation goal",
      priority: newPriority,
      status: "pending",
      category: newCategory,
      targetRegion: {
        x: newTargetX,
        y: newTargetY,
        width: newTargetW,
        height: newTargetH,
      },
      targetCenter: {
        x: newTargetX + Math.round(newTargetW / 2),
        y: newTargetY + Math.round(newTargetH / 2),
      },
      targetLabel: newTargetLabel || newTitle,
      policy: {
        mode: newPolicyMode,
        maxRetries: 3,
        timeoutSeconds: 15,
        requireVisualConfirmation: true,
        autoTriggerOnCaptcha: newCategory === "captcha",
      },
      dependencies: [],
      subtasks: [
        {
          id: `sub_${Date.now()}_1`,
          title: `Locate ${newTargetLabel}`,
          action: "search",
          status: "pending",
        },
        {
          id: `sub_${Date.now()}_2`,
          title: `Execute Interaction at (${newTargetX}, ${newTargetY})`,
          action: "click",
          status: "pending",
        },
        {
          id: `sub_${Date.now()}_3`,
          title: "Verify Outcome & Settle State",
          action: "verify",
          status: "pending",
        },
      ],
      progressPercent: 0,
    };
    onAddGoal(newGoal);
    setSelectedGoalId(goalId);
    setIsCreatingGoal(false);
    setNewTitle("");
    setNewDesc("");
  };

  const filteredGoals = goals.filter((g) =>
    filterCategory === "all" ? true : g.category === filterCategory,
  );

  const completedCount = goals.filter((g) => g.status === "completed").length;
  const inProgressCount = goals.filter(
    (g) => g.status === "in_progress",
  ).length;
  const avgProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce((acc, g) => acc + g.progressPercent, 0) / goals.length,
        )
      : 0;

  return (
    <div className="space-y-4">
      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="goals"
        title="Autonomous Goal Manager & Decomposition Engine"
        badge="Hierarchy DAG Active"
        settings={[
          {
            id: "auto_decompose",
            label: "Auto-Decompose Goals to Subtasks",
            type: "switch",
            value: true,
            description: "Break complex objectives into atomic steps",
          },
          {
            id: "parallel_execution",
            label: "Parallel Sub-Goal Dispatch",
            type: "switch",
            value: false,
            description: "Execute independent goals concurrently",
          },
          {
            id: "confidence_threshold",
            label: "Goal Completion Cutoff",
            type: "slider",
            value: 90,
            min: 50,
            max: 99,
            step: 1,
            unit: "%",
            description: "Verification bar",
          },
          {
            id: "retry_on_fail",
            label: "Milestone Auto-Failover Policy",
            type: "switch",
            value: true,
            description: "Reroute branch on step block",
          },
        ]}
        quickActions={[
          { label: "Auto-Plan All", action: () => {}, variant: "default" },
          { label: "Reset Objectives", action: () => {}, variant: "secondary" },
        ]}
      />
      {/* Top Analytics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800 shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Total Active Goals
              </p>
              <h4 className="text-xl font-bold text-slate-100">
                {goals.length}
              </h4>
            </div>
            <Target className="w-8 h-8 text-cyan-400/50" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                In Progress / Executing
              </p>
              <h4 className="text-xl font-bold text-amber-400">
                {inProgressCount}
              </h4>
            </div>
            <Zap className="w-8 h-8 text-amber-400/50" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Completed Objectives
              </p>
              <h4 className="text-xl font-bold text-emerald-400">
                {completedCount}
              </h4>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-400/50" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Average Completion
              </p>
              <h4 className="text-xl font-bold text-purple-400">
                {avgProgress}%
              </h4>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400/50" />
          </CardContent>
        </Card>
      </div>

      {/* Main Command Center Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Goals List & Filter */}
        <div className="xl:col-span-1 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-cyan-400" />
                    <span>Goal Hierarchy & Backlog</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-300">
                    Prioritized objectives & execution rules
                  </CardDescription>
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsCreatingGoal(!isCreatingGoal)}
                  className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Goal
                </Button>
              </div>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap gap-1 mt-2">
                {[
                  "all",
                  "navigation",
                  "combat",
                  "data_entry",
                  "captcha",
                  "verification",
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`text-[10px] px-2 py-0.5 rounded capitalize font-mono transition-colors ${
                      filterCategory === cat
                        ? "bg-cyan-500 text-black font-bold"
                        : "bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-3">
              <ScrollArea className="h-[520px] pr-2">
                <div className="space-y-2.5">
                  {filteredGoals.map((goal) => {
                    const isSelected = selectedGoal?.id === goal.id;
                    return (
                      <div
                        key={goal.id}
                        onClick={() => setSelectedGoalId(goal.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50"
                            : "bg-slate-800/30 border-slate-700/60 hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span className="font-bold text-xs text-slate-200">
                              {goal.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300">
                              P{goal.priority}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded capitalize ${
                                goal.status === "completed"
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                  : goal.status === "in_progress"
                                    ? "bg-amber-950 text-amber-300 border border-amber-800 animate-pulse"
                                    : "bg-slate-900 text-slate-300"
                              }`}
                            >
                              {goal.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-2 mb-2">
                          {goal.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-slate-300">
                            <span>Target: {goal.targetLabel}</span>
                            <span className="text-cyan-400">
                              {goal.progressPercent}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                              style={{ width: `${goal.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Columns: Goal Details, Visual Target Preview Canvas & Policy Tuning */}
        <div className="xl:col-span-2 space-y-4">
          {isCreatingGoal ? (
            /* Create New Goal Builder Form */
            <Card className="bg-slate-900 border-slate-800 shadow-xl">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Configure New Automation Goal</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-300">
                  Set visual target anchor coordinates, trigger rules, and
                  failover policy
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-slate-300 mb-1 block">
                      Goal Title:
                    </label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Solve Visual CAPTCHA Challenge"
                      className="bg-slate-950 border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-300 mb-1 block">
                      Category:
                    </label>
                    <Select
                      value={newCategory}
                      onValueChange={(val: any) => setNewCategory(val)}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-xs">
                        <SelectItem value="navigation">
                          🧭 Navigation & Exploration
                        </SelectItem>
                        <SelectItem value="combat">
                          ⚔️ Combat & Action Sequence
                        </SelectItem>
                        <SelectItem value="data_entry">
                          ⌨️ Form & Data Entry
                        </SelectItem>
                        <SelectItem value="captcha">
                          🛡️ CAPTCHA Auto-Solver
                        </SelectItem>
                        <SelectItem value="verification">
                          🔍 State Verification
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 mb-1 block">
                    Description & Intent:
                  </label>
                  <Input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Describe expected precondition, target element action, and success condition..."
                    className="bg-slate-950 border-slate-700 text-xs"
                  />
                </div>

                {/* Target Geometry Grid */}
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5" />
                      Visual Anchor Coordinates (1920x1080)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Normalized Screen Space
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-slate-300 block mb-0.5">
                        X Pos:
                      </label>
                      <Input
                        type="number"
                        value={newTargetX}
                        onChange={(e) =>
                          setNewTargetX(parseInt(e.target.value) || 0)
                        }
                        className="h-7 text-xs font-mono bg-slate-900 border-slate-700 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-300 block mb-0.5">
                        Y Pos:
                      </label>
                      <Input
                        type="number"
                        value={newTargetY}
                        onChange={(e) =>
                          setNewTargetY(parseInt(e.target.value) || 0)
                        }
                        className="h-7 text-xs font-mono bg-slate-900 border-slate-700 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-300 block mb-0.5">
                        Width:
                      </label>
                      <Input
                        type="number"
                        value={newTargetW}
                        onChange={(e) =>
                          setNewTargetW(parseInt(e.target.value) || 0)
                        }
                        className="h-7 text-xs font-mono bg-slate-900 border-slate-700 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-300 block mb-0.5">
                        Height:
                      </label>
                      <Input
                        type="number"
                        value={newTargetH}
                        onChange={(e) =>
                          setNewTargetH(parseInt(e.target.value) || 0)
                        }
                        className="h-7 text-xs font-mono bg-slate-900 border-slate-700 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsCreatingGoal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateGoal}
                    className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                  >
                    Save & Activate Goal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedGoal ? (
            /* Active Goal Inspection & Visual Target Preview Canvas */
            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-slate-100">
                          {selectedGoal.title}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono uppercase"
                        >
                          {selectedGoal.category}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-slate-300 mt-1">
                        {selectedGoal.description}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => onExecuteGoal(selectedGoal.id)}
                        className="gap-1.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg"
                      >
                        <Play className="w-3.5 h-3.5" /> Execute Goal
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          onUpdateGoal(selectedGoal.id, {
                            status:
                              selectedGoal.status === "completed"
                                ? "pending"
                                : "completed",
                            progressPercent:
                              selectedGoal.status === "completed" ? 0 : 100,
                          })
                        }
                        className="text-xs text-emerald-400 hover:bg-emerald-950/40"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Done
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDeleteGoal(selectedGoal.id)}
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Visual Goal Target Preview Canvas */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Visual Goal Anchor & Target Region Preview
                      </label>
                      <span className="text-[11px] font-mono text-slate-300">
                        Anchor: ({selectedGoal.targetRegion.x},{" "}
                        {selectedGoal.targetRegion.y}) [
                        {selectedGoal.targetRegion.width}x
                        {selectedGoal.targetRegion.height}px]
                      </span>
                    </div>

                    <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-slate-700">
                      {screenshotUrl ? (
                        <img
                          src={screenshotUrl}
                          alt="Target Preview"
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-mono text-xs">
                          Live Feed Connected
                        </div>
                      )}

                      {/* Highlighted Bounding Box for Goal Target */}
                      <div
                        style={{
                          left: `${(selectedGoal.targetRegion.x / 1920) * 100}%`,
                          top: `${(selectedGoal.targetRegion.y / 1080) * 100}%`,
                          width: `${Math.max(3, (selectedGoal.targetRegion.width / 1920) * 100)}%`,
                          height: `${Math.max(3, (selectedGoal.targetRegion.height / 1080) * 100)}%`,
                        }}
                        className="absolute border-2 border-amber-400 bg-amber-500/20 rounded shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse"
                      >
                        <div className="absolute -top-5 left-0 bg-slate-950/95 border border-amber-400 px-1.5 py-0.5 rounded text-[9px] font-mono text-amber-300 whitespace-nowrap shadow-md">
                          🎯 {selectedGoal.targetLabel}
                        </div>
                      </div>

                      {/* Center Crosshair Marker */}
                      <div
                        style={{
                          left: `${(selectedGoal.targetCenter.x / 1920) * 100}%`,
                          top: `${(selectedGoal.targetCenter.y / 1080) * 100}%`,
                        }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      >
                        <div className="w-6 h-6 border border-dashed border-cyan-400 rounded-full animate-spin flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subtask Execution Breakdown */}
                  <div>
                    <label className="text-xs font-mono text-slate-300 mb-2 block font-bold">
                      Subtask Execution Sequence ({selectedGoal.subtasks.length}{" "}
                      Steps)
                    </label>
                    <div className="space-y-1.5">
                      {selectedGoal.subtasks.map((st, i) => (
                        <div
                          key={st.id}
                          className="p-2.5 bg-slate-950/70 rounded border border-slate-800 flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center font-bold">
                              {i + 1}
                            </span>
                            <span className="text-slate-200">{st.title}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-[9px] py-0"
                            >
                              {st.action}
                            </Badge>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${
                                st.status === "completed"
                                  ? "text-emerald-400 bg-emerald-950"
                                  : "text-slate-300 bg-slate-900"
                              }`}
                            >
                              {st.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Policy & Failover Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
                    <div className="p-2.5 bg-slate-950/50 rounded border border-slate-800">
                      <span className="text-slate-300 text-[10px] block">
                        Execution Mode:
                      </span>
                      <span className="text-cyan-300 font-bold capitalize">
                        {selectedGoal.policy.mode}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-950/50 rounded border border-slate-800">
                      <span className="text-slate-300 text-[10px] block">
                        Max Retries:
                      </span>
                      <span className="text-amber-300 font-bold">
                        {selectedGoal.policy.maxRetries} Attempts
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-950/50 rounded border border-slate-800">
                      <span className="text-slate-300 text-[10px] block">
                        Timeout Threshold:
                      </span>
                      <span className="text-slate-200 font-bold">
                        {selectedGoal.policy.timeoutSeconds}s
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
