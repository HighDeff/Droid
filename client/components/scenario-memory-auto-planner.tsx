import React, { useState } from "react";
import {
  Brain,
  Sparkles,
  BookOpen,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  GitFork,
  Sliders,
  Shield,
  Layers,
  Database,
  History,
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
import { Input } from "@/components/ui/input";

export interface MemorizedScenario {
  id: string;
  name: string;
  category:
    | "auth"
    | "form_entry"
    | "captcha_solver"
    | "report_export"
    | "navigation";
  screenSignatureHash: string;
  matchScore: number;
  timesExecuted: number;
  successRate: number;
  optimalSequence: string[];
  fallbackBranches: Array<{ trigger: string; branchAction: string }>;
  averageDurationSeconds: number;
}

export const ScenarioMemoryAutoPlanner: React.FC = () => {
  const [scenarios, setScenarios] = useState<MemorizedScenario[]>([
    {
      id: "scen_1",
      name: "Enterprise Single Sign-On & 2FA Flow",
      category: "auth",
      screenSignatureHash: "sig_e89a_login",
      matchScore: 0.96,
      timesExecuted: 42,
      successRate: 97.6,
      optimalSequence: [
        "Focus Email Field (600, 450)",
        "Verified Char Typing",
        "Click Next CTA",
        "Wait for OTP Input",
        "Confirm Session Token",
      ],
      fallbackBranches: [
        {
          trigger: "OTP Expired Dialog",
          branchAction: "Click Resend Code & Extend Timeout",
        },
        {
          trigger: "Captcha Challenge",
          branchAction: "Route to Human Spline Puzzle Solver",
        },
      ],
      averageDurationSeconds: 4.8,
    },
    {
      id: "scen_2",
      name: "Batch Inventory Data Population",
      category: "form_entry",
      screenSignatureHash: "sig_f401_inventory",
      matchScore: 0.88,
      timesExecuted: 128,
      successRate: 99.2,
      optimalSequence: [
        "Clear Table Search",
        "Select Row 1",
        "Bulk Paste Quantities",
        "Save & Verify Toast",
      ],
      fallbackBranches: [
        {
          trigger: "Modal Confirmation Stalled",
          branchAction: "Dispatch Space Key + Double Click",
        },
      ],
      averageDurationSeconds: 6.2,
    },
    {
      id: "scen_3",
      name: "Complex Sliding Tile CAPTCHA Solver",
      category: "captcha_solver",
      screenSignatureHash: "sig_c992_slider",
      matchScore: 0.94,
      timesExecuted: 67,
      successRate: 95.5,
      optimalSequence: [
        "Capture Challenge Slice",
        "Calculate Gap Offset (dx)",
        "Human Spline Drag with Micro-Jitter",
        "Verify Green Checkmark",
      ],
      fallbackBranches: [
        {
          trigger: "Puzzle Recalculation Required",
          branchAction: "Click Refresh Icon and Rebound Step",
        },
      ],
      averageDurationSeconds: 3.4,
    },
  ]);

  const [activeScenarioId, setActiveScenarioId] = useState<string>("scen_1");
  const [newScenarioName, setNewScenarioName] = useState("");

  const activeScenario =
    scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const handleMemorizeCurrentState = () => {
    if (!newScenarioName) return;
    const newScen: MemorizedScenario = {
      id: `scen_${Date.now()}`,
      name: newScenarioName,
      category: "navigation",
      screenSignatureHash: `sig_${Math.random().toString(36).substring(2, 6)}`,
      matchScore: 1.0,
      timesExecuted: 1,
      successRate: 100.0,
      optimalSequence: [
        "Calibrate Anchor",
        "Execute Action Sequence",
        "Verify Visual Goal",
      ],
      fallbackBranches: [
        {
          trigger: "Layout Shift",
          branchAction: "Auto-Recalibrate Coordinates",
        },
      ],
      averageDurationSeconds: 3.0,
    };
    setScenarios((prev) => [newScen, ...prev]);
    setActiveScenarioId(newScen.id);
    setNewScenarioName("");
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Memorized Scenarios
              </p>
              <h4 className="text-xl font-bold text-cyan-400 font-mono">
                {scenarios.length} Profiles
              </h4>
            </div>
            <Brain className="w-8 h-8 text-cyan-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Signature Match Recall
              </p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                {(activeScenario.matchScore * 100).toFixed(0)}% Conf
              </h4>
            </div>
            <Sparkles className="w-8 h-8 text-emerald-500/40 animate-pulse" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Total Executions
              </p>
              <h4 className="text-xl font-bold text-purple-400 font-mono">
                {activeScenario.timesExecuted} Runs
              </h4>
            </div>
            <History className="w-8 h-8 text-purple-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Historical Reliability
              </p>
              <h4 className="text-xl font-bold text-amber-400 font-mono">
                {activeScenario.successRate}%
              </h4>
            </div>
            <CheckCircle2 className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Scenario Bank vs Auto-Plan Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Memorized Scenario Ledger Column */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Episodic Scenario Ledger</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Learned workflow profiles with pre-computed fast-path routes
            </CardDescription>
          </CardHeader>

          <CardContent className="p-3 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="New scenario title..."
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                className="h-8 text-xs bg-slate-950 border-slate-700"
              />
              <Button
                size="sm"
                onClick={handleMemorizeCurrentState}
                className="h-8 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Save
              </Button>
            </div>

            <ScrollArea className="h-80 pr-1 space-y-2">
              <div className="space-y-2">
                {scenarios.map((scen) => (
                  <div
                    key={scen.id}
                    onClick={() => setActiveScenarioId(scen.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      activeScenarioId === scen.id
                        ? "bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/40"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        {scen.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono py-0 text-cyan-300 border-cyan-800 bg-cyan-950"
                      >
                        {(scen.matchScore * 100).toFixed(0)}% Match
                      </Badge>
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-slate-300">
                      <span>Runs: {scen.timesExecuted}x</span>
                      <span>Success: {scen.successRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Optimal Plan & Auto-Rerouting Details */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>{activeScenario.name}</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-300 font-mono">
                    Screen Signature:{" "}
                    <strong className="text-purple-300">
                      {activeScenario.screenSignatureHash}
                    </strong>{" "}
                    | Avg Time: {activeScenario.averageDurationSeconds}s
                  </CardDescription>
                </div>

                <Button
                  size="sm"
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Execute Auto-Plan
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Optimal Sequence Breakdown */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">
                  Pre-Computed Optimal Path (
                  {activeScenario.optimalSequence.length} Steps):
                </span>
                <div className="space-y-1.5">
                  {activeScenario.optimalSequence.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2.5 text-xs font-mono"
                    >
                      <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fallback Branch Ledger */}
              <div className="p-3.5 bg-purple-950/30 rounded-xl border border-purple-900/60 space-y-2">
                <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <GitFork className="w-4 h-4 text-purple-400" />
                  <span>
                    Memorized Fallback Branches & Auto-Reroutes (
                    {activeScenario.fallbackBranches.length})
                  </span>
                </span>
                <div className="space-y-1.5">
                  {activeScenario.fallbackBranches.map((branch, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-900/90 border border-slate-800 text-xs font-mono flex items-center justify-between"
                    >
                      <span className="text-amber-300 font-bold">
                        On: {branch.trigger}
                      </span>
                      <span className="text-cyan-300">
                        Action: {branch.branchAction}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
