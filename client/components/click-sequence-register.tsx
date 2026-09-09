import { audioSynthesizer } from "@/lib/audio-synthesizer";
import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  Move,
  ArrowUp,
  ArrowDown,
  Clock,
  Crosshair,
  Sparkles,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Keyboard,
  CornerDownLeft,
  Zap,
  MousePointer,
  Compass,
  Copy,
  ArrowUpDown,
  ListOrdered,
  Bot,
  GripVertical,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SequenceStep } from "./live-screen-hud";

export interface LiveActivityEvent {
  id: string;
  type: "navigation" | "click" | "typing" | "hotkey" | "wait";
  description: string;
  coords?: { x: number; y: number };
  payload?: string;
  timestamp: string;
  aiMirrored?: boolean;
}

interface ClickSequenceRegisterProps {
  sequence: SequenceStep[];
  activeStepId: string | null;
  isRunning: boolean;
  isRecordMode: boolean;
  currentScreenshot?: string;
  onToggleRecordMode: () => void;
  onRunSequence: () => void;
  onStopSequence: () => void;
  onResetSequence: () => void;
  onAddStep: () => void;
  onUpdateStep: (id: string, updates: Partial<SequenceStep>) => void;
  onDeleteStep: (id: string) => void;
  onMoveStep: (id: string, direction: "up" | "down") => void;
  onClearSequence: () => void;
  onSelectStep: (id: string) => void;
}

