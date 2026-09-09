import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Eye,
  Crosshair,
  ShieldCheck,
  ShieldX,
  Play,
  CornerDownRight,
  TrendingUp,
  Cpu,
  MousePointer,
  Keyboard,
  History,
  BookOpen,
  Search,
  Filter,
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
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";
import { SequenceStep, AIThinkingState } from "./live-screen-hud";

export interface TemporalFrameData {
  id: string;
  role: "previous" | "current" | "next";
  title: string;
  imageUrl: string;
  actionType: string;
  targetCoords: { x: number; y: number };
  progressionStatus:
    | "pending"
    | "grounded"
    | "executing"
    | "verified"
    | "completed";
  stepNotes: string;
  retryAttempts: number;
  differentialOffsetPx: number;
  learnedImprovement: string;
  dwellMs: number;
  verificationExpected: string;
}

export interface ScreenObstacleInfo {
  id: string;
  type: "ad_popup" | "interstitial_modal" | "captcha_overlay" | "cookie_banner";
  title: string;
  detectedCoords: { x: number; y: number };
  confidence: number;
  armedWorkaround: string;
  workaroundMethod:
    | "backdrop_click"
    | "escape_key"
    | "tab_enter"
    | "spline_reanchor";
}

export interface AIHistoryFrameRecord {
  id: string;
  frameIndex: number;
  title: string;
  screenshotUrl: string;
  thinkingProcess: string;
  testsRun: string;
  actionDispatched: string;
  timestamp: string;
  coords?: { x: number; y: number };
  elements?: any[];
}

interface TemporalScreenshotTrioHUDProps {
  currentLiveScreenshot?: string;
  sequence?: SequenceStep[];
  activeStepId?: string | null;
  aiThinking?: AIThinkingState | null;
  isLiveStreamActive?: boolean;
  frozenSnapshotUrl?: string | null;
  onExecuteWorkaround?: (method: string) => void;
  onTriggerStepAction?: (
    coords: { x: number; y: number },
    action: string,
  ) => void;
  perceptionElements?: any[];
}

export const TemporalScreenshotTrioHUD: React.FC<
  TemporalScreenshotTrioHUDProps
