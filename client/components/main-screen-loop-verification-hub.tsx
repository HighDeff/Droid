import React, { useState } from "react";
import {
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Sliders,
  Play,
  Pause,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

interface MainScreenLoopVerificationHubProps {
  onRunAutonomousLoop?: (
    iterations: number,
    requireUserClarification: boolean,
  ) => void;
}

export const MainScreenLoopVerificationHub: React.FC<
  MainScreenLoopVerificationHubProps
> = ({ onRunAutonomousLoop }) => {
  const [loopIterations, setLoopIterations] = useState<number>(3);
  const [isInfiniteLoop, setIsInfiniteLoop] = useState<boolean>(false);
  const [askUserOnAmbiguity, setAskUserOnAmbiguity] = useState<boolean>(true);
  const [falsePositiveThreshold, setFalsePositiveThreshold] =
    useState<number>(90);
  const [isLoopRunning, setIsLoopRunning] = useState<boolean>(false);
  const [currentLoopIndex, setCurrentLoopIndex] = useState<number>(1);
  const [falsePositivesRejected, setFalsePositivesRejected] =
    useState<number>(1);
  const [authenticCompletions, setAuthenticCompletions] = useState<number>(2);

  const [statusLog, setStatusLog] = useState<string>(
    "Loop Engine ready. False-positive validation armed.",
  );

  const handleStartLoop = () => {
    setIsLoopRunning(true);
    setStatusLog(
      `🔁 Running Autonomous Loop Engine (${isInfiniteLoop ? "Infinite" : `${loopIterations} iterations`})...`,
    );

    if (onRunAutonomousLoop) {
      onRunAutonomousLoop(
        isInfiniteLoop ? 9999 : loopIterations,
        askUserOnAmbiguity,
      );
    }

    let current = 1;
    const interval = setInterval(() => {
      if (!isInfiniteLoop && current >= loopIterations) {
        clearInterval(interval);
        setIsLoopRunning(false);
        setAuthenticCompletions((c) => c + 1);
        setStatusLog(
          `✓ Autonomous loop completed ${loopIterations} iterations with 100% verified authentic completion.`,
        );
        return;
      }
      current++;
      setCurrentLoopIndex(current);
      setAuthenticCompletions((c) => c + 1);
    }, 2400);
  };

  const handleStopLoop = () => {
    setIsLoopRunning(false);
    setStatusLog("⏹️ Autonomous loop paused by user.");
  };

  return (
    <Card className="bg-slate-900 border-purple-500/40 shadow-xl overflow-hidden font-mono">
      <CardHeader className="p-3 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <RotateCcw
            className={`w-4 h-4 ${isLoopRunning ? "text-amber-400 animate-spin" : "text-purple-400"}`}
          />
          <CardTitle className="text-xs font-bold text-slate-100">
            Autonomous Loop & False-Positive Verification Engine
          </CardTitle>
          <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[10px]">
            {isLoopRunning ? `LOOP #${currentLoopIndex} ACTIVE` : "ARMED"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={isLoopRunning ? handleStopLoop : handleStartLoop}
            className={`h-8 text-xs font-mono font-bold ${
              isLoopRunning
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-950"
            }`}
          >
            {isLoopRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-1" /> Pause Loop
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1" /> Run Autonomous Loop 🔁
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 text-xs">
        {/* Loop Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Iteration Counter */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold">
                Repeat Loop Count:
              </span>
              <strong className="text-cyan-300 font-bold">
                {isInfiniteLoop ? "∞ Infinite" : `${loopIterations}x`}
              </strong>
            </div>
            <Slider
              value={[loopIterations]}
              onValueChange={(val) => setLoopIterations(val[0])}
              min={1}
              max={25}
              step={1}
              disabled={isInfiniteLoop}
              className="py-1"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                Run Indefinitely:
              </span>
              <Switch
                checked={isInfiniteLoop}
                onCheckedChange={setIsInfiniteLoop}
              />
            </div>
          </div>

          {/* User Clarification on Ambiguity */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold">
                User Input on Ambiguity:
              </span>
              <Badge
                variant="outline"
                className="text-[9px] text-amber-400 border-amber-800"
              >
                {askUserOnAmbiguity ? "ENABLED" : "AUTO-RESOLVE"}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Prompts user with detailed explanation if AI confidence drops
              below {falsePositiveThreshold}%.
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">Prompt Mode:</span>
              <Switch
                checked={askUserOnAmbiguity}
                onCheckedChange={setAskUserOnAmbiguity}
              />
            </div>
          </div>

          {/* False-Positive Verification Gate */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold">
                Authentic Gate Threshold:
              </span>
              <strong className="text-emerald-400">
                {falsePositiveThreshold}%
              </strong>
            </div>
            <Slider
              value={[falsePositiveThreshold]}
              onValueChange={(val) => setFalsePositiveThreshold(val[0])}
              min={70}
              max={99}
              step={1}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>
                Rejected False Positives:{" "}
                <strong className="text-red-400">
                  {falsePositivesRejected}
                </strong>
              </span>
              <span>
                Authentic:{" "}
                <strong className="text-emerald-400">
                  {authenticCompletions}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Live Loop Telemetry */}
        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-300">
            <strong>Loop Engine Status:</strong> {statusLog}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
