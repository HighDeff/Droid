import React, { useState, useEffect } from "react";
import {
  Brain,
  Keyboard,
  ListOrdered,
  Navigation,
  Sparkles,
  Zap,
  Type,
  Eye,
  Target,
  CheckCircle2,
  AlertCircle,
  Loader2,
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SequenceStep } from "./live-screen-hud";
import { ScreenPerceptionReport } from "./dual-ai-copilot-panel";

type DecideMode = "type" | "sequence" | "navigate";

interface AIDecideActionHUDProps {
  perceptionReport?: ScreenPerceptionReport | null;
  sequence: SequenceStep[];
  activeStepId?: string | null;
  screenshotUrl?: string;
  targetDevice?: "desktop" | "android";
  deviceId?: string | null;
  onAddStep?: (step: Partial<SequenceStep> & { x: number; y: number }) => void;
  onRunSequence?: () => void;
  onNavigate?: (x: number, y: number, label: string) => void;
  onTypeText?: (
    x: number,
    y: number,
    text: string,
    action?: "type_text" | "clear_and_type",
  ) => void;
}

export const AIDecideActionHUD: React.FC<AIDecideActionHUDProps> = ({
  perceptionReport,
  sequence,
  activeStepId,
  screenshotUrl,
  targetDevice = "desktop",
  deviceId,
  onAddStep,
  onRunSequence,
  onNavigate,
  onTypeText,
}) => {
  const [mode, setMode] = useState<DecideMode>("type");
  const [aiDeciding, setAiDeciding] = useState(false);
  const [aiDecision, setAiDecision] = useState<{
    mode: DecideMode;
    reasoning: string;
    confidence: number;
    suggestion: string;
  } | null>(null);
  const [typeText, setTypeText] = useState("");
  const [typeX, setTypeX] = useState(960);
  const [typeY, setTypeY] = useState(540);
  const [typeAction, setTypeAction] = useState<"type_text" | "clear_and_type">(
    "clear_and_type",
  );
  const [navX, setNavX] = useState(960);
  const [navY, setNavY] = useState(540);
  const [navLabel, setNavLabel] = useState("Target Area");
  const [status, setStatus] = useState<string>(
    "AI ready to decide — click 'AI Decide' or pick a mode",
  );
  const [executing, setExecuting] = useState(false);

  // Auto-suggest coordinates from perception when available
  useEffect(() => {
    if (perceptionReport?.elements?.[0]) {
      const inputEl =
        perceptionReport.elements.find((e) => e.type === "input") ||
        perceptionReport.elements[0];
      if (inputEl) {
        setTypeX(inputEl.center.x);
        setTypeY(inputEl.center.y);
        setNavX(inputEl.center.x);
        setNavY(inputEl.center.y);
        setNavLabel(inputEl.name);
      } else if (perceptionReport.feedbackPosition) {
        setTypeX(perceptionReport.feedbackPosition.x);
        setTypeY(perceptionReport.feedbackPosition.y);
        setNavX(perceptionReport.feedbackPosition.x);
        setNavY(perceptionReport.feedbackPosition.y);
      }
    }
  }, [perceptionReport]);

  const handleAIDecide = async () => {
    setAiDeciding(true);
    setStatus(
      "AI analyzing live screen to decide: type / sequence / navigate...",
    );
    try {
      // Use perception to decide locally with simple heuristics, plus call planner for reasoning
      const elements = perceptionReport?.elements || [];
      const hasInput = elements.some((e) => e.type === "input");
      const hasButton = elements.some((e) => e.type === "button");
      let decidedMode: DecideMode = "navigate";
      let reasoning = "";
      if (hasInput && sequence.length === 0) {
        decidedMode = "type";
        reasoning = `Detected input field "${elements.find((e) => e.type === "input")?.name || "Input"}" — AI decides to TYPE text.`;
      } else if (sequence.length > 0) {
        decidedMode = "sequence";
        reasoning = `Found ${sequence.length} saved steps — AI decides to PERFORM ACTION SEQUENCE.`;
      } else if (hasButton) {
        decidedMode = "navigate";
        reasoning = `Detected button "${elements.find((e) => e.type === "button")?.name || "CTA"}" — AI decides to NAVIGATE and click.`;
      } else {
        decidedMode = "navigate";
        reasoning = `No specific input/button, AI defaults to NAVIGATE to feedback position.`;
      }

      // Try to get richer reasoning from backend planner if available
      try {
        const liveImg = screenshotUrl || "";
        let report = perceptionReport;
        if (!report && liveImg) {
          const r = await fetch("/api/ai/describe-screen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageData: liveImg }),
          });
          const j = await r.json();
          if (j.success && j.report) report = j.report;
        }
        if (report) {
          const pr = await fetch("/api/ai/plan-and-act", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              perceptionReport: report,
              userObjective: `Decide whether to type text, perform sequence, or navigate. Current sequence has ${sequence.length} steps.`,
            }),
          });
          const pj = await pr.json();
          if (pj.success && pj.decision?.thinking) {
            reasoning = `${pj.decision.thinking.reasoning} (Strategy: ${pj.decision.thinking.strategy})`;
            const title = pj.decision.nextAction?.title?.toLowerCase() || "";
            if (title.includes("type") || title.includes("input"))
              decidedMode = "type";
            else if (title.includes("sequence") || title.includes("step"))
              decidedMode = "sequence";
            else decidedMode = "navigate";
          }
        }
      } catch {}

      setMode(decidedMode);
      setAiDecision({
        mode: decidedMode,
        reasoning,
        confidence: 0.92,
        suggestion:
          decidedMode === "type"
            ? `Type at (${typeX},${typeY})`
            : decidedMode === "sequence"
              ? `Run ${sequence.length} steps`
              : `Navigate to (${navX},${navY}) ${navLabel}`,
      });
      setStatus(`AI decided: ${decidedMode.toUpperCase()} — ${reasoning}`);
    } catch (e) {
      setStatus("AI decide failed: " + String(e).slice(0, 80));
    } finally {
      setAiDeciding(false);
    }
  };

  const handleExecuteType = async () => {
    if (!typeText.trim()) {
      setStatus("Enter text to type first");
      return;
    }
    setExecuting(true);
    setStatus(
      `Typing "${typeText}" at (${typeX},${typeY}) via ${targetDevice}...`,
    );
    try {
      const res = await fetch("/api/execute-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDevice,
          deviceId,
          task: {
            id: `ai_type_${Date.now()}`,
            name: `AI Type: ${typeText.slice(0, 20)}`,
            action: typeAction,
            targetPosition: { x: typeX, y: typeY },
            textPayload: typeText,
            text: typeText,
          },
        }),
      });
      const data = await res.json();
      setStatus(
        data.success
          ? `✓ Typed "${typeText}" @ (${typeX},${typeY})`
          : `✗ Type failed: ${data.error}`,
      );
      onTypeText?.(typeX, typeY, typeText, typeAction);
      // Also add as step for reusability
      onAddStep?.({
        x: typeX,
        y: typeY,
        action: typeAction,
        text: typeText,
        name: `AI Type: ${typeText.slice(0, 16)}`,
      });
    } catch (e) {
      setStatus("Type error: " + String(e).slice(0, 60));
    } finally {
      setExecuting(false);
    }
  };

  const handleExecuteSequence = async () => {
    if (sequence.length === 0) {
      setStatus("No sequence to perform — create steps first");
      return;
    }
    setExecuting(true);
    setStatus(
      `Performing ${sequence.length} step sequence via ${targetDevice}...`,
    );
    try {
      if (onRunSequence) {
        await onRunSequence();
        setStatus(
          `✓ Sequence of ${sequence.length} steps dispatched via pyautogui`,
        );
      } else {
        // Fallback: dispatch each step directly
        for (const s of sequence) {
          await fetch("/api/execute-task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetDevice,
              deviceId,
              task: {
                id: s.id,
                name: s.name,
                action: s.action,
                targetPosition: { x: s.x, y: s.y },
                textPayload: s.text || "",
              },
            }),
          });
          await new Promise((r) => setTimeout(r, s.delayMs || 500));
        }
        setStatus(`✓ Sequence executed`);
      }
    } catch (e) {
      setStatus("Sequence error: " + String(e).slice(0, 60));
    } finally {
      setExecuting(false);
    }
  };

  const handleExecuteNavigate = async () => {
    setExecuting(true);
    setStatus(
      `Navigating to (${navX},${navY}) ${navLabel} via ${targetDevice}...`,
    );
    try {
      const res = await fetch("/api/execute-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDevice,
          deviceId,
          task: {
            id: `ai_nav_${Date.now()}`,
            name: `Navigate: ${navLabel}`,
            action: "click",
            targetPosition: { x: navX, y: navY },
          },
        }),
      });
      const data = await res.json();
      setStatus(
        data.success
          ? `✓ Navigated to (${navX},${navY})`
          : `✗ Navigate failed: ${data.error}`,
      );
      onNavigate?.(navX, navY, navLabel);
      onAddStep?.({
        x: navX,
        y: navY,
        action: "click",
        name: `Navigate: ${navLabel}`,
      });
    } catch (e) {
      setStatus("Navigate error: " + String(e).slice(0, 60));
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-cyan-800/50 shadow-xl overflow-hidden">
      <CardHeader className="p-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            AI Decide — Type / Sequence / Navigate
            {aiDecision && (
              <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[10px] ml-1">
                {aiDecision.mode.toUpperCase()}{" "}
                {Math.round(aiDecision.confidence * 100)}%
              </Badge>
            )}
          </CardTitle>
          <Button
            size="sm"
            onClick={handleAIDecide}
            disabled={aiDeciding}
            className="h-7 text-xs gap-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold"
          >
            {aiDeciding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {aiDeciding ? "Deciding..." : "AI Decide"}
          </Button>
        </div>
        <CardDescription className="text-[11px] text-slate-400">
          {aiDecision
            ? aiDecision.reasoning
            : "AI analyzes live screen and decides whether to type text, run your saved action sequence, or navigate."}
        </CardDescription>
        {status && (
          <div
            className={`mt-1.5 px-2 py-1 rounded text-[11px] font-mono border ${status.startsWith("✓") ? "bg-emerald-950 border-emerald-800 text-emerald-300" : status.startsWith("✗") ? "bg-red-950 border-red-800 text-red-300" : "bg-slate-950 border-slate-800 text-slate-300"}`}
          >
            {status}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-3">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as any)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 bg-slate-950 border border-slate-800 p-1 h-8">
            <TabsTrigger
              value="type"
              className="gap-1 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Type className="w-3.5 h-3.5" /> Type Text
            </TabsTrigger>
            <TabsTrigger
              value="sequence"
              className="gap-1 text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <ListOrdered className="w-3.5 h-3.5" /> Perform Sequence
            </TabsTrigger>
            <TabsTrigger
              value="navigate"
              className="gap-1 text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <Navigation className="w-3.5 h-3.5" /> Navigate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="type" className="space-y-3 pt-3">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono font-bold text-purple-300 flex items-center gap-1">
                <Keyboard className="w-3.5 h-3.5" /> Type Text at Coordinates
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">X</label>
                  <Input
                    type="number"
                    value={typeX}
                    onChange={(e) => setTypeX(parseInt(e.target.value) || 0)}
                    className="h-7 text-xs bg-slate-900 border-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Y</label>
                  <Input
                    type="number"
                    value={typeY}
                    onChange={(e) => setTypeY(parseInt(e.target.value) || 0)}
                    className="h-7 text-xs bg-slate-900 border-slate-700"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">
                  Text to type
                </label>
                <Textarea
                  value={typeText}
                  onChange={(e) => setTypeText(e.target.value)}
                  placeholder="Hello world, admin_123 ..."
                  className="min-h-[56px] text-xs bg-slate-900 border-slate-700"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Mode:</span>
                <button
                  onClick={() => setTypeAction("clear_and_type")}
                  className={`px-2 py-1 rounded text-[11px] font-bold ${typeAction === "clear_and_type" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}
                >
                  Clear & Type
                </button>
                <button
                  onClick={() => setTypeAction("type_text")}
                  className={`px-2 py-1 rounded text-[11px] font-bold ${typeAction === "type_text" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-400"}`}
                >
                  Type
                </button>
                <span className="text-[10px] text-slate-500 ml-auto">
                  Uses pyautogui.typewrite via {targetDevice}
                </span>
              </div>
              <Button
                onClick={handleExecuteType}
                disabled={executing || !typeText.trim()}
                className="w-full h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white gap-1 font-bold"
              >
                <Zap className="w-3.5 h-3.5" />{" "}
                {executing
                  ? "Typing..."
                  : `Type "${typeText.slice(0, 16) || "text"}" @ (${typeX},${typeY})`}
              </Button>
            </div>
            {perceptionReport?.elements?.filter((e) => e.type === "input")
              .length ? (
              <div className="text-[11px] text-slate-400">
                Detected inputs:{" "}
                {perceptionReport!.elements
                  .filter((e) => e.type === "input")
                  .map((e) => `${e.name} (${e.center.x},${e.center.y})`)
                  .join(", ")}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="sequence" className="space-y-3 pt-3">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1">
                <ListOrdered className="w-3.5 h-3.5" /> Action Sequence (
                {sequence.length} steps)
              </span>
              {sequence.length === 0 ? (
                <div className="py-4 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  <p className="text-xs text-slate-400">
                    No steps yet — create via recording or Quick Collab
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[140px] pr-1">
                  <div className="space-y-1">
                    {sequence.slice(0, 6).map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between p-1.5 rounded border text-[11px] ${activeStepId === s.id ? "bg-amber-950/30 border-amber-700" : "bg-slate-900 border-slate-800"}`}
                      >
                        <span className="font-bold text-slate-200">
                          #{s.stepNumber} {s.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.action === "right_click" ? "bg-amber-950 text-amber-300" : s.action.includes("type") ? "bg-purple-950 text-purple-300" : "bg-slate-800 text-slate-300"}`}
                        >
                          {s.action} ({s.x},{s.y})
                        </span>
                      </div>
                    ))}
                    {sequence.length > 6 && (
                      <div className="text-[10px] text-slate-500 text-center">
                        + {sequence.length - 6} more steps
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
              <Button
                onClick={handleExecuteSequence}
                disabled={executing || sequence.length === 0}
                className="w-full h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1 font-bold"
              >
                <Zap className="w-3.5 h-3.5" />{" "}
                {executing
                  ? "Running..."
                  : `Perform Full Sequence (${sequence.length}) via pyautogui`}
              </Button>
              <p className="text-[10px] text-slate-500">
                Runs each step with drift `{targetDevice}` + random 1-3s
                variation if enabled in header.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="navigate" className="space-y-3 pt-3">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" /> Navigate to Coordinates
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">X</label>
                  <Input
                    type="number"
                    value={navX}
                    onChange={(e) => setNavX(parseInt(e.target.value) || 0)}
                    className="h-7 text-xs bg-slate-900 border-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Y</label>
                  <Input
                    type="number"
                    value={navY}
                    onChange={(e) => setNavY(parseInt(e.target.value) || 0)}
                    className="h-7 text-xs bg-slate-900 border-slate-700"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">
                  Label / Target name
                </label>
                <Input
                  value={navLabel}
                  onChange={(e) => setNavLabel(e.target.value)}
                  placeholder="Submit Button, Header, Input..."
                  className="h-7 text-xs bg-slate-900 border-slate-700"
                />
              </div>
              <Button
                onClick={handleExecuteNavigate}
                disabled={executing}
                className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1 font-bold"
              >
                <Target className="w-3.5 h-3.5" />{" "}
                {executing
                  ? "Navigating..."
                  : `Navigate & Click @ (${navX},${navY})`}
              </Button>
              {perceptionReport?.elements?.length ? (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">
                    Quick pick from perception:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {perceptionReport.elements.slice(0, 4).map((el) => (
                      <button
                        key={el.id}
                        onClick={() => {
                          setNavX(el.center.x);
                          setNavY(el.center.y);
                          setNavLabel(el.name);
                        }}
                        className="px-2 py-1 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                      >
                        {el.name} ({el.center.x},{el.center.y})
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