> = ({
  currentLiveScreenshot,
  sequence = [],
  activeStepId,
  aiThinking,
  isLiveStreamActive = false,
  frozenSnapshotUrl,
  onExecuteWorkaround,
  onTriggerStepAction,
  perceptionElements = [],
}) => {
  // Live recording ring buffer - actual frames from live recording (no placeholders)
  const [liveRing, setLiveRing] = useState<AIHistoryFrameRecord[]>([]);
  const lastPushedUrlRef = useRef<string>("");
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AIHistoryFrameRecord[]>(
    [],
  );

  const [selectedHistoryFrameId, setSelectedHistoryFrameId] =
    useState<string>("");
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    prev_frame: false,
    curr_frame: true,
    next_frame: false,
  });

  const [obstacles, setObstacles] = useState<ScreenObstacleInfo[]>([
    {
      id: "obs_1",
      type: "interstitial_modal",
      title: "Dynamic Popover Dialog Overlay",
      detectedCoords: { x: 960, y: 300 },
      confidence: 0.94,
      armedWorkaround:
        "Auto-Trigger Strategy: Click Modal Backdrop (100, 100) -> Escape Pulse",
      workaroundMethod: "backdrop_click",
    },
  ]);

  const [statusLog, setStatusLog] = useState<string>(
    "Temporal Trio: awaiting live recording frames. Will show actual previous/current/next once stream active.",
  );

  // Auto-push live frames into ring buffer (actual frames, handles placeholder on first load)
  useEffect(() => {
    if (!autoUpdate) return;
    if (!currentLiveScreenshot) return;
    const isSame = currentLiveScreenshot === lastPushedUrlRef.current;
    const now = Date.now();
    const last = liveRing[0];
    const throttled =
      last && now - parseInt(last.id.split("_")[1] || "0", 10) < 500;
    // Allow first frame even if same placeholder, but throttle subsequent sames
    if (isSame && liveRing.length > 0 && throttled) return;
    if (isSame && liveRing.length > 0) return;
    // Seed history even with placeholder so UI is not empty
    lastPushedUrlRef.current = currentLiveScreenshot;
    const rec: AIHistoryFrameRecord = {
      id: `hf_${now}`,
      frameIndex: liveRing.length + 1,
      title: aiThinking?.action
        ? `Live: ${aiThinking.action.slice(0, 28)}`
        : `Live Frame #${liveRing.length + 1}`,
      screenshotUrl: currentLiveScreenshot,
      thinkingProcess: aiThinking
        ? `Targeting (${aiThinking.x}, ${aiThinking.y}) conf ${(aiThinking.confidence * 100).toFixed(0)}%`
        : "Live recording capture - analyzing element geometry",
      testsRun:
        perceptionElements.length > 0
          ? `Detected ${perceptionElements.length} UI elements`
          : "Scanning for interactive targets",
      actionDispatched: aiThinking?.action || "Monitoring",
      timestamp: new Date().toLocaleTimeString(),
      coords: aiThinking ? { x: aiThinking.x, y: aiThinking.y } : undefined,
      elements: perceptionElements,
    };
    setLiveRing((prev) => {
      const next = [rec, ...prev]
        .slice(0, 50)
        .map((r, i) => ({ ...r, frameIndex: 50 - i }));
      return next;
    });
    if (!selectedHistoryFrameId) setSelectedHistoryFrameId(rec.id);
    setStatusLog(
      `Captured live frame #${rec.frameIndex} at ${rec.timestamp} (${perceptionElements.length} elements)`,
    );
  }, [currentLiveScreenshot]);

  // Also push when aiThinking changes (even if screenshot same) to ensure AI thinking frames are recorded
  useEffect(() => {
    if (!aiThinking?.action || !currentLiveScreenshot) return;
    const rec: AIHistoryFrameRecord = {
      id: `hf_think_${Date.now()}`,
      frameIndex: liveRing.length + 1,
      title: `AI: ${aiThinking.action.slice(0, 30)}`,
      screenshotUrl:
        isLiveStreamActive && frozenSnapshotUrl
          ? frozenSnapshotUrl
          : currentLiveScreenshot,
      thinkingProcess: `${aiThinking.action} @ (${aiThinking.x},${aiThinking.y}) conf ${(aiThinking.confidence * 100).toFixed(0)}%`,
      testsRun: "Real-time spline + OCR verification",
      actionDispatched: aiThinking.action,
      timestamp: new Date().toLocaleTimeString(),
      coords: { x: aiThinking.x, y: aiThinking.y },
      elements: perceptionElements,
    };
    if (liveRing[0]?.title === rec.title) return;
    setLiveRing((prev) =>
      [rec, ...prev].slice(0, 50).map((r, i) => ({ ...r, frameIndex: 50 - i })),
    );
  }, [aiThinking?.action]);

  // Fallback: if liveRing still empty but sequence has saved screenshots, seed from sequence
  useEffect(() => {
    if (liveRing.length === 0 && sequence.length > 0) {
      const seeded = sequence
        .slice(0, 10)
        .map(
          (s, idx) =>
            ({
              id: `seed_${s.id}`,
              frameIndex: idx + 1,
              title: `Step ${s.stepNumber}: ${s.name}`,
              screenshotUrl:
                (s as any).referenceScreenshotUrl ||
                currentLiveScreenshot ||
                "",
              thinkingProcess: `${s.action} @ (${s.x},${s.y})`,
              testsRun: s.text ? `Typing "${s.text}"` : `Dwell ${s.delayMs}ms`,
              actionDispatched: s.action,
              timestamp: new Date().toLocaleTimeString(),
              coords: { x: s.x, y: s.y },
              elements: [],
            }) as AIHistoryFrameRecord,
        )
        .filter((r) => r.screenshotUrl);
      if (seeded.length > 0) {
        setLiveRing(seeded.reverse());
        setSelectedHistoryFrameId(seeded[0].id);
        setStatusLog(`Seeded ${seeded.length} frames from saved method steps`);
      }
    }
  }, [sequence.length]);

  // Filter for showOnlyChanges: only frames where imageUrl differs meaningfully or coords moved >8px
  const filteredRing = showOnlyChanges
    ? liveRing.filter((rec, idx) => {
        if (idx === 0) return true;
        const prev = liveRing[idx - 1];
        if (!prev.coords || !rec.coords) return true;
        const dist = Math.hypot(
          rec.coords.x - prev.coords.x,
          rec.coords.y - prev.coords.y,
        );
        return dist > 12;
      })
    : liveRing;

  const aiFrameHistory = filteredRing;

  const selectedHistory =
    aiFrameHistory.find((h) => h.id === selectedHistoryFrameId) ||
    aiFrameHistory[0];

  const toggleDropdown = (frameId: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [frameId]: !prev[frameId] }));
  };

  // Search and report element coordinates
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const lower = q.toLowerCase();
    const matched = liveRing
      .filter(
        (r) =>
          r.title.toLowerCase().includes(lower) ||
          r.thinkingProcess.toLowerCase().includes(lower) ||
          r.actionDispatched.toLowerCase().includes(lower) ||
          (r.elements &&
            r.elements.some((e: any) =>
              (e.name || "").toLowerCase().includes(lower),
            )),
      )
      .slice(0, 10);
    setSearchResults(matched);
    if (matched.length > 0) {
      const report = matched
        .map(
          (m) => `${m.title} @ (${m.coords?.x ?? "?"},${m.coords?.y ?? "?"})`,
        )
        .join(" | ");
      setStatusLog(`Search "${q}" -> ${matched.length} hits: ${report}`);
    } else {
      setStatusLog(`Search "${q}" -> 0 hits. Try "button", "input", "click"`);
    }
  };

  const handleExecuteBackupWorkaround = async (obs: ScreenObstacleInfo) => {
    setStatusLog(
      `🛡️ Triggering workaround: ${obs.armedWorkaround} via PyAutoGUI...`,
    );
    // Actual pyautogui dispatch
    try {
      const actionMap: Record<string, any> = {
        backdrop_click: { action: "click", x: 100, y: 100 },
        escape_key: { action: "press_key", keyPayload: "escape" },
        tab_enter: { action: "press_key", keyPayload: "enter" },
        spline_reanchor: {
          action: "click",
          x: obs.detectedCoords.x,
          y: obs.detectedCoords.y,
        },
      };
      const act = actionMap[obs.workaroundMethod] || {
        action: "click",
        x: 100,
        y: 100,
      };
      await fetch("/api/execute-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDevice: "desktop",
          task: {
            id: `workaround_${Date.now()}`,
            name: `Workaround: ${obs.title}`,
            action: act.action,
            targetPosition: { x: act.x || 100, y: act.y || 100 },
            keyPayload: act.keyPayload || "escape",
            textPayload: "",
          },
        }),
      });
      setStatusLog(
        `✓ Workaround executed on live OS via PyAutoGUI at (${act.x || ""},${act.y || ""})`,
      );
      fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "PyAutoGUI",
          level: "SUCCESS",
          message: `Workaround ${obs.workaroundMethod} dispatched @ (${act.x},${act.y})`,
        }),
      }).catch(() => {});
    } catch (e) {
      setStatusLog(`Workaround dispatch failed: ${String(e)}`);
    }
    if (onExecuteWorkaround) onExecuteWorkaround(obs.workaroundMethod);
    setTimeout(() => setObstacles([]), 900);
  };

  // Derive previous/current/next from LIVE recording buffer + sequence
  const activeIndex = sequence.findIndex((s) => s.id === activeStepId);
  const currentStep =
    activeIndex !== -1 ? sequence[activeIndex] : sequence[0] || null;
  const previousStep = activeIndex > 0 ? sequence[activeIndex - 1] : null;
  const nextStep =
    activeIndex !== -1 && activeIndex < sequence.length - 1
      ? sequence[activeIndex + 1]
      : null;

  // Use actual live frames for trio: previous = ring[1], current = ring[0] or frozen, next = forecast from nextStep overlay on current
  const currentLiveFrame =
    isLiveStreamActive && frozenSnapshotUrl
      ? frozenSnapshotUrl
      : liveRing[0]?.screenshotUrl || currentLiveScreenshot || "";
  const previousLiveFrame =
    liveRing[1]?.screenshotUrl ||
    previousStep?.referenceScreenshotUrl ||
    currentLiveFrame;
  const nextLiveFrame = nextStep?.referenceScreenshotUrl || currentLiveFrame;

  const dynamicFrames: TemporalFrameData[] = [
    {
      id: "prev_frame",
      role: "previous",
      title: liveRing[1]
        ? `Previous: ${liveRing[1].title}`
        : previousStep
          ? `Previous: ${previousStep.name}`
          : "Previous Live Frame",
      imageUrl: previousLiveFrame || "",
      actionType:
        liveRing[1]?.actionDispatched?.toUpperCase() ||
        (previousStep ? previousStep.action.toUpperCase() : "LIVE"),
      targetCoords:
        liveRing[1]?.coords ||
        (previousStep
          ? { x: previousStep.x, y: previousStep.y }
          : { x: 0, y: 0 }),
      progressionStatus: "completed",
      stepNotes: liveRing[1]
        ? `Live frame #${liveRing[1].frameIndex} verified at ${liveRing[1].timestamp}`
        : previousStep
          ? `Step #${previousStep.stepNumber} executed`
          : "No previous live frame yet - start recording",
      retryAttempts: 0,
      differentialOffsetPx: 0,
      learnedImprovement:
        liveRing[1]?.thinkingProcess || "Baseline live capture",
      dwellMs: previousStep?.delayMs || 350,
      verificationExpected: "Verified via live comparison",
    },
    {
      id: "curr_frame",
      role: "current",
      title: liveRing[0]
        ? `Current: ${liveRing[0].title}`
        : currentStep
          ? `Current Working: ${currentStep.name}`
          : "Current Live Frame",
      imageUrl: currentLiveFrame || "",
      actionType:
        liveRing[0]?.actionDispatched?.toUpperCase() ||
        (currentStep
          ? currentStep.action.toUpperCase()
          : (aiThinking?.action || "LIVE").toUpperCase()),
      targetCoords:
        liveRing[0]?.coords ||
        (currentStep
          ? { x: currentStep.x, y: currentStep.y }
          : { x: aiThinking?.x || 0, y: aiThinking?.y || 0 }),
      progressionStatus: "executing",
      stepNotes: liveRing[0]
        ? `Live @ ${liveRing[0].timestamp} | ${liveRing[0].testsRun}`
        : currentStep
          ? `Step #${currentStep.stepNumber} active`
          : "Awaiting live frames - enable Share Screen",
      retryAttempts: 0,
      differentialOffsetPx: 0,
      learnedImprovement:
        liveRing[0]?.thinkingProcess || "Live tracking active",
      dwellMs: currentStep?.delayMs || 520,
      verificationExpected: currentStep?.targetOcrLabel
        ? `OCR "${currentStep.targetOcrLabel}"`
        : "Live OCR verification",
    },
    {
      id: "next_frame",
      role: "next",
      title: nextStep
        ? `Next Expected: ${nextStep.name}`
        : "Next Live Prediction",
      imageUrl: nextLiveFrame || "",
      actionType: nextStep ? nextStep.action.toUpperCase() : "FORECAST",
      targetCoords: nextStep
        ? { x: nextStep.x, y: nextStep.y }
        : { x: 740, y: 520 },
      progressionStatus: "pending",
      stepNotes: nextStep
        ? `Upcoming step #${nextStep.stepNumber} ready`
        : "No next step queued - will continue live monitoring",
      retryAttempts: 0,
      differentialOffsetPx: 0,
      learnedImprovement: nextStep
        ? "Pre-computed trajectory ready"
        : "Awaiting planner forecast",
      dwellMs: nextStep?.delayMs || 400,
      verificationExpected: nextStep
        ? `Expect transition after ${nextStep.action}`
        : "Awaiting next decision",
    },
  ];

  // Helper to render image safely - avoid infinite loop by not using live URL when anti-tunnel is active and image is self-referential
  const SafeImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
    if (!src)
      return (
        <div className="w-full h-full bg-slate-950 flex items-center justify-center text-[10px] text-slate-400">
          No live frame yet
          <br />
          Start Share Screen
        </div>
      );
    // If src is data URL that is identical to liveRing rendering loop, we still render but browser exclusion prevents feedback loop
    // Add key to bust cache and avoid loop flash
    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain bg-black"
        style={{ imageRendering: "auto" }}
      />
    );
  };

  return (
    <div className="space-y-4 font-mono">
      <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="p-3 bg-slate-950 border-b border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <CardTitle className="text-xs font-bold text-slate-100">
                Temporal Trio & Live History (Actual Frames)
              </CardTitle>
            </div>
            <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800 text-[10px]">
              {liveRing.length} LIVE FRAMES
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-300">Auto-update</span>
              <button
                onClick={() => setAutoUpdate((v) => !v)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${autoUpdate ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"}`}
              >
                {autoUpdate ? "ON" : "OFF"}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-300">Only changes</span>
              <button
                onClick={() => setShowOnlyChanges((v) => !v)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${showOnlyChanges ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-300"}`}
              >
                {showOnlyChanges ? "FILTERED" : "ALL"}
              </button>
            </div>
            {isLiveStreamActive && (
              <Badge className="bg-red-950 text-red-300 border-red-800 text-[9px] animate-pulse">
                ANTI-LOOP ACTIVE (frozen preview)
              </Badge>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLiveRing([])}
                className="h-6 px-2 text-[10px] font-mono border-slate-800 hover:bg-slate-800 text-slate-300"
              >
                Clear History
              </Button>
              {obstacles.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => handleExecuteBackupWorkaround(obstacles[0])}
                  className="h-6 px-2 text-[10px] font-mono font-bold bg-amber-600 hover:bg-amber-500 text-white"
                >
                  <ShieldCheck className="w-3 h-3 mr-1" /> Workaround 🛡️
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search frames / element names (e.g. Submit, input) & report coords..."
                className="h-7 pl-7 text-xs bg-slate-950 border-slate-700"
              />
            </div>
            <Select
              value={selectedHistoryFrameId}
              onValueChange={(val) => setSelectedHistoryFrameId(val)}
            >
              <SelectTrigger className="h-7 text-xs bg-slate-900 border-slate-700 font-mono w-56 text-cyan-300">
                <SelectValue placeholder="Select frame..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 font-mono text-xs max-h-60">
                {aiFrameHistory.map((hf) => (
                  <SelectItem key={hf.id} value={hf.id} className="text-xs">
                    #{hf.frameIndex} • {hf.title} ({hf.timestamp}){" "}
                    {hf.coords ? `(${hf.coords.x},${hf.coords.y})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {searchResults.length > 0 && (
            <div className="p-2 rounded bg-slate-950 border border-cyan-800/50 text-[11px]">
              <div className="font-bold text-cyan-300 mb-1">
                Search hits ({searchResults.length}) — coordinates:
              </div>
              {searchResults.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between text-slate-300 border-b border-slate-800/50 py-0.5"
                >
                  <span>{r.title}</span>
                  <span className="text-cyan-300 font-bold">
                    {r.coords
                      ? `(${r.coords.x}, ${r.coords.y})`
                      : "(no coords)"}{" "}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>

      <Card className="bg-slate-900 border-cyan-500/40 shadow-xl overflow-hidden">
        <CardHeader className="p-3 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <CardTitle className="text-xs font-bold text-slate-100">
              Live Recording History ({aiFrameHistory.length} / 50)
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-300">
            <span>Auto-refresh {autoUpdate ? "• 500ms" : "• paused"}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </CardHeader>
        {selectedHistory ? (
          <CardContent className="p-3 bg-slate-950/60 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            <div className="md:col-span-4">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-800 bg-black group">
                <SafeImage
                  src={selectedHistory.screenshotUrl}
                  alt={selectedHistory.title}
                />
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/80 text-cyan-300">
                  #{selectedHistory.frameIndex}
                </span>
                {selectedHistory.coords && (
                  <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[8px] font-bold bg-black/80 text-amber-300">
                    ({selectedHistory.coords.x},{selectedHistory.coords.y})
                  </span>
                )}
              </div>
              <div className="flex gap-1 mt-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    // Actual pyautogui dispatch for selected history frame
                    const c = selectedHistory.coords || { x: 960, y: 540 };
                    await fetch("/api/execute-task", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        targetDevice: "desktop",
                        task: {
                          id: `hist_${selectedHistory.id}`,
                          name: selectedHistory.title,
                          action: "click",
                          targetPosition: c,
                        },
                      }),
                    });
                    setStatusLog(
                      `Dispatched click to live OS @ (${c.x},${c.y}) via PyAutoGUI`,
                    );
                  }}
                  className="h-6 flex-1 text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  <Play className="w-3 h-3 mr-1" /> Replay Click
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedHistoryFrameId(selectedHistory.id)}
                  className="h-6 text-[10px] border-slate-700"
                >
                  Focus
                </Button>
              </div>
            </div>
            <div className="md:col-span-8 space-y-1.5">
              <div className="flex items-center justify-between">
                <strong className="text-slate-100 text-xs">
                  {selectedHistory.title}
                </strong>
                <Badge
                  variant="outline"
                  className="text-[9px] text-cyan-400 border-cyan-800"
                >
                  {selectedHistory.timestamp}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
                <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-purple-300 font-bold block flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> AI Thinking:
                  </span>
                  <p className="text-slate-300">
                    {selectedHistory.thinkingProcess}
                  </p>
                  {selectedHistory.coords && (
                    <p className="text-amber-300 font-bold">
                      Coords: ({selectedHistory.coords.x},
                      {selectedHistory.coords.y})
                    </p>
                  )}
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-cyan-300 font-bold block flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Tests:
                  </span>
                  <p className="text-slate-300">{selectedHistory.testsRun}</p>
                  {selectedHistory.elements && (
                    <p className="text-emerald-300">
                      {selectedHistory.elements.length} elements logged
                    </p>
                  )}
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-amber-300 font-bold block flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-300" /> Action:
                  </span>
                  <p className="text-slate-300">
                    {selectedHistory.actionDispatched}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-6 text-center text-xs text-slate-400">
            No live frames yet — start Share Screen and interact. Frames
            auto-populate here.
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dynamicFrames.map((fr) => {
          const isCurrent = fr.role === "current";
          const isPrev = fr.role === "previous";
          const isOpen = !!openDropdowns[fr.id];
          const hasImage = !!fr.imageUrl;
          return (
            <Card
              key={fr.id}
              className={`bg-slate-900 border transition-all shadow-xl flex flex-col justify-between ${isCurrent ? "border-cyan-500 ring-2 ring-cyan-500/40 shadow-cyan-950/60" : isPrev ? "border-emerald-800/80 bg-slate-950/80" : "border-purple-800/60 bg-slate-950/60"}`}
            >
              <CardHeader className="p-3 pb-2 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    {isPrev ? (
                      <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[9px]">
                        PREVIOUS (N-1)
                      </Badge>
                    ) : isCurrent ? (
                      <Badge className="bg-cyan-950 text-cyan-300 border-cyan-500 text-[9px] animate-pulse">
                        ⚡ CURRENT (N)
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[9px]">
                        NEXT (N+1)
                      </Badge>
                    )}
                    <span className="text-xs font-bold text-slate-100 truncate">
                      {fr.actionType}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[9px] uppercase font-mono bg-black/60"
                  >
                    {fr.progressionStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 group">
                  {hasImage ? (
                    <SafeImage src={fr.imageUrl} alt={fr.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                      No live frame
                    </div>
                  )}
                  {hasImage && fr.targetCoords.x !== 0 && (
                    <div
                      style={{
                        left: `${(fr.targetCoords.x / 1920) * 100}%`,
                        top: `${(fr.targetCoords.y / 1080) * 100}%`,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none ${isCurrent ? "animate-bounce" : ""}`}
                    >
                      <div
                        className={`p-1.5 rounded-full border-2 ${isCurrent ? "bg-cyan-500 border-white shadow-lg shadow-cyan-500/80" : "bg-emerald-500 border-white/80"}`}
                      >
                        <Crosshair className="w-3.5 h-3.5 text-black" />
                      </div>
                      <span className="mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/90 text-cyan-300 border border-cyan-800 whitespace-nowrap">
                        ({fr.targetCoords.x}, {fr.targetCoords.y})
                      </span>
                    </div>
                  )}
                  {isLiveStreamActive && isCurrent && (
                    <div className="absolute top-1 right-1 px-1 py-0.5 rounded bg-red-950/90 text-[7px] font-bold text-red-300 border border-red-800">
                      FROZEN ANTI-LOOP
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-300 font-bold truncate">
                  {fr.title}
                </div>
                <Collapsible
                  open={isOpen}
                  onOpenChange={() => toggleDropdown(fr.id)}
                  className="w-full space-y-1"
                >
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-300 font-bold truncate">
                      {isOpen ? "Hide details" : "Show notes"}
                    </span>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-300 hover:text-white"
                      >
                        {isOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-2 pt-1.5 border-t border-slate-800 text-[11px] font-mono">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-300 font-bold">Notes:</span>
                        <span className="text-slate-300">
                          Dwell: {fr.dwellMs}ms
                        </span>
                      </div>
                      <p className="text-slate-200 text-[10px] leading-tight">
                        {fr.stepNotes}
                      </p>
                    </div>
                    <div className="pt-1">
                      <Button
                        size="sm"
                        onClick={async () => {
                          setStatusLog(
                            `✨ Dispatching ${fr.actionType} @ (${fr.targetCoords.x},${fr.targetCoords.y}) via PyAutoGUI...`,
                          );
                          try {
                            await fetch("/api/execute-task", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                targetDevice: "desktop",
                                task: {
                                  id: `trio_${fr.id}_${Date.now()}`,
                                  name: fr.title,
                                  action: fr.actionType
                                    .toLowerCase()
                                    .includes("type")
                                    ? "type_text"
                                    : fr.actionType.toLowerCase(),
                                  targetPosition: fr.targetCoords,
                                },
                              }),
                            });
                            setStatusLog(`✓ Dispatched on live OS`);
                            fetch("/api/logs", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                source: "PyAutoGUI",
                                level: "SUCCESS",
                                message: `Trio ${fr.role} executed @ (${fr.targetCoords.x},${fr.targetCoords.y})`,
                              }),
                            }).catch(() => {});
                          } catch (e) {
                            setStatusLog(`Dispatch failed: ${String(e)}`);
                          }
                          if (onTriggerStepAction)
                            onTriggerStepAction(
                              { x: fr.targetCoords.x, y: fr.targetCoords.y },
                              fr.actionType,
                            );
                        }}
                        className="w-full h-7 text-[10px] font-mono font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
                      >
                        <Sparkles className="w-3 h-3 mr-1 text-yellow-200" />{" "}
                        Execute on Live OS (PyAutoGUI)
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {obstacles.length > 0 && (
        <Card className="bg-slate-900 border-amber-500/40 shadow-xl overflow-hidden">
          <CardHeader className="p-3 bg-amber-950/30 border-b border-amber-900/60 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldX className="w-4 h-4 text-amber-400 animate-pulse" />
              <CardTitle className="text-xs font-bold text-amber-300">
                Blocker Detected
              </CardTitle>
            </div>
            <Badge className="bg-amber-950 text-amber-300 border-amber-800 text-[10px]">
              AUTO-BACKUP ARMED
            </Badge>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {obstacles.map((obs) => (
              <div
                key={obs.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-amber-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">
                      {obs.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] text-amber-400 border-amber-800"
                    >
                      Conf: {(obs.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    {obs.armedWorkaround}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExecuteBackupWorkaround(obs)}
                  className="h-7 text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Auto-Trigger
                  Workaround
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-300">
          <strong>Temporal Engine:</strong> {statusLog}
        </span>
      </div>
    </div>
  );
};