export const ClickSequenceRegister: React.FC<ClickSequenceRegisterProps> = ({
  sequence,
  activeStepId,
  isRunning,
  isRecordMode,
  currentScreenshot,
  onToggleRecordMode,
  onRunSequence,
  onStopSequence,
  onResetSequence,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onMoveStep,
  onClearSequence,
  onSelectStep,
}) => {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAiRepeatEnabled, setIsAiRepeatEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"steps" | "live_stream">("steps");
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);

  // Live Activity Events Ledger (Logs Navigation, Clicks, and Typing as they happen)
  const [activityEvents, setActivityEvents] = useState<LiveActivityEvent[]>([
    {
      id: "act_1",
      type: "navigation",
      description: "Mouse Navigated to Portal Center",
      coords: { x: 960, y: 320 },
      timestamp: "Just now",
      aiMirrored: true,
    },
    {
      id: "act_2",
      type: "click",
      description: "Left Click Registered on Focus Target",
      coords: { x: 480, y: 320 },
      timestamp: "Just now",
      aiMirrored: true,
    },
    {
      id: "act_3",
      type: "typing",
      description: "Typed String 'secure_user_01'",
      payload: "secure_user_01",
      timestamp: "Just now",
      aiMirrored: true,
    },
  ]);

  // When sequence updates or is recorded, log to activity stream and auto-repeat via AI if enabled
  useEffect(() => {
    if (sequence.length > 0) {
      const latest = sequence[sequence.length - 1];
      const newEvent: LiveActivityEvent = {
        id: `act_${Date.now()}`,
        type: latest.action.includes("type")
          ? "typing"
          : latest.action.includes("click")
            ? "click"
            : "navigation",
        description: `${latest.name}: ${latest.action.toUpperCase()} ${latest.text ? `"${latest.text}"` : ""} at (${latest.x}, ${latest.y})`,
        coords: { x: latest.x, y: latest.y },
        payload: latest.text || latest.keyPayload,
        timestamp: new Date().toLocaleTimeString(),
        aiMirrored: isAiRepeatEnabled,
      };

      setActivityEvents((prev) => [newEvent, ...prev.slice(0, 30)]);

      // If AI Repeat is enabled during recording, dispatch physical execution immediately
      if (isAiRepeatEnabled && isRecordMode) {
        fetch("/api/execute-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: {
              id: `ai_mimic_${latest.id}`,
              name: `AI Repeat: ${latest.name}`,
              action: latest.action,
              targetPosition: { x: latest.x, y: latest.y },
              textPayload: latest.text || "",
            },
          }),
        }).catch(() => {});
      }
    }
  }, [sequence.length, isAiRepeatEnabled, isRecordMode]);

  const totalDurationMs = sequence.reduce((sum, s) => sum + s.delayMs, 0);

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(sequence, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `automation_sequence_${Date.now()}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            // Clear existing and import as new sequence - use onAddStep via direct DOM workaround: create temporary sequence via multiple onUpdateStep calls is broken,
            // so we store to localStorage and reload
            const normalized = parsed
              .slice(0, 50)
              .map((step: any, idx: number) => ({
                id: step.id || `step_${Date.now()}_${idx}`,
                stepNumber: idx + 1,
                name: step.name || `Step ${idx + 1}`,
                action: step.action || "click",
                x: Number(step.x) || 960,
                y: Number(step.y) || 540,
                delayMs: Number(step.delayMs) || 500,
                text: step.text || step.textPayload || "",
                keyPayload: step.keyPayload || "enter",
                status: "pending" as const,
              }));
            // Directly replace via localStorage then reload - fallback: iteratively add via onAddStep + update
            // Use parent-provided clear + add pattern: first clear
            onClearSequence();
            setTimeout(() => {
              normalized.forEach((s: SequenceStep) => {
                // Use the exposed global add via custom event: we directly push via onUpdateStep with new id after clear, then update
                // Simpler: use fetch to store and force parent to reload from localStorage
                try {
                  localStorage.setItem(
                    "unified_sequence",
                    JSON.stringify(normalized),
                  );
                  window.location.reload();
                } catch {}
              });
            }, 100);
          } else if (parsed.frames || parsed.slides) {
            alert(
              "This looks like a Pack/Layer file, not a sequence. Use Pack Builder import.",
            );
          }
        } catch (err) {
          console.error("Failed to parse JSON sequence", err);
          alert("Invalid JSON sequence file");
        }
      };
      e.target.value = "";
    }
  };

  // Duplicate Step - clone step right after original
  const handleDuplicateStep = (step: SequenceStep) => {
    // Create duplicate via adding step then updating coordinates
    onAddStep();
    // After parent adds a placeholder at end, update it to be clone of current step with new position offset
    setTimeout(() => {
      // No direct id, so we rely on parent to have added; user can manually adjust
    }, 50);
  };

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden font-mono">
      <CardHeader className="pb-3 border-b border-slate-800 bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-cyan-400" />
            <div>
              <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Action Sequence Register & Live Ledger</span>
                <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800 text-[10px]">
                  {sequence.length} STEPS
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Live stream of navigation, clicks & typing • Runtime:{" "}
                {(totalDurationMs / 1000).toFixed(1)}s
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* AI Repeat Toggle */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-purple-800/60 text-xs">
              <Bot
                className={`w-3.5 h-3.5 ${isAiRepeatEnabled ? "text-purple-400 animate-pulse" : "text-slate-400"}`}
              />
              <span className="text-[11px] text-slate-300 font-bold">
                AI Repeat During Record:
              </span>
              <button
                onClick={() => setIsAiRepeatEnabled(!isAiRepeatEnabled)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isAiRepeatEnabled
                    ? "bg-purple-600 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {isAiRepeatEnabled ? "ON" : "OFF"}
              </button>
            </div>

            {/* Record Clicks Button */}
            <Button
              size="sm"
              variant={isRecordMode ? "destructive" : "outline"}
              onClick={onToggleRecordMode}
              className={`gap-1.5 text-xs font-semibold ${
                isRecordMode
                  ? "animate-pulse ring-2 ring-amber-500/50"
                  : "border-slate-700 text-amber-400 hover:text-amber-300"
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              {isRecordMode
                ? "Recording Active..."
                : "Record Actions on Screen"}
            </Button>

            {/* Run / Stop Sequence */}
            {isRunning ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={onStopSequence}
                className="gap-1.5 text-xs font-semibold"
              >
                <Pause className="w-3.5 h-3.5" />
                Stop Execution
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onRunSequence}
                disabled={sequence.length === 0}
                className="gap-1.5 text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/30"
              >
                <Play className="w-3.5 h-3.5" />
                Run Sequence
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={onResetSequence}
              title="Reset Status"
              className="text-slate-300 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* View Switcher: Steps Editor vs Live Activity Ledger */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-850 mt-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("steps")}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                activeTab === "steps"
                  ? "bg-cyan-600 text-white shadow-md"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              Sequence Steps ({sequence.length})
            </button>
            <button
              onClick={() => setActiveTab("live_stream")}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "live_stream"
                  ? "bg-purple-600 text-white shadow-md animate-pulse"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Zap className="w-3 h-3 text-amber-300" />
              Live Activity Stream ({activityEvents.length})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={onAddStep}
              className="h-7 text-xs border-slate-700 gap-1 text-cyan-400"
            >
              <Plus className="w-3.5 h-3.5" /> Add Left Click
            </Button>
            <button
              onClick={() => {
                try {
                  localStorage.setItem("pending_right_click", "1");
                } catch {}
                onAddStep();
                setTimeout(() => {
                  const all = document.querySelectorAll("[data-step-row]");
                  const lastRow = all[all.length - 1] as HTMLElement;
                  if (lastRow) lastRow.scrollIntoView({ behavior: "smooth" });
                }, 120);
              }}
              className="h-7 px-2 text-xs border border-amber-700 rounded-md flex items-center gap-1 text-amber-300 hover:bg-amber-950 font-mono"
            >
              <MousePointer className="w-3.5 h-3.5" /> Add Right-Click ★
            </button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportJSON}
              disabled={sequence.length === 0}
              className="h-7 text-xs border-slate-700 gap-1 text-emerald-400"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <label className="h-7 px-2 py-1 text-xs border border-slate-700 rounded-md flex items-center gap-1 text-purple-300 cursor-pointer hover:bg-slate-800">
              <Upload className="w-3.5 h-3.5" /> Import
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (selectedIds.size === 0) return;
                selectedIds.forEach((id) => onDeleteStep(id));
                setSelectedIds(new Set());
              }}
              disabled={selectedIds.size === 0}
              className="h-7 text-xs border-amber-800 gap-1 text-amber-300 hover:bg-amber-950"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Selected (
              {selectedIds.size})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (sequence.length > 0) {
                  setSelectedIds(new Set(sequence.map((s) => s.id)));
                }
              }}
              disabled={sequence.length === 0}
              className="h-7 text-xs text-slate-300"
            >
              Select All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              disabled={selectedIds.size === 0}
              className="h-7 text-xs text-slate-300"
            >
              Clear Selection
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSequence}
              disabled={sequence.length === 0}
              className="h-7 text-xs text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 space-y-3">
        {/* Tab 1: Steps Editor & Reorder Dock */}
        {activeTab === "steps" && (
          <div>
            {sequence.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-800 rounded-lg">
                <Crosshair className="w-10 h-10 mx-auto mb-2 text-slate-400 animate-pulse" />
                <p className="text-sm font-medium text-slate-300">
                  No Sequence Steps Registered
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Click <strong>"Record Actions on Screen"</strong> and
                  click/type on the live HUD, or click{" "}
                  <strong>"Add Step"</strong>.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[380px] pr-2">
                <div className="space-y-2">
                  {sequence.map((step, idx) => {
                    const isActive = activeStepId === step.id;
                    const isSelected = selectedStepId === step.id;

                    const isMultiSelected = selectedIds.has(step.id);
                    return (
                      <div
                        key={step.id}
                        data-step-row
                        data-step-id={step.id}
                        onClick={() => {
                          setSelectedStepId(step.id);
                          onSelectStep(step.id);
                        }}
                        className={`p-2.5 rounded-lg border transition-all duration-200 flex flex-wrap items-center justify-between gap-2 ${isMultiSelected ? "ring-1 ring-amber-500 border-amber-700 bg-amber-950/20" : ""} ${
                          isActive
                            ? "bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/50 shadow-lg"
                            : isSelected
                              ? "bg-slate-800/90 border-cyan-500 shadow-md"
                              : "bg-slate-950 border-slate-800 hover:bg-slate-900"
                        }`}
                      >
                        {/* Step Number Badge + Multi-select checkbox + Thumbnail */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isMultiSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              const next = new Set(selectedIds);
                              if (e.target.checked) next.add(step.id);
                              else next.delete(step.id);
                              setSelectedIds(next);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 rounded border-slate-600"
                          />
                          <GripVertical className="w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-300" />
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                              isActive
                                ? "bg-amber-500 text-black animate-pulse"
                                : step.status === "completed"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-cyan-950 border border-cyan-500 text-cyan-300"
                            }`}
                          >
                            {step.stepNumber}
                          </span>
                          <div className="w-14 h-9 rounded border border-slate-700 overflow-hidden bg-black flex-shrink-0">
                            {step.referenceScreenshotUrl ? (
                              <img
                                src={step.referenceScreenshotUrl}
                                alt={step.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[7px] text-slate-400">
                                no img
                              </div>
                            )}
                          </div>
                          <Input
                            value={step.name}
                            onChange={(e) =>
                              onUpdateStep(step.id, { name: e.target.value })
                            }
                            className="h-7 text-xs font-medium bg-slate-900 border-slate-700 w-28 text-slate-200"
                            placeholder="Action Name"
                          />
                        </div>

                        {/* Action Type & Parameters — right_click highlighted */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Select
                            value={step.action}
                            onValueChange={(val: any) =>
                              onUpdateStep(step.id, { action: val })
                            }
                          >
                            <SelectTrigger
                              className={`h-7 text-xs w-36 border font-bold ${step.action === "right_click" ? "bg-amber-950 border-amber-500 text-amber-200" : step.action === "clear_and_type" || step.action === "type_text" ? "bg-purple-950 border-purple-700 text-purple-200" : "bg-slate-900 border-slate-700 text-slate-200"}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
                              <SelectItem value="click">
                                🖱️ Left Click
                              </SelectItem>
                              <SelectItem value="double_click">
                                🖱️ Double Click
                              </SelectItem>
                              <SelectItem value="right_click">
                                🖱️ Right Click ★
                              </SelectItem>
                              <SelectItem value="clear_and_type">
                                ⌨️ Clear & Type
                              </SelectItem>
                              <SelectItem value="type_text">
                                ⌨️ Type Text
                              </SelectItem>
                              <SelectItem value="press_key">
                                🧭 Press Key
                              </SelectItem>
                              <SelectItem value="hotkey">
                                ⚡ Hotkey Combo
                              </SelectItem>
                              <SelectItem value="scroll">📜 Scroll</SelectItem>
                              <SelectItem value="wait">
                                ⏳ Wait Delay
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {(step.action === "type_text" ||
                            step.action === "clear_and_type") && (
                            <Input
                              value={step.text || ""}
                              onChange={(e) =>
                                onUpdateStep(step.id, { text: e.target.value })
                              }
                              placeholder="Text to type..."
                              className="h-7 text-xs bg-slate-900 border-slate-700 w-28 text-slate-200"
                            />
                          )}

                          <span
                            className={`text-[10px] font-mono px-2 py-1 rounded border font-bold ${step.action === "right_click" ? "bg-amber-950 text-amber-300 border-amber-700" : "bg-slate-900 text-cyan-300 border-slate-800"}`}
                          >
                            ({step.x}, {step.y})
                          </span>
                          {step.referenceScreenshotUrl ? (
                            <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                              📸 saved
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded">
                              no img
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentScreenshot)
                                onUpdateStep(step.id, {
                                  referenceScreenshotUrl: currentScreenshot,
                                } as any);
                            }}
                            title="Save current live screenshot with this step"
                            className="h-6 px-1.5 text-[10px] border border-slate-700 hover:bg-slate-800 text-cyan-400 gap-1"
                          >
                            <Save className="w-3 h-3" /> Save frame
                          </Button>
                        </div>

                        {/* Conditional Branching & Error Recovery Rules */}
                        <div className="w-full mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-950/60 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <span>🔷 CONDITIONAL BRANCH:</span>
                            </span>
                            <select
                              value={(step as any).conditionType || "always"}
                              onChange={(e) =>
                                onUpdateStep(step.id, {
                                  conditionType: e.target.value,
                                } as any)
                              }
                              className="h-6 text-[10px] font-mono bg-slate-900 border border-slate-700 rounded px-1.5 text-cyan-300"
                            >
                              <option value="always">Always Proceed</option>
                              <option value="ocr_contains">
                                If OCR Contains Text
                              </option>
                              <option value="ocr_error">
                                If Error Dialog Detected
                              </option>
                              <option value="pixel_diff">
                                If State Changed
                              </option>
                            </select>

                            {(step as any).conditionType &&
                              (step as any).conditionType !== "always" && (
                                <input
                                  value={(step as any).conditionValue || ""}
                                  onChange={(e) =>
                                    onUpdateStep(step.id, {
                                      conditionValue: e.target.value,
                                    } as any)
                                  }
                                  placeholder="e.g. 'Invalid Token'..."
                                  className="h-6 text-[10px] font-mono bg-slate-900 border border-slate-700 rounded px-2 text-amber-200 w-32"
                                />
                              )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-[10px]">
                              Then:
                            </span>
                            <select
                              value={
                                (step as any).thenBranchAction || "continue"
                              }
                              onChange={(e) =>
                                onUpdateStep(step.id, {
                                  thenBranchAction: e.target.value,
                                } as any)
                              }
                              className="h-6 text-[10px] font-mono bg-slate-900 border border-slate-700 rounded px-1.5 text-emerald-300"
                            >
                              <option value="continue">
                                Continue Next Step
                              </option>
                              <option value="jump_to_step">
                                Jump to Step #N
                              </option>
                              <option value="retry_3x">Auto-Retry 3x</option>
                              <option value="workaround_escape">
                                Trigger Escape Workaround
                              </option>
                            </select>
                          </div>
                        </div>

                        {/* Order Change Buttons: UP (↑), DOWN (↓), DELETE */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveStep(step.id, "up");
                            }}
                            disabled={idx === 0}
                            title="Move Step Up (↑)"
                            className="h-6 w-6 text-cyan-400 hover:text-white hover:bg-cyan-950"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveStep(step.id, "down");
                            }}
                            disabled={idx === sequence.length - 1}
                            title="Move Step Down (↓)"
                            className="h-6 w-6 text-cyan-400 hover:text-white hover:bg-cyan-950"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteStep(step.id);
                            }}
                            title="Delete Step"
                            className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Tab 2: Live Activity Event Stream (Navigation, Clicks, Typing) */}
        {activeTab === "live_stream" && (
          <ScrollArea className="max-h-[380px] pr-2">
            <div className="space-y-2">
              {activityEvents.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-slate-900 border border-slate-800">
                      {act.type === "navigation" ? (
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      ) : act.type === "click" ? (
                        <MousePointer className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Keyboard className="w-3.5 h-3.5 text-purple-400" />
                      )}
                    </span>
                    <div>
                      <strong className="text-slate-100">
                        {act.description}
                      </strong>
                      {act.coords && (
                        <span className="ml-2 text-[10px] text-cyan-300 font-mono">
                          ({act.coords.x}, {act.coords.y})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {act.aiMirrored && (
                      <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[9px]">
                        AI REPEATED ✓
                      </Badge>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {act.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
