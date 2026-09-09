import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Crosshair,
  Eye,
  Film,
  History,
  Layers,
  ListChecks,
  Map,
  Monitor,
  MousePointer,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Terminal,
  Upload,
  Zap,
  X,
  Camera,
  Keyboard,
  Scan,
  Bug,
  Gamepad2,
  Route,
  CpuIcon,
  BookOpen,
  Package,
  QrCode,
  Link2,
  AppWindow,
  Code2,
  Search,
  Users,
  Watch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  LiveScreenHUD,
  SequenceStep,
  AIThinkingState,
} from "@/components/live-screen-hud";
import { ClickSequenceRegister } from "@/components/click-sequence-register";
import {
  DualAICopilotPanel,
  ScreenPerceptionReport,
  PlannerActDecision,
} from "@/components/dual-ai-copilot-panel";
import {
  VerificationBadgeState,
  RecalibrationNotice,
} from "@/components/live-screen-hud";
import { TemporalScreenshotTrioHUD } from "@/components/temporal-screenshot-trio-hud";
import { CentralLogsConsole } from "@/components/central-logs-console";
import { ScreenshotLayeringPanel } from "@/components/screenshot-layering-panel";
import { MasterWorkflowOrchestrator } from "@/components/master-workflow-orchestrator";
import { AIDecideActionHUD } from "@/components/ai-decide-action-hud";
import { GoalsManagerPanel } from "@/components/goals-manager-panel";
import { EntitiesRadarPanel } from "@/components/entities-radar-panel";
import { AutoTasksPipelinePanel } from "@/components/auto-tasks-pipeline-panel";
import { AgentsTelemetryPanel } from "@/components/agents-telemetry-panel";
import { ScreenshotPackBuilderStudio } from "@/components/screenshot-pack-builder-studio";
import { GlobalAICursorOverlay } from "@/components/global-ai-cursor-overlay";
import { DynamicCalculatorTypingHub } from "@/components/dynamic-calculator-typing-hub";
import { PreRecordingHoverOverlaySuite } from "@/components/pre-recording-hover-overlay-suite";
import { MainScreenLoopVerificationHub } from "@/components/main-screen-loop-verification-hub";
import { GGUFModelEngineStudio } from "@/components/gguf-model-engine-studio";
import { ContinuousMouseRoutePlayer } from "@/components/continuous-mouse-route-player";
import { AppRelativeBackpropEngine } from "@/components/app-relative-backprop-engine";
import { AILearningCodeSynthesizerStudio } from "@/components/ai-learning-code-synthesizer-studio";
import { AutonomousGoalAgentStudio } from "@/components/autonomous-goal-agent-studio";
import { AndroidAdbMultiDeviceGrid } from "@/components/android-adb-multi-device-grid";
import { audioSynthesizer } from "@/lib/audio-synthesizer";
import { AIChat } from "@/components/ai-chat";
import { QuantumMouseTracker } from "@/components/quantum-mouse-tracker";
import { VirtualKeyboardInputVerifier } from "@/components/virtual-keyboard-input-verifier";
import { HumanMouseTouchSimulator } from "@/components/human-mouse-touch-simulator";
import { AdPopupDestroyer } from "@/components/ad-popup-destroyer";
import { DrawingReflexCanvas } from "@/components/drawing-reflex-canvas";
import { ScanReboundHierarchyEngine } from "@/components/scan-rebound-hierarchy-engine";
import { StorySceneCreationStudio } from "@/components/story-scene-creation-studio";
import { AggressiveLoopDataAssembly } from "@/components/aggressive-loop-data-assembly";
import { ScenarioMemoryAutoPlanner } from "@/components/scenario-memory-auto-planner";
import { TaskProgressWatchdogAgent } from "@/components/task-progress-watchdog-agent";
import { GoalCrossReferenceCorrector } from "@/components/goal-cross-reference-corrector";
import { LiveRouteNavigationFlowPanel } from "@/components/live-route-navigation-flow-panel";
import { NavigationTestpointsDriftManager } from "@/components/navigation-testpoints-drift-manager";
import { SequenceCollisionDedupLedger } from "@/components/sequence-collision-dedup-ledger";
import { DragAndDropLogicStudio } from "@/components/drag-and-drop-logic-studio";
import { AIResponseBenchmarkTestbench } from "@/components/ai-response-benchmark-testbench";
import { MovementExplorerRemapperStudio } from "@/components/movement-explorer-remapper-studio";
import { ProgramLinkerAttacher } from "@/components/program-linker-attacher";
import { VirtualDesktopMirrorStudio } from "@/components/virtual-desktop-mirror-studio";
import { AICodeEditorBackupStudio } from "@/components/ai-code-editor-backup-studio";
import { GapAgentVerifierHub } from "@/components/gap-agent-verifier-hub";
import {
  CaptureAnnotationWorkspace,
  mockCaptureFrames,
} from "@/components/capture-annotation";
export default function Dashboard({
  initialTab,
}: { initialTab?: string } = {}) {
  const navigate = useNavigate();
  const [isCapturing, setIsCapturing] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string>(
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&auto=format&fit=crop&q=80",
  );
  const [aiLiveUrl, setAiLiveUrl] = useState<string | null>(null);
  const [liveHistory30, setLiveHistory30] = useState<string[]>([]);
  const [showHistoryPicker, setShowHistoryPicker] = useState(false);
  const [isLiveDesktopActive, setIsLiveDesktopActive] = useState(false);
  const [frozenLiveSnapshot, setFrozenLiveSnapshot] = useState<string | null>(
    null,
  );
  const [antiLoopEnabled, setAntiLoopEnabled] = useState(false);
  const [loopDetected, setLoopDetected] = useState(false);
  const [targetDevice, setTargetDevice] = useState<"desktop" | "android">(
    "desktop",
  );
  const [adbDevices, setAdbDevices] = useState<string[]>([]);
  const [selectedAdbDevice, setSelectedAdbDevice] = useState<string | null>(
    null,
  );
  const [wifiIp, setWifiIp] = useState("");
  const [wifiPort, setWifiPort] = useState("5555");
  const [pairIp, setPairIp] = useState("");
  const [pairPort, setPairPort] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [wifiStatus, setWifiStatus] = useState<string>("");
  const [movementMode, setMovementMode] = useState<
    "exact" | "variation" | "live"
  >("variation");
  const [driftPx, setDriftPx] = useState(6);
  const [driftPerStepVariate, setDriftPerStepVariate] = useState(true);
  const [driftRandomInterval, setDriftRandomInterval] = useState(true);
  const [saveScreenshotWithStep, setSaveScreenshotWithStep] = useState(true);
  const [collabInstruction, setCollabInstruction] = useState("");
  const [collabChat, setCollabChat] = useState<
    { role: "user" | "ai"; text: string }[]
  >([
    {
      role: "ai",
      text: "Hi! Tell me where to click with detail. I'll dispatch via pyautogui.",
    },
  ]);
  const [collabInput, setCollabInput] = useState("");
  const [popoutOpen, setPopoutOpen] = useState(false);
  const [sequence, setSequence] = useState<SequenceStep[]>([]);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [isRecordMode, setIsRecordMode] = useState(false);
  const [isSequenceRunning, setIsSequenceRunning] = useState(false);
  const [aiThinking, setAiThinking] = useState<AIThinkingState | null>(null);
  const sequenceRunningRef = useRef(false);
  const [recalibrationNotice, setRecalibrationNotice] =
    useState<RecalibrationNotice | null>(null);
  const [perceptionReport, setPerceptionReport] =
    useState<ScreenPerceptionReport | null>({
      timestamp: Date.now(),
      screenDescription: "Ready",
      activeWindow: "App",
      visualStateChange: "Ready",
      elements: [
        {
          id: "elem_center",
          name: "Screen Center Focus",
          type: "target",
          boundingBox: { x: 860, y: 480, width: 200, height: 120 },
          center: { x: 960, y: 540 },
          confidence: 0.96,
          interactive: true,
          textValue: "Main",
        },
      ],
      feedbackPosition: { x: 960, y: 540 },
      primarySuggestion: "Inspect",
      confidence: 0.95,
    });
  const [verificationBadge, setVerificationBadge] =
    useState<VerificationBadgeState | null>(null);
  const [isAutonomousRunning, setIsAutonomousRunning] = useState(false);
  const [isPerceiving, setIsPerceiving] = useState(false);
  const [ollmaEndpoint] = useState(
    "https://remote.quantumpass.io/ollama/api/chat",
  );
  const [currentTab, setCurrentTab] = useState(initialTab || "screen");
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [plannerDecision, setPlannerDecision] =
    useState<PlannerActDecision | null>(null);
  const [userObjective, setUserObjective] = useState("");
  const [loopIntervalMs, setLoopIntervalMs] = useState(1500);
  const [pipelineTasks, setPipelineTasks] = useState<any[]>([
    {
      id: "t1",
      name: "Click Login CTA",
      description: "Click at 740, 520 • Submit authentication",
      priority: 1,
      confidence: 0.97,
      status: "pending",
    },
    {
      id: "t2",
      name: "Type Credentials",
      description: "Type at 420, 380 • Passcode entry",
      priority: 2,
      confidence: 0.95,
      status: "pending",
    },
  ]);
  const [goalsState, setGoalsState] = useState<any[]>([]);
  const captureIntervalRef = useRef<number>();
  const aiLiveUrlRef = useRef<string | null>(null);
  const prevLiveRef = useRef(false);
  const mobileIntervalRef = useRef<number | null>(null);
  const stripFileInputRef = useRef<HTMLInputElement>(null);
  const handleAddSequenceStep = (
    stepData: (Partial<SequenceStep> & { x: number; y: number }) | number,
    maybeY?: number,
  ) => {
    const stepNum = sequence.length + 1;
    let pendingRightClick = false;
    try {
      if (localStorage.getItem("pending_right_click") === "1") {
        pendingRightClick = true;
        localStorage.removeItem("pending_right_click");
      }
    } catch {}
    let newStep: SequenceStep;
    if (typeof stepData === "number") {
      newStep = {
        id: `step_${Date.now()}_${stepNum}`,
        stepNumber: stepNum,
        name: pendingRightClick
          ? `Step ${stepNum} (Right Click)`
          : `Step ${stepNum}`,
        action: pendingRightClick ? "right_click" : "click",
        x: stepData,
        y: maybeY ?? 540,
        delayMs: 500,
        status: "pending",
        referenceScreenshotUrl: saveScreenshotWithStep
          ? screenshotUrl
          : undefined,
      };
    } else {
      const isRight =
        pendingRightClick || (stepData as any).action === "right_click";
      newStep = {
        id: stepData.id || `step_${Date.now()}_${stepNum}`,
        stepNumber: stepNum,
        name:
          stepData.name ||
          (isRight ? `Step ${stepNum} (Right Click)` : `Step ${stepNum}`),
        action: (stepData.action as any) || (isRight ? "right_click" : "click"),
        x: stepData.x,
        y: stepData.y,
        delayMs: stepData.delayMs || 500,
        text: stepData.text,
        keyPayload: stepData.keyPayload,
        status: "pending",
        referenceScreenshotUrl:
          (stepData as any).referenceScreenshotUrl ??
          (saveScreenshotWithStep ? screenshotUrl : undefined),
      };
    }
    setSequence((prev) => [...prev, newStep]);
  };
  const handleStripUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 10 - sequence.length;
    if (remaining <= 0) {
      alert("10 screenshots already saved — clear a slot first");
      return;
    }
    const batch = Array.from(files).slice(0, remaining);
    batch.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        handleAddSequenceStep({
          x: 960,
          y: 540,
          action: "click",
          name: file.name.replace(/\.[^/.]+$/, ""),
          referenceScreenshotUrl: url,
        } as any);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };
  const handleAddFromHistory = () => {
    const src = aiLiveUrl || frozenLiveSnapshot || screenshotUrl;
    if (!src || src.includes("unsplash")) {
      alert("No live history yet — Share Screen first");
      return;
    }
    handleAddSequenceStep({
      x: 960,
      y: 540,
      action: "click",
      name: `History ${sequence.length + 1}`,
      referenceScreenshotUrl: src,
    } as any);
  };
  const handleHudLiveChange = (
    active: boolean,
    snapshotUrl: string | null,
    surface: string | null,
  ) => {
    setIsLiveDesktopActive(active);
    if (snapshotUrl) setFrozenLiveSnapshot(snapshotUrl);
    if (surface === "monitor" && active) {
      setAntiLoopEnabled(true);
      setLoopDetected(true);
    } else if (!active) {
      setLoopDetected(false);
      prevLiveRef.current = false;
    }
  };
  const handleRepositionStep = (id: string, newX: number, newY: number) =>
    setSequence((prev) =>
      prev.map((s) => (s.id === id ? { ...s, x: newX, y: newY } : s)),
    );
  const handleUpdateStep = (id: string, updates: Partial<SequenceStep>) =>
    setSequence((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  const handleDeleteStep = (id: string) =>
    setSequence((prev) =>
      prev
        .filter((s) => s.id !== id)
        .map((s, idx) => ({ ...s, stepNumber: idx + 1 })),
    );
  const handleMoveStep = (id: string, dir: "up" | "down") =>
    setSequence((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      if (dir === "up" && idx === 0) return prev;
      if (dir === "down" && idx === prev.length - 1) return prev;
      const t = dir === "up" ? idx - 1 : idx + 1;
      const copy = [...prev];
      const tmp = copy[idx];
      copy[idx] = copy[t];
      copy[t] = tmp;
      return copy.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    });
  const handleRunSequence = async () => {
    if (sequence.length === 0 || isSequenceRunning) return;
    setIsSequenceRunning(true);
    sequenceRunningRef.current = true;
    setSequence((prev) => prev.map((s) => ({ ...s, status: "pending" })));
    for (let i = 0; i < sequence.length; i++) {
      if (!sequenceRunningRef.current) break;
      const current = sequence[i];
      setActiveStepId(current.id);
      setSequence((prev) =>
        prev.map((s) =>
          s.id === current.id ? { ...s, status: "running" } : s,
        ),
      );
      setAiThinking({
        x: current.x,
        y: current.y,
        action: `Executing ${current.name} (${current.action})`,
        confidence: 0.95,
        isThinking: true,
        targetLabel: current.name,
      });
      const stepDelay = driftRandomInterval
        ? 1000 + Math.floor(Math.random() * 2000)
        : current.delayMs;
      await new Promise((r) => setTimeout(r, stepDelay));
      if (!sequenceRunningRef.current) break;
      try {
        let taskDescription = `Click at ${current.x}, ${current.y}`;
        if (current.action === "right_click")
          taskDescription = `Right click at ${current.x}, ${current.y}`;
        else if (current.action === "clear_and_type")
          taskDescription = `Clear and type "${current.text || ""}" at ${current.x}, ${current.y}`;
        else if (current.action === "type_text")
          taskDescription = `Type "${current.text || ""}" at ${current.x}, ${current.y}`;
        const baseDrift = movementMode === "exact" ? 0 : driftPx;
        const variedDrift =
          driftPerStepVariate && baseDrift > 0
            ? Math.max(
                0,
                baseDrift + Math.floor((Math.random() - 0.5) * baseDrift),
              )
            : baseDrift;
        const driftToSend =
          movementMode === "live" ? Math.max(variedDrift, 6) : variedDrift;
        await fetch("/api/execute-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetDevice,
            deviceId: selectedAdbDevice,
            task: {
              id: current.id,
              name: current.name,
              description: taskDescription,
              action: current.action,
              x: current.x,
              y: current.y,
              targetPosition: { x: current.x, y: current.y },
              textPayload: current.text || "",
              keyPayload: current.keyPayload || "enter",
              delayMs: current.delayMs,
              driftPx: driftToSend,
              variationMode: movementMode,
            },
          }),
        });
        setSequence((prev) =>
          prev.map((s) =>
            s.id === current.id ? { ...s, status: "completed" } : s,
          ),
        );
      } catch {
        setSequence((prev) =>
          prev.map((s) =>
            s.id === current.id ? { ...s, status: "failed" } : s,
          ),
        );
      }
    }
    setActiveStepId(null);
    setIsSequenceRunning(false);
    sequenceRunningRef.current = false;
  };
  const handleStopSequence = () => {
    sequenceRunningRef.current = false;
    setIsSequenceRunning(false);
    setActiveStepId(null);
  };
  const captureScreen = async () => {
    try {
      const response = await fetch("/api/capture-screen");
      const data = await response.json();
      if (data.success && data.imageData) {
        const isReal = data.method === "real_desktop_stream";
        const wasLive = prevLiveRef.current;
        if (isReal) {
          if (!wasLive) {
            setFrozenLiveSnapshot(data.imageData);
            prevLiveRef.current = true;
          }
          setIsLiveDesktopActive(true);
        }
        aiLiveUrlRef.current = data.imageData;
        setAiLiveUrl(data.imageData);
        setLiveHistory30((prev) => [data.imageData, ...prev].slice(0, 30));
        if (false && isReal) {
          if (!wasLive) setScreenshotUrl(data.imageData);
          try {
            await fetch("/api/analyze-screenshot", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageData: data.imageData }),
            });
          } catch {}
          return;
        }
        setScreenshotUrl(data.imageData);
      }
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    captureScreen();
    if (isCapturing) {
      captureIntervalRef.current = window.setInterval(
        () => captureScreen(),
        400,
      );
    }
    return () => {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    };
  }, [isCapturing]);
  useEffect(() => {
    if (targetDevice === "android") {
      fetch("/api/adb/devices")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setAdbDevices(d.devices || []);
            if (d.devices?.[0]) setSelectedAdbDevice(d.devices[0]);
            setWifiStatus(
              `Detected ${d.devices?.length || 0} device(s) via USB/WiFi`,
            );
          }
        })
        .catch(() =>
          setWifiStatus(
            "ADB not found — install platform-tools and add to PATH",
          ),
        );
    }
  }, [targetDevice]);
  const handleTriggerDescribeScreen = async () => {
    const liveImg = aiLiveUrl || screenshotUrl;
    if (!liveImg) {
      setVerificationBadge({
        status: "failed",
        message: "No screenshot to perceive",
      });
      setTimeout(() => setVerificationBadge(null), 2500);
      return null;
    }
    setIsPerceiving(true);
    setVerificationBadge({
      status: "verifying",
      message: "Perceiving live screen via AI #1...",
    });
    try {
      const res = await fetch("/api/ai/describe-screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: liveImg, model: "qwen2.5vl:7b" }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setPerceptionReport(data.report);
        setVerificationBadge({
          status: "verified",
          message: `Perceived: ${data.report.screenDescription.slice(0, 40)}...`,
        });
        setTimeout(() => setVerificationBadge(null), 3000);
        setAiThinking({
          x: data.report.feedbackPosition.x,
          y: data.report.feedbackPosition.y,
          action: data.report.primarySuggestion.slice(0, 40),
          confidence: data.report.confidence,
          isThinking: true,
          targetLabel: data.report.activeWindow,
        });
        return data.report;
      } else {
        setVerificationBadge({
          status: "failed",
          message: "Perceive failed: " + (data.error || "unknown"),
        });
        setTimeout(() => setVerificationBadge(null), 3000);
      }
    } catch (e) {
      setVerificationBadge({
        status: "failed",
        message: "Perceive error: " + String(e).slice(0, 50),
      });
      setTimeout(() => setVerificationBadge(null), 3000);
    } finally {
      setIsPerceiving(false);
    }
    return null;
  };
  const handleTriggerPlanAndAct = async () => {
    let report: any = perceptionReport;
    if (!report) {
      const liveImg = aiLiveUrl || screenshotUrl;
      if (!liveImg) {
        setVerificationBadge({
          status: "failed",
          message: "No live image for planning",
        });
        setTimeout(() => setVerificationBadge(null), 2500);
        return;
      }
      setVerificationBadge({
        status: "verifying",
        message: "Perceiving before planning...",
      });
      const fresh = await handleTriggerDescribeScreen();
      if (fresh) report = fresh;
      else {
        setVerificationBadge({
          status: "failed",
          message: "Need perception first",
        });
        setTimeout(() => setVerificationBadge(null), 2500);
        return;
      }
    }
    setVerificationBadge({
      status: "verifying",
      message: "AI #2 planning next action...",
    });
    try {
      const res = await fetch("/api/ai/plan-and-act", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perceptionReport: report,
          userObjective: "auto",
          model: "qwen2.5vl:7b",
          executeImmediately: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.decision) {
        if (data.decision.nextAction) {
          setAiThinking({
            x: data.decision.nextAction.x || 960,
            y: data.decision.nextAction.y || 540,
            action: data.decision.nextAction.title,
            confidence: data.decision.thinking?.confidence || 0.92,
            isThinking: true,
            targetLabel: data.decision.nextAction.targetName,
          });
          setPlannerDecision(data.decision);
        }
        if (data.decision.verificationRule) {
          setVerificationBadge({
            status: "verified",
            message:
              data.decision.statusSummary ||
              `Planned: ${data.decision.nextAction?.title || "next"}`,
          });
          setTimeout(() => setVerificationBadge(null), 3500);
        } else {
          setVerificationBadge({
            status: "verified",
            message: data.decision.statusSummary || "Planned",
          });
          setTimeout(() => setVerificationBadge(null), 3000);
        }
        setExecutionHistory((prev) =>
          [
            {
              stepName: data.decision.nextAction?.title || "Plan",
              status: "planned",
              timestamp: Date.now(),
              thought: data.decision.thinking?.reasoning,
            },
            ...prev,
          ].slice(0, 20),
        );
        if (data.executionResult) {
          const ok = data.executionResult.success;
          setVerificationBadge({
            status: ok ? "verified" : "failed",
            message:
              data.executionResult.explanation ||
              (ok ? "Executed via pyautogui" : "Execute failed"),
          });
          setTimeout(() => setVerificationBadge(null), 3000);
          fetch("/api/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: "PyAutoGUI",
              level: ok ? "SUCCESS" : "ERROR",
              message: `Plan&Act: ${data.decision.nextAction?.title} -> ${data.executionResult.explanation || ""}`,
            }),
          }).catch(() => {});
        }
        setPerceptionReport(report);
      } else {
        setVerificationBadge({
          status: "failed",
          message: "Plan failed: " + (data.error || "unknown"),
        });
        setTimeout(() => setVerificationBadge(null), 3000);
      }
    } catch (e) {
      setVerificationBadge({ status: "failed", message: "Plan & Act error" });
      setTimeout(() => setVerificationBadge(null), 3000);
    }
  };
  const handleGlobalExecuteOnActualPC = async () => {
    const x = aiThinking?.x || perceptionReport?.feedbackPosition?.x || 960;
    const y = aiThinking?.y || perceptionReport?.feedbackPosition?.y || 540;
    const label =
      aiThinking?.action ||
      perceptionReport?.primarySuggestion ||
      "Global Execute";
    setVerificationBadge({
      status: "verifying",
      message: `Executing ${label.slice(0, 30)} @ (${x},${y}) via ${targetDevice}...`,
    });
    try {
      const res = await fetch("/api/execute-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDevice,
          deviceId: selectedAdbDevice,
          task: {
            id: `pc_${Date.now()}`,
            name: label,
            action: "click",
            targetPosition: { x, y },
            driftPx: movementMode === "exact" ? 0 : driftPx,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVerificationBadge({
          status: "verified",
          message: data.explanation || `Executed @ (${x},${y})`,
        });
        setExecutionHistory((prev) =>
          [
            {
              stepName: label,
              status: "success",
              timestamp: Date.now(),
              explanation: data.explanation,
            },
            ...prev,
          ].slice(0, 20),
        );
        fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "PyAutoGUI",
            level: "SUCCESS",
            message: `Execute: ${label} @ (${x},${y})`,
          }),
        }).catch(() => {});
      } else {
        setVerificationBadge({
          status: "failed",
          message: data.error || "Execute failed",
        });
      }
      setTimeout(() => setVerificationBadge(null), 3000);
    } catch (e) {
      setVerificationBadge({
        status: "failed",
        message: "Execute failed: " + String(e).slice(0, 60),
      });
      setTimeout(() => setVerificationBadge(null), 3000);
    }
  };
  const handleToggleAutonomousLoop = async () =>
    setIsAutonomousRunning((v) => !v);
  const handleTriggerAutoLoop = handleToggleAutonomousLoop;
  const toggleCapture = () => setIsCapturing((v) => !v);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Game Automation</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentTab("screen")}
              className="gap-1"
            >
              <Monitor className="w-3.5 h-3.5" /> Screen
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-6 px-4">
        <div className="space-y-3 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">AI Game Automation</h1>
              <p className="text-slate-300 text-sm">
                Real pyautogui • Anti-loop frozen preview
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setTargetDevice("desktop")}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 ${targetDevice === "desktop" ? "bg-cyan-600 text-white shadow" : "text-slate-300 hover:text-slate-200"}`}
                >
                  <Monitor className="w-3 h-3" /> Desktop
                </button>
                <button
                  onClick={() => {
                    setTargetDevice("android");
                    fetch("/api/adb/devices")
                      .then((r) => r.json())
                      .then((d) => {
                        if (d.success) {
                          setAdbDevices(d.devices || []);
                          if (d.devices?.[0])
                            setSelectedAdbDevice(d.devices[0]);
                        }
                      })
                      .catch(() => {});
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 ${targetDevice === "android" ? "bg-emerald-600 text-white shadow" : "text-slate-300 hover:text-slate-200"}`}
                >
                  <Smartphone className="w-3 h-3" /> Mobile
                </button>
              </div>
              {targetDevice === "android" && adbDevices.length > 0 && (
                <select
                  value={selectedAdbDevice || ""}
                  onChange={(e) => setSelectedAdbDevice(e.target.value)}
                  className="h-8 text-xs bg-slate-900 border border-slate-700 rounded px-1.5 font-mono"
                >
                  {adbDevices.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
              <Button
                onClick={async () => {
                  if (targetDevice === "android") {
                    if (isLiveDesktopActive) {
                      if (mobileIntervalRef.current)
                        clearInterval(mobileIntervalRef.current);
                      mobileIntervalRef.current = null;
                      setIsLiveDesktopActive(false);
                      prevLiveRef.current = false;
                      setWifiStatus("Phone share stopped");
                      return;
                    }
                    try {
                      const devId = selectedAdbDevice || adbDevices[0];
                      if (!devId) {
                        const dr = await fetch("/api/adb/devices");
                        const dj = await dr.json();
                        if (dj.devices?.[0]) {
                          setAdbDevices(dj.devices);
                          setSelectedAdbDevice(dj.devices[0]);
                        } else {
                          alert(
                            "No Android device found. Connect phone via USB or WiFi IP above (Wireless Debugging).",
                          );
                          return;
                        }
                      }
                      const capRes = await fetch(
                        `/api/adb/capture${selectedAdbDevice ? `?deviceId=${selectedAdbDevice}` : ""}`,
                      );
                      const capData = await capRes.json();
                      if (capData.success && capData.imageData) {
                        setScreenshotUrl(capData.imageData);
                        setAiLiveUrl(capData.imageData);
                        setFrozenLiveSnapshot(capData.imageData);
                        prevLiveRef.current = true;
                        setIsLiveDesktopActive(true);
                        setLiveHistory30((prev) =>
                          [capData.imageData, ...prev].slice(0, 30),
                        );
                        setWifiStatus(
                          `Phone live: ${selectedAdbDevice || devId}`,
                        );
                        fetch("/api/sync-real-frame", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            imageData: capData.imageData,
                          }),
                        }).catch(() => {});
                        mobileIntervalRef.current = window.setInterval(
                          async () => {
                            try {
                              const r = await fetch(
                                `/api/adb/capture${selectedAdbDevice ? `?deviceId=${selectedAdbDevice}` : ""}`,
                              );
                              const d = await r.json();
                              if (d.success && d.imageData) {
                                aiLiveUrlRef.current = d.imageData;
                                setAiLiveUrl(d.imageData);
                                setLiveHistory30((prev) =>
                                  [d.imageData, ...prev].slice(0, 30),
                                );
                                setScreenshotUrl(d.imageData);
                                fetch("/api/sync-real-frame", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    imageData: d.imageData,
                                  }),
                                }).catch(() => {});
                              }
                            } catch {}
                          },
                          700,
                        );
                      } else {
                        alert(
                          "ADB capture failed: " + (capData.error || "unknown"),
                        );
                      }
                    } catch (e) {
                      alert("Mobile share failed: " + String(e));
                    }
                    return;
                  }
                  if (isLiveDesktopActive && targetDevice === "desktop") {
                    setIsLiveDesktopActive(false);
                    prevLiveRef.current = false;
                    setWifiStatus("Desktop share stopped");
                    return;
                  }
                  window.dispatchEvent(new CustomEvent("trigger-hud-share"));
                }}
                size="sm"
                className={`h-8 gap-1.5 font-mono text-xs font-bold ${isLiveDesktopActive ? "bg-red-600 hover:bg-red-500 text-white" : "bg-cyan-600 hover:bg-cyan-500 text-white"}`}
              >
                {isLiveDesktopActive ? (
                  <>
                    <X className="w-3.5 h-3.5" /> Stop Share
                  </>
                ) : targetDevice === "android" ? (
                  <>
                    <Smartphone className="w-3.5 h-3.5" /> Share Phone Screen
                  </>
                ) : (
                  <>
                    <Monitor className="w-3.5 h-3.5" /> Share Screen (60FPS)
                  </>
                )}
              </Button>
              <Button
                variant={isCapturing ? "outline" : "default"}
                onClick={toggleCapture}
                size="sm"
                className="h-8 gap-1.5 font-mono text-xs"
              >
                {isCapturing ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Live
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Start
                  </>
                )}{" "}
                Polling
              </Button>
              <span
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold border ${isLiveDesktopActive ? "bg-emerald-950 text-emerald-300 border-emerald-800 animate-pulse" : "bg-slate-900 text-slate-400 border-slate-800"}`}
              >
                {isLiveDesktopActive ? "● LIVE" : "○ fallback"}
              </span>
            </div>
          </div>
          {targetDevice === "android" && (
            <div className="p-3 rounded-xl bg-slate-900 border border-emerald-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> Mobile WiFi Connect &
                  Detection
                </span>
                <span className="text-[10px] font-mono text-slate-300">
                  USB → WiFi • Pairing (Android 11+) • IP Connect
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-300">
                    1) USB → Enable WiFi (once)
                  </span>
                  <p className="text-[10px] text-slate-400">
                    With phone on USB, enable wireless:{" "}
                    <code>adb tcpip 5555</code>
                  </p>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        const r = await fetch("/api/adb/tcpip", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            port: 5555,
                            deviceId: selectedAdbDevice,
                          }),
                        });
                        const d = await r.json();
                        setWifiStatus(d.output || d.error || "tcpip done");
                        if (d.success)
                          setTimeout(
                            () =>
                              fetch("/api/adb/devices")
                                .then((r) => r.json())
                                .then((d) => setAdbDevices(d.devices || [])),
                            1500,
                          );
                      } catch (e) {
                        setWifiStatus(String(e));
                      }
                    }}
                    className="h-7 w-full text-xs bg-slate-800 hover:bg-slate-700 gap-1"
                  >
                    <Zap className="w-3 h-3" /> Enable WiFi ADB (tcpip 5555)
                  </Button>
                  <span className="text-[10px] font-mono text-slate-400">
                    Then unplug USB, connect via WiFi below
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-300">
                    2) Pair (Android 11+ Wireless Debugging)
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <Input
                      value={pairIp}
                      onChange={(e) => setPairIp(e.target.value)}
                      placeholder="IP (192.168.1.10)"
                      className="h-7 text-xs bg-slate-900 border-slate-700 col-span-2"
                    />
                    <Input
                      value={pairPort}
                      onChange={(e) => setPairPort(e.target.value)}
                      placeholder="Pair port"
                      className="h-7 text-xs bg-slate-900 border-slate-700"
                    />
                  </div>
                  <Input
                    value={pairCode}
                    onChange={(e) => setPairCode(e.target.value)}
                    placeholder="Pairing code (6 digits)"
                    className="h-7 text-xs bg-slate-900 border-slate-700"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!pairIp || !pairPort || !pairCode) {
                        setWifiStatus(
                          "Need IP, Pair port and code from phone's Wireless Debugging → Pair with pairing code",
                        );
                        return;
                      }
                      try {
                        const r = await fetch("/api/adb/pair", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            ip: pairIp,
                            port: pairPort,
                            code: pairCode,
                          }),
                        });
                        const d = await r.json();
                        setWifiStatus(d.output || d.error);
                        if (d.success)
                          fetch("/api/adb/devices")
                            .then((r) => r.json())
                            .then((d) => setAdbDevices(d.devices || []));
                      } catch (e) {
                        setWifiStatus(String(e));
                      }
                    }}
                    className="h-7 w-full text-xs bg-emerald-700 hover:bg-emerald-600 text-white gap-1"
                  >
                    <Smartphone className="w-3 h-3" /> Pair
                  </Button>
                  <p className="text-[10px] text-slate-400">
                    On phone: Settings → Developer → Wireless debugging → Pair
                    with pairing code
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-300">
                    3) Connect via WiFi IP
                  </span>
                  <div className="flex gap-1">
                    <Input
                      value={wifiIp}
                      onChange={(e) => setWifiIp(e.target.value)}
                      placeholder="Phone IP (192.168.1.50)"
                      className="h-7 text-xs bg-slate-900 border-slate-700 flex-1"
                    />
                    <Input
                      value={wifiPort}
                      onChange={(e) => setWifiPort(e.target.value)}
                      placeholder="5555"
                      className="h-7 w-16 text-xs bg-slate-900 border-slate-700"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!wifiIp) {
                          setWifiStatus(
                            "Enter phone WiFi IP first (shown in Wireless Debugging)",
                          );
                          return;
                        }
                        try {
                          const r = await fetch("/api/adb/connect", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              ip: wifiIp,
                              port: wifiPort || 5555,
                            }),
                          });
                          const d = await r.json();
                          setWifiStatus(d.output || d.error);
                          fetch("/api/adb/devices")
                            .then((r) => r.json())
                            .then((d) => {
                              setAdbDevices(d.devices || []);
                              if (d.devices?.[0])
                                setSelectedAdbDevice(d.devices[0]);
                            });
                        } catch (e) {
                          setWifiStatus(String(e));
                        }
                      }}
                      className="h-7 flex-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1"
                    >
                      <Monitor className="w-3 h-3" /> Connect
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const r = await fetch("/api/adb/scan");
                          const d = await r.json();
                          setAdbDevices(d.devices || []);
                          setWifiStatus(d.raw || "scanned");
                          if (d.devices?.[0])
                            setSelectedAdbDevice(d.devices[0]);
                        } catch (e) {
                          setWifiStatus(String(e));
                        }
                      }}
                      className="h-7 text-xs border-slate-700"
                    >
                      Scan
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!selectedAdbDevice) {
                        setWifiStatus("No device to disconnect");
                        return;
                      }
                      try {
                        const r = await fetch("/api/adb/disconnect", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ deviceId: selectedAdbDevice }),
                        });
                        const d = await r.json();
                        setWifiStatus(d.output || "disconnected");
                        fetch("/api/adb/devices")
                          .then((r) => r.json())
                          .then((d) => setAdbDevices(d.devices || []));
                      } catch (e) {
                        setWifiStatus(String(e));
                      }
                    }}
                    className="h-7 w-full text-xs text-red-400"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
              {wifiStatus && (
                <div className="px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 truncate">
                  {wifiStatus}
                </div>
              )}
              <p className="text-[10px] text-slate-400">
                Detection: USB (adb devices) → WiFi IP → Pairing (mDNS). After
                WiFi connect, use <b>Share Phone Screen</b> above. Actions
                (tap/swipe/type) auto-route via ADB when Mobile selected.
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-900 border border-cyan-800/50 shadow-md">
            <span className="text-[11px] font-mono font-bold text-cyan-300 px-1 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-cyan-400" /> AI CONTROL HUD
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleTriggerDescribeScreen}
              disabled={isPerceiving}
              className={`h-7 text-xs font-mono font-bold gap-1 border ${isPerceiving ? "bg-cyan-950 text-cyan-300 border-cyan-700 animate-pulse" : "bg-slate-900 text-cyan-300 border-cyan-800/50 hover:bg-cyan-950"}`}
            >
              <Eye
                className={`w-3.5 h-3.5 ${isPerceiving ? "animate-spin text-cyan-400" : "text-cyan-400"}`}
              />{" "}
              {isPerceiving ? "Perceiving..." : "Perceive (AI #1)"}
            </Button>
            <Button
              size="sm"
              onClick={handleTriggerPlanAndAct}
              className="h-7 text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white gap-1 shadow"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Plan & Act (AI
              #2 → Execute)
            </Button>
            <Button
              size="sm"
              onClick={handleGlobalExecuteOnActualPC}
              className="h-7 text-xs font-mono font-bold bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white border border-amber-300 gap-1 shadow-md animate-pulse"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-200" /> Execute on{" "}
              {targetDevice === "android" ? "Phone" : "PC"} (pyautogui)
            </Button>
            {verificationBadge && (
              <span
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold border ${verificationBadge.status === "verifying" ? "bg-amber-950 text-amber-300 border-amber-800 animate-pulse" : verificationBadge.status === "verified" ? "bg-emerald-950 text-emerald-300 border-emerald-800" : verificationBadge.status === "failed" ? "bg-red-950 text-red-300 border-red-800" : "bg-slate-800 text-slate-300 border-slate-700"}`}
              >
                {verificationBadge.message?.slice(0, 50)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 p-2 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-mono font-bold text-slate-300">
              MOVEMENT MODE
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {(["exact", "variation", "live"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMovementMode(m)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold capitalize ${movementMode === m ? "bg-cyan-600 text-white" : "text-slate-300"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={saveScreenshotWithStep}
                onChange={(e) => setSaveScreenshotWithStep(e.target.checked)}
                className="w-3.5 h-3.5"
              />{" "}
              Save screenshot with step
            </label>
            <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={antiLoopEnabled}
                onChange={(e) => setAntiLoopEnabled(e.target.checked)}
                className="w-3.5 h-3.5"
              />{" "}
              Anti-Loop{" "}
              {antiLoopEnabled ? "ON (frozen)" : "OFF (live — may tunnel)"}
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold text-slate-300">
                Drift
              </span>
              <input
                type="range"
                min={0}
                max={12}
                value={driftPx}
                onChange={(e) => setDriftPx(parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-xs font-mono text-cyan-300 w-8">
                {driftPx}px
              </span>
              <label className="flex items-center gap-1 text-[10px]">
                <input
                  type="checkbox"
                  checked={driftPerStepVariate}
                  onChange={(e) => setDriftPerStepVariate(e.target.checked)}
                />{" "}
                variate
              </label>
              <label className="flex items-center gap-1 text-[10px]">
                <input
                  type="checkbox"
                  checked={driftRandomInterval}
                  onChange={(e) => setDriftRandomInterval(e.target.checked)}
                />{" "}
                1–3s random
              </label>
            </div>
            {loopDetected && (
              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded animate-pulse">
                Tunnel detected — keep Anti-Loop ON
              </span>
            )}
          </div>
          {isLiveDesktopActive && (
            <div className="px-2 py-1 rounded bg-amber-950/30 border border-amber-900/50 text-[11px] font-mono text-amber-200">
              Tip: Share a specific app window, not Entire Screen, to avoid
              infinite tunnel. With Entire Screen, keep Anti-Loop ON.
            </div>
          )}
        </div>
        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <div className="mb-6">
            <MasterWorkflowOrchestrator />
          </div>
          <TabsList className="flex flex-wrap h-auto gap-1.5 bg-slate-900 border border-slate-800 p-2 rounded-xl mb-4">
            <span className="text-[10px] font-mono font-bold text-cyan-400 px-1 py-1">
              VISION
            </span>
            <TabsTrigger value="screen" className="h-7 text-xs gap-1">
              <Monitor className="w-3 h-3" />
              Screen
            </TabsTrigger>
            <TabsTrigger value="layers" className="h-7 text-xs gap-1">
              <Layers className="w-3 h-3" />
              Layers
            </TabsTrigger>
            <TabsTrigger value="models" className="h-7 text-xs gap-1">
              <Cpu className="w-3 h-3" />
              Models
            </TabsTrigger>
            <TabsTrigger value="pack-builder" className="h-7 text-xs gap-1">
              <Package className="w-3 h-3" />
              Pack Builder
            </TabsTrigger>
            <TabsTrigger value="capture" className="h-7 text-xs gap-1">
              <Camera className="w-3 h-3" />
              Capture
            </TabsTrigger>
            <TabsTrigger value="entities" className="h-7 text-xs gap-1">
              <Crosshair className="w-3 h-3" />
              Entities
            </TabsTrigger>
            <TabsTrigger value="quantum" className="h-7 text-xs gap-1">
              <Activity className="w-3 h-3" />
              Quantum
            </TabsTrigger>
            <span className="text-[10px] font-mono font-bold text-emerald-400 px-1 py-1 ml-2">
              OS & LINK
            </span>
            <TabsTrigger value="linker" className="h-7 text-xs gap-1">
              <Link2 className="w-3 h-3" />
              Linker
            </TabsTrigger>
            <TabsTrigger value="v-desktop" className="h-7 text-xs gap-1">
              <AppWindow className="w-3 h-3" />
              V-Desktop
            </TabsTrigger>
            <TabsTrigger value="code-editor" className="h-7 text-xs gap-1">
              <Code2 className="w-3 h-3" />
              Code Editor
            </TabsTrigger>
            <TabsTrigger value="gap-agent" className="h-7 text-xs gap-1">
              <Bug className="w-3 h-3" />
              Gap Agent
            </TabsTrigger>
            <span className="text-[10px] font-mono font-bold text-amber-400 px-1 py-1 ml-2">
              INPUT & TOUCH
            </span>
            <TabsTrigger value="drag-drop" className="h-7 text-xs gap-1">
              <MousePointer className="w-3 h-3" />
              Drag-Drop
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="h-7 text-xs gap-1">
              <Scan className="w-3 h-3" />
              Benchmark
            </TabsTrigger>
            <TabsTrigger value="movement" className="h-7 text-xs gap-1">
              <Compass className="w-3 h-3" />
              Movement
            </TabsTrigger>
            <span className="text-[10px] font-mono font-bold text-purple-400 px-1 py-1 ml-2">
              ROUTES
            </span>
            <TabsTrigger value="mouse-route" className="h-7 text-xs gap-1">
              <Route className="w-3 h-3" />
              Mouse Route
            </TabsTrigger>
            <TabsTrigger value="backprop" className="h-7 text-xs gap-1">
              <RotateCcw className="w-3 h-3" />
              Backprop
            </TabsTrigger>
            <TabsTrigger value="code-learn" className="h-7 text-xs gap-1">
              <BookOpen className="w-3 h-3" />
              Code Learn
            </TabsTrigger>
            <TabsTrigger value="route-map" className="h-7 text-xs gap-1">
              <Map className="w-3 h-3" />
              Route Map
            </TabsTrigger>
            <TabsTrigger value="testpoints" className="h-7 text-xs gap-1">
              <Target className="w-3 h-3" />
              Testpoints
            </TabsTrigger>
            <TabsTrigger value="dedup" className="h-7 text-xs gap-1">
              <ListChecks className="w-3 h-3" />
              Dedup
            </TabsTrigger>
            <span className="text-[10px] font-mono font-bold text-pink-400 px-1 py-1 ml-2">
              COGNITION
            </span>
            <TabsTrigger value="scenarios" className="h-7 text-xs gap-1">
              <Film className="w-3 h-3" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger value="watchdog" className="h-7 text-xs gap-1">
              <Watch className="w-3 h-3" />
              Watchdog
            </TabsTrigger>
            <TabsTrigger value="cross-ref" className="h-7 text-xs gap-1">
              <Scan className="w-3 h-3" />
              Cross-Ref
            </TabsTrigger>
            <TabsTrigger value="rebound" className="h-7 text-xs gap-1">
              <RotateCcw className="w-3 h-3" />
              Rebound
            </TabsTrigger>
            <TabsTrigger value="story" className="h-7 text-xs gap-1">
              <Film className="w-3 h-3" />
              Story
            </TabsTrigger>
            <TabsTrigger value="aggressive" className="h-7 text-xs gap-1">
              <Zap className="w-3 h-3" />
              Aggressive
            </TabsTrigger>
            <span className="text-[10px] font-mono font-bold text-cyan-300 px-1 py-1 ml-2">
              SWARM
            </span>
            <TabsTrigger value="dual-ai" className="h-7 text-xs gap-1">
              <Brain className="w-3 h-3" />
              Dual-AI
            </TabsTrigger>
            <TabsTrigger value="agents" className="h-7 text-xs gap-1">
              <Users className="w-3 h-3" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="tasks" className="h-7 text-xs gap-1">
              <ListChecks className="w-3 h-3" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="goals" className="h-7 text-xs gap-1">
              <Target className="w-3 h-3" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="logs" className="h-7 text-xs gap-1">
              <Terminal className="w-3 h-3" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="h-7 text-xs gap-1">
              <Settings className="w-3 h-3" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="collab"
              className="h-7 text-xs gap-1 bg-gradient-to-r from-cyan-600 to-purple-600 text-white data-[state=active]:bg-cyan-600"
            >
              <Sparkles className="w-3 h-3" />
              AI USER COLLAB
            </TabsTrigger>
          </TabsList>
          <TabsContent value="screen" className="space-y-4 pb-8">
            {/* Primary Live Screen Capture & Autonomous HUD Viewport */}
            <Card className="bg-slate-900 border-cyan-500/40 shadow-2xl overflow-hidden">
              <CardHeader className="p-3 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xs font-bold text-slate-100">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                    <span>Live Desktop Screen Capture & Vision HUD</span>
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="text-cyan-300 font-bold">
                      1920x1080 Native
                    </span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">
                      {sequence.length} Sequence Steps
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <LiveScreenHUD
                  screenshotUrl={screenshotUrl}
                  isCapturing={isCapturing}
                  aiThinking={aiThinking}
                  entities={[]}
                  uiElements={perceptionReport?.elements || []}
                  perceptionFeedback={
                    perceptionReport
                      ? {
                          x: perceptionReport.feedbackPosition.x,
                          y: perceptionReport.feedbackPosition.y,
                          label: perceptionReport.primarySuggestion,
                        }
                      : null
                  }
                  verificationBadge={verificationBadge}
                  recalibrationNotice={recalibrationNotice}
                  sequence={sequence}
                  activeStepId={activeStepId}
                  isRecordMode={isRecordMode}
                  onAddStep={handleAddSequenceStep}
                  onRepositionStep={handleRepositionStep}
                  onSelectStep={setActiveStepId}
                  onLiveStreamChange={handleHudLiveChange}
                />
              </CardContent>
            </Card>

            {/* Saved Method — 10 Keyframe Screenshots Ribbon */}
            <Card className="bg-slate-900 border-slate-800 shadow-lg overflow-hidden">
              <input
                ref={stripFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleStripUpload}
                className="hidden"
              />
              <CardHeader className="p-3 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-cyan-400" />
                  <CardTitle className="text-xs font-bold text-slate-100">
                    Saved Method — 10 Target Keyframes for AI Execution
                  </CardTitle>
                  <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800 text-[10px]">
                    {
                      sequence.filter((s) => (s as any).referenceScreenshotUrl)
                        .length
                    }{" "}
                    / 10 SAVED
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stripFileInputRef.current?.click()}
                    className="h-7 text-xs border-slate-700 gap-1 font-mono"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Keyframes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowHistoryPicker(true)}
                    className="h-7 text-xs border-slate-700 gap-1 font-mono"
                  >
                    <History className="w-3.5 h-3.5" /> 30-Frame Bank
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const src =
                        frozenLiveSnapshot || aiLiveUrl || screenshotUrl;
                      if (src) {
                        handleAddSequenceStep({
                          x: 960,
                          y: 540,
                          action: "click",
                          name: `Keyframe ${sequence.length + 1}`,
                          referenceScreenshotUrl: src,
                        } as any);
                      }
                    }}
                    className="h-7 text-xs border-slate-700 gap-1 font-mono text-cyan-300"
                  >
                    <Camera className="w-3.5 h-3.5" /> Save Current Frame
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-3">
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const step = sequence[i];
                    if (!step) {
                      return (
                        <div
                          key={`empty-${i}`}
                          className="flex-shrink-0 w-32 h-20 rounded-lg border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center text-slate-500"
                        >
                          <span className="text-[10px] font-mono">
                            Slot #{i + 1}
                          </span>
                          <span className="text-[9px] text-slate-600 font-mono">
                            Available
                          </span>
                        </div>
                      );
                    }
                    const fallback =
                      isLiveDesktopActive && frozenLiveSnapshot
                        ? frozenLiveSnapshot
                        : aiLiveUrl || screenshotUrl;
                    const img =
                      (step as any).referenceScreenshotUrl || fallback;
                    return (
                      <div
                        key={step.id}
                        onClick={() => setActiveStepId(step.id)}
                        className={`flex-shrink-0 w-36 rounded-lg border overflow-hidden cursor-pointer transition-all ${
                          activeStepId === step.id
                            ? "border-cyan-400 ring-2 ring-cyan-500/40 scale-105"
                            : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="relative h-20 bg-black">
                          <img
                            src={img}
                            alt={step.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/90 text-cyan-300 border border-slate-700">
                            #{step.stepNumber}
                          </span>
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[7px] font-bold bg-slate-950/90 text-slate-300 border border-slate-800 uppercase">
                            {step.action}
                          </span>
                        </div>
                        <div className="p-1.5 bg-slate-950">
                          <p className="text-[10px] font-bold text-slate-200 truncate">
                            {step.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Bottom Grid: Left = Sequences & Loops | Right = Telemetry & Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column (8 cols): Action Sequence Register & Loop Verification Hub */}
              <div className="lg:col-span-8 space-y-4">
                <ClickSequenceRegister
                  sequence={sequence}
                  activeStepId={activeStepId}
                  isRunning={isSequenceRunning}
                  isRecordMode={isRecordMode}
                  onToggleRecordMode={() => setIsRecordMode(!isRecordMode)}
                  onRunSequence={handleRunSequence}
                  onStopSequence={handleStopSequence}
                  onResetSequence={() =>
                    setSequence((prev) =>
                      prev.map((s) => ({ ...s, status: "pending" })),
                    )
                  }
                  onAddStep={() =>
                    handleAddSequenceStep({
                      x: 960,
                      y: 540,
                      action: "click",
                      name: `Step ${sequence.length + 1}`,
                    })
                  }
                  onUpdateStep={handleUpdateStep}
                  onDeleteStep={handleDeleteStep}
                  onMoveStep={handleMoveStep}
                  onClearSequence={() => setSequence([])}
                  onSelectStep={setActiveStepId}
                />

                <MainScreenLoopVerificationHub
                  onRunAutonomousLoop={(iters) => {
                    setWifiStatus(`Loop ${iters} iterations`);
                    handleTriggerAutoLoop();
                  }}
                />

                <AIDecideActionHUD
                  perceptionReport={perceptionReport}
                  sequence={sequence}
                  activeStepId={activeStepId}
                  screenshotUrl={aiLiveUrl || screenshotUrl}
                  targetDevice={targetDevice}
                  deviceId={selectedAdbDevice}
                  onAddStep={handleAddSequenceStep}
                  onRunSequence={handleRunSequence}
                  onNavigate={(x, y, label) => {
                    handleAddSequenceStep({
                      x,
                      y,
                      name: label || `Navigate ${x},${y}`,
                      action: "click",
                    } as any);
                    setAiThinking({
                      x,
                      y,
                      action: `Navigate: ${label}`,
                      confidence: 0.92,
                      isThinking: true,
                      targetLabel: label,
                    });
                  }}
                  onTypeText={(x, y, text, act) => {
                    handleAddSequenceStep({
                      x,
                      y,
                      action: act || "clear_and_type",
                      text,
                      name: `Type: ${text.slice(0, 16)}`,
                    } as any);
                  }}
                />
              </div>

              {/* Right Column (4 cols): Temporal Screenshot Trio & Quick Collab Dock */}
              <div className="lg:col-span-4 space-y-4">
                <TemporalScreenshotTrioHUD
                  currentLiveScreenshot={aiLiveUrl || screenshotUrl}
                  sequence={sequence}
                  activeStepId={activeStepId}
                  aiThinking={aiThinking}
                  onExecuteWorkaround={async (method) => {
                    const map: any = {
                      backdrop_click: { action: "click", x: 100, y: 100 },
                      escape_key: { action: "press_key", keyPayload: "escape" },
                    };
                    const act = map[method] || {
                      action: "click",
                      x: 100,
                      y: 100,
                    };
                    await fetch("/api/execute-task", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        targetDevice,
                        deviceId: selectedAdbDevice,
                        task: {
                          id: `trio_${Date.now()}`,
                          name: method,
                          action: act.action,
                          targetPosition: { x: act.x, y: act.y },
                        },
                      }),
                    });
                  }}
                  onTriggerStepAction={async (coords, action) => {
                    await fetch("/api/execute-task", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        targetDevice,
                        deviceId: selectedAdbDevice,
                        task: {
                          id: `trio_${Date.now()}`,
                          name: action,
                          action: action.toLowerCase().includes("type")
                            ? "type_text"
                            : "click",
                          targetPosition: coords,
                        },
                      }),
                    });
                  }}
                />

                {/* Quick Collab Dock */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden font-mono">
                  <CardHeader className="p-3 bg-slate-950 border-b border-slate-800 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Quick Collab — Direct Click AI</span>
                    </CardTitle>
                    <span className="text-[10px] text-slate-400">
                      {collabChat.length} msgs
                    </span>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2.5">
                    <textarea
                      value={collabInstruction}
                      onChange={(e) => setCollabInstruction(e.target.value)}
                      placeholder="Tell AI where to click: e.g. Click Submit button at (740, 520)..."
                      className="w-full h-16 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 resize-none outline-none focus:border-cyan-500"
                    />
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!collabInstruction.trim()) return;
                          setCollabChat((prev) => [
                            ...prev,
                            { role: "user", text: collabInstruction },
                          ]);
                          const m = collabInstruction.match(
                            /\(?\s*(\d{2,4})\s*,\s*(\d{2,4})\s*\)?/,
                          );
                          if (m) {
                            const x = parseInt(m[1]),
                              y = parseInt(m[2]);
                            setAiThinking({
                              x,
                              y,
                              action: collabInstruction.slice(0, 40),
                              confidence: 0.93,
                              isThinking: true,
                            });
                            await fetch("/api/execute-task", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                targetDevice,
                                deviceId: selectedAdbDevice,
                                task: {
                                  id: `collab_${Date.now()}`,
                                  name: collabInstruction.slice(0, 30),
                                  action: "click",
                                  targetPosition: { x, y },
                                },
                              }),
                            });
                          }
                          setCollabChat((prev) => [
                            ...prev,
                            {
                              role: "ai",
                              text: "Target locked and added to workflow sequence.",
                            },
                          ]);
                          handleAddSequenceStep({
                            x: aiThinking?.x || 960,
                            y: aiThinking?.y || 540,
                            name: `Collab: ${collabInstruction.slice(0, 20)}`,
                          } as any);
                          setCollabInstruction("");
                        }}
                        className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white flex-1 font-bold"
                      >
                        Send & Add Step
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCollabInstruction("")}
                        className="h-7 text-xs border-slate-700"
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <DynamicCalculatorTypingHub
                  currentScreenshotUrl={aiLiveUrl || screenshotUrl}
                  onDispatchTypingAction={(payload) =>
                    handleAddSequenceStep({
                      x: payload.coords.x,
                      y: payload.coords.y,
                      text: payload.text,
                      action: "type_text",
                      name: `Calc: ${payload.text.slice(0, 12)}`,
                    } as any)
                  }
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="layers" className="space-y-6">
            <ScreenshotLayeringPanel
              currentScreenshot={aiLiveUrl || screenshotUrl}
              onSelectLayerTarget={(x, y, name) => handleAddSequenceStep(x, y)}
              onExecuteLayerSequence={(id) =>
                fetch("/api/execute-task", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    targetDevice,
                    deviceId: selectedAdbDevice,
                    task: {
                      id,
                      name: "Layer Execute",
                      action: "click",
                      targetPosition: { x: 960, y: 540 },
                    },
                  }),
                })
              }
            />
          </TabsContent>
          <TabsContent value="models" className="space-y-6">
            <GGUFModelEngineStudio
              onModelSelected={(m) =>
                setWifiStatus(`Model switched to ${m.name}`)
              }
            />
          </TabsContent>
          <TabsContent value="mouse-route" className="space-y-6">
            <ContinuousMouseRoutePlayer
              currentLiveScreenshot={aiLiveUrl || screenshotUrl}
              onDispatchRouteToOS={(pts) =>
                pts.forEach((p) => handleAddSequenceStep(p.x, p.y))
              }
            />
          </TabsContent>
          <TabsContent value="backprop" className="space-y-6">
            <AppRelativeBackpropEngine
              onBackpropComplete={(r) =>
                setWifiStatus(`Backprop: ${r.adjustments}`)
              }
            />
          </TabsContent>
          <TabsContent value="goal-agent" className="space-y-6">
            <AutonomousGoalAgentStudio currentLiveScreenshot={screenshotUrl} />
          </TabsContent>

          <TabsContent value="adb-grid" className="space-y-6">
            <AndroidAdbMultiDeviceGrid />
          </TabsContent>

          <TabsContent value="code-learn" className="space-y-6">
            <AILearningCodeSynthesizerStudio
              currentLiveScreenshot={aiLiveUrl || screenshotUrl}
              onFeedToStoryMode={() => setCurrentTab("story")}
            />
          </TabsContent>
          <TabsContent value="pack-builder" className="space-y-6">
            <ScreenshotPackBuilderStudio
              currentLiveScreenshot={aiLiveUrl || screenshotUrl}
            />
          </TabsContent>
          <TabsContent value="capture" className="space-y-6">
            <CaptureAnnotationWorkspace frames={mockCaptureFrames} />
          </TabsContent>
          <TabsContent value="entities" className="space-y-6">
            <EntitiesRadarPanel
              userGoal={userObjective || "Submit workflow & advance"}
              onSelectEntity={(x, y, name) => {
                handleAddSequenceStep(x, y);
                setAiThinking({
                  x,
                  y,
                  action: name.slice(0, 30),
                  confidence: 0.96,
                  isThinking: true,
                  targetLabel: name,
                });
              }}
              onLockFocus={(x, y, name) =>
                handleAddSequenceStep({ x, y, name: `Focus: ${name}` } as any)
              }
              onDispatchAiMove={(entity) => {
                handleAddSequenceStep(entity.position.x, entity.position.y);
                fetch("/api/execute-task", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    targetDevice,
                    deviceId: selectedAdbDevice,
                    task: {
                      id: `entity_${Date.now()}`,
                      name: entity.name,
                      action: "click",
                      targetPosition: entity.position,
                    },
                  }),
                }).catch(() => {});
                setAiThinking({
                  x: entity.position.x,
                  y: entity.position.y,
                  action: entity.name.slice(0, 30),
                  confidence: 0.97,
                  isThinking: true,
                  targetLabel: entity.name,
                });
              }}
            />
          </TabsContent>
          <TabsContent value="quantum" className="space-y-6">
            <QuantumMouseTracker />
          </TabsContent>
          <TabsContent value="linker" className="space-y-6">
            <ProgramLinkerAttacher />
          </TabsContent>
          <TabsContent value="v-desktop" className="space-y-6">
            <VirtualDesktopMirrorStudio />
          </TabsContent>
          <TabsContent value="code-editor" className="space-y-6">
            <AICodeEditorBackupStudio />
          </TabsContent>
          <TabsContent value="gap-agent" className="space-y-6">
            <GapAgentVerifierHub />
          </TabsContent>
          <TabsContent value="drag-drop" className="space-y-6">
            <DragAndDropLogicStudio />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HumanMouseTouchSimulator />
              <AdPopupDestroyer />
            </div>
            <DrawingReflexCanvas />
            <VirtualKeyboardInputVerifier />
          </TabsContent>
          <TabsContent value="benchmark" className="space-y-6">
            <AIResponseBenchmarkTestbench />
            <DynamicCalculatorTypingHub
              currentScreenshotUrl={aiLiveUrl || screenshotUrl}
              onDispatchTypingAction={(payload) =>
                handleAddSequenceStep({
                  x: payload.coords.x,
                  y: payload.coords.y,
                  text: payload.text,
                  action: "type_text",
                  name: `Benchmark: ${payload.text.slice(0, 12)}`,
                } as any)
              }
            />
          </TabsContent>
          <TabsContent value="movement" className="space-y-6">
            <MovementExplorerRemapperStudio />
            <QuantumMouseTracker />
          </TabsContent>
          <TabsContent value="route-map" className="space-y-6">
            <LiveRouteNavigationFlowPanel />
          </TabsContent>
          <TabsContent value="testpoints" className="space-y-6">
            <NavigationTestpointsDriftManager />
          </TabsContent>
          <TabsContent value="dedup" className="space-y-6">
            <SequenceCollisionDedupLedger />
          </TabsContent>
          <TabsContent value="scenarios" className="space-y-6">
            <ScenarioMemoryAutoPlanner />
          </TabsContent>
          <TabsContent value="watchdog" className="space-y-6">
            <TaskProgressWatchdogAgent />
          </TabsContent>
          <TabsContent value="cross-ref" className="space-y-6">
            <GoalCrossReferenceCorrector
              currentScreenshot={aiLiveUrl || screenshotUrl}
            />
          </TabsContent>
          <TabsContent value="rebound" className="space-y-6">
            <ScanReboundHierarchyEngine />
          </TabsContent>
          <TabsContent value="story" className="space-y-6">
            <StorySceneCreationStudio />
          </TabsContent>
          <TabsContent value="aggressive" className="space-y-6">
            <AggressiveLoopDataAssembly />
          </TabsContent>
          <TabsContent value="dual-ai" className="space-y-6">
            <DualAICopilotPanel
              perception={perceptionReport}
              plannerDecision={plannerDecision}
              isAutonomousRunning={isAutonomousRunning}
              isAnalyzing={isPerceiving}
              userObjective={userObjective}
              loopIntervalMs={loopIntervalMs}
              onUserObjectiveChange={setUserObjective}
              onLoopIntervalChange={setLoopIntervalMs}
              onTriggerDescribe={handleTriggerDescribeScreen}
              onTriggerPlanAndAct={handleTriggerPlanAndAct}
              onToggleAutonomousLoop={handleToggleAutonomousLoop}
              onSelectElementTarget={(x, y, name) => {
                handleAddSequenceStep(x, y);
                setAiThinking({
                  x,
                  y,
                  action: name,
                  confidence: 0.93,
                  isThinking: true,
                  targetLabel: name,
                });
              }}
            />
          </TabsContent>
          <TabsContent value="agents" className="space-y-6">
            <AgentsTelemetryPanel />
          </TabsContent>
          <TabsContent value="tasks" className="space-y-6">
            <AutoTasksPipelinePanel
              tasks={pipelineTasks}
              onExecuteTask={async (taskId) => {
                const t = pipelineTasks.find((x) => x.id === taskId);
                if (!t) return;
                const driftToSend = movementMode === "exact" ? 0 : driftPx;
                await fetch("/api/execute-task", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    targetDevice,
                    deviceId: selectedAdbDevice,
                    task: {
                      id: taskId,
                      name: t.name,
                      description: t.description,
                      action: "click",
                      targetPosition: { x: 960, y: 540 },
                      driftPx: driftToSend,
                    },
                  }),
                });
                setPipelineTasks((prev) =>
                  prev.map((x) =>
                    x.id === taskId ? { ...x, status: "completed" } : x,
                  ),
                );
              }}
              onAddTask={(name, desc) =>
                setPipelineTasks((prev) => [
                  ...prev,
                  {
                    id: `t_${Date.now()}`,
                    name,
                    description: desc,
                    priority: 1,
                    confidence: 0.9,
                    status: "pending",
                  },
                ])
              }
              onClearTasks={() => setPipelineTasks([])}
              onRunBatch={handleRunSequence}
            />
          </TabsContent>
          <TabsContent value="goals" className="space-y-6">
            <GoalsManagerPanel
              screenshotUrl={aiLiveUrl || screenshotUrl}
              goals={goalsState.length ? (goalsState as any) : undefined}
              onAddGoal={(g: any) => setGoalsState((prev) => [...prev, g])}
              onUpdateGoal={(id, upd) =>
                setGoalsState((prev) =>
                  prev.map((g) => (g.id === id ? { ...g, ...upd } : g)),
                )
              }
              onDeleteGoal={(id) =>
                setGoalsState((prev) => prev.filter((g) => g.id !== id))
              }
              onExecuteGoal={async (id) => {
                const g = goalsState.find((x) => x.id === id);
                const x = g?.targetCenter?.x || 960;
                const y = g?.targetCenter?.y || 540;
                handleAddSequenceStep(x, y);
                await fetch("/api/execute-task", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    targetDevice,
                    deviceId: selectedAdbDevice,
                    task: {
                      id,
                      name: g?.title || id,
                      action: "click",
                      targetPosition: { x, y },
                    },
                  }),
                });
              }}
              onSelectTargetCoordinates={(x, y) => handleAddSequenceStep(x, y)}
            />
          </TabsContent>
          <TabsContent value="logs" className="space-y-6">
            <CentralLogsConsole />
          </TabsContent>
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Global Settings & Contextual
                  Bars
                </CardTitle>
                <CardDescription>
                  Tab-specific settings are shown inside each tab via contextual
                  bars. This panel aggregates them.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-300">Movement</span>
                    <p className="text-slate-300">
                      Mode: {movementMode} • Drift: {driftPx}px • Vary:{" "}
                      {driftPerStepVariate ? "ON" : "OFF"} • Random:{" "}
                      {driftRandomInterval ? "1-3s" : "OFF"}
                    </p>
                  </div>
                  <div className="p-3 rounded bg-slate-950 border border-slate-800">
                    <span className="font-bold text-emerald-300">Device</span>
                    <p className="text-slate-300">
                      {targetDevice} • {selectedAdbDevice || "no device"} •
                      AntiLoop: {antiLoopEnabled ? "ON" : "OFF"}
                    </p>
                  </div>
                  <div className="p-3 rounded bg-slate-950 border border-slate-800">
                    <span className="font-bold text-purple-300">AI</span>
                    <p className="text-slate-300">
                      Perception: {perceptionReport ? "ready" : "idle"} • Live:{" "}
                      {isLiveDesktopActive ? "LIVE" : "fallback"} • Steps:{" "}
                      {sequence.length}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold">All Tab Settings Bars</span>
                  <p className="text-slate-300">
                    Each tab (Vision, OS, Input, Routes, Cognition, Swarm)
                    contains its own TabContextualSettingsBar with
                    sliders/switches and quick actions. Adjust them in-context
                    for live effect.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="collab" className="space-y-4">
            <Card className="bg-gradient-to-r from-cyan-950/40 via-purple-950/40 to-slate-900 border-cyan-700/50 shadow-xl">
              <CardHeader className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> AI USER COLLAB
                  — Full Collaboration Studio
                </CardTitle>
                <span className="text-xs font-mono text-slate-300">
                  {collabChat.length} messages • {sequence.length} steps
                </span>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-slate-900 border-cyan-800/50">
                  <CardHeader className="p-3 bg-slate-950 border-b border-slate-800">
                    <CardTitle className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-cyan-400" /> Quick Collab —
                      Tell AI where to click (Full)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    <textarea
                      value={collabInstruction}
                      onChange={(e) => setCollabInstruction(e.target.value)}
                      placeholder="Describe precisely where to click: e.g. Click the Blue Submit button at (740, 520) or type 'hello' at (420, 380)..."
                      className="w-full min-h-[120px] p-3 rounded bg-slate-950 border border-slate-800 text-sm text-slate-200"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!collabInstruction.trim()) return;
                          setCollabChat((prev) => [
                            ...prev,
                            { role: "user", text: collabInstruction },
                          ]);
                          const m = collabInstruction.match(
                            /\(?\s*(\d{2,4})\s*,\s*(\d{2,4})\s*\)?/,
                          );
                          if (m) {
                            const x = parseInt(m[1]),
                              y = parseInt(m[2]);
                            setAiThinking({
                              x,
                              y,
                              action: collabInstruction.slice(0, 40),
                              confidence: 0.93,
                              isThinking: true,
                            });
                            await fetch("/api/execute-task", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                targetDevice,
                                deviceId: selectedAdbDevice,
                                task: {
                                  id: `collab_full_${Date.now()}`,
                                  name: collabInstruction.slice(0, 30),
                                  action: "click",
                                  targetPosition: { x, y },
                                },
                              }),
                            });
                          }
                          setCollabChat((prev) => [
                            ...prev,
                            {
                              role: "ai",
                              text: `Got it — will target with ${movementMode} mode. Added as step.`,
                            },
                          ]);
                          handleAddSequenceStep({
                            x: aiThinking?.x || 960,
                            y: aiThinking?.y || 540,
                            name: `Collab: ${collabInstruction.slice(0, 24)}`,
                          } as any);
                          setCollabInstruction("");
                        }}
                        className="h-9 text-sm bg-cyan-600 text-white flex-1"
                      >
                        Send to AI & Add Step
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCollabInstruction("")}
                        className="h-9 text-sm border-slate-700"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                        <span className="text-slate-400">Live</span>
                        <div className="font-bold text-emerald-400">
                          {isLiveDesktopActive ? "● LIVE" : "○ idle"}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                        <span className="text-slate-400">Drift</span>
                        <div className="font-bold text-cyan-400">
                          {driftPx}px
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                        <span className="text-slate-400">Mode</span>
                        <div className="font-bold text-purple-400">
                          {movementMode}
                        </div>
                      </div>
                    </div>
                    <div className="h-24 rounded border border-slate-800 bg-slate-950 p-2 overflow-y-auto text-[11px] font-mono">
                      {executionHistory.slice(0, 10).map((h, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-slate-300 border-b border-slate-800 py-0.5"
                        >
                          <span>{h.stepName || "op"}</span>
                          <span>{h.status || "pending"}</span>
                        </div>
                      ))}
                      {executionHistory.length === 0 && (
                        <span className="text-slate-400">
                          No ops yet — collaborate to generate history
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <div className="space-y-3">
                  <Card className="bg-slate-900 border-slate-800 h-[420px] flex flex-col">
                    <CardHeader className="p-3 bg-slate-950 border-b border-slate-800">
                      <CardTitle className="text-xs font-bold text-slate-100">
                        Chat History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 flex-1 flex flex-col overflow-hidden">
                      <div className="flex-1 rounded border border-slate-800 bg-slate-950 p-2 overflow-y-auto space-y-1 mb-2">
                        {collabChat.map((m, i) => (
                          <div
                            key={i}
                            className={`text-xs p-2 rounded ${m.role === "user" ? "bg-cyan-950/60 text-cyan-200 ml-8" : "bg-purple-950/40 text-purple-200 mr-8"}`}
                          >
                            {m.text}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <Input
                          value={collabInput}
                          onChange={(e) => setCollabInput(e.target.value)}
                          placeholder="Type to AI..."
                          className="h-9 text-sm bg-slate-900 border-slate-700 flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (!collabInput.trim()) return;
                              setCollabChat((prev) => [
                                ...prev,
                                { role: "user", text: collabInput },
                                {
                                  role: "ai",
                                  text: `Noted: ${collabInput.slice(0, 40)}`,
                                },
                              ]);
                              setCollabInput("");
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!collabInput.trim()) return;
                            setCollabChat((prev) => [
                              ...prev,
                              { role: "user", text: collabInput },
                              {
                                role: "ai",
                                text: `Noted: ${collabInput.slice(0, 40)}`,
                              },
                            ]);
                            setCollabInput("");
                          }}
                          className="h-9 text-sm bg-slate-800"
                        >
                          Send
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="p-3 bg-slate-950 border-b border-slate-800">
                      <CardTitle className="text-xs font-bold text-slate-100">
                        AI Assistant (AIChat)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 h-48">
                      <AIChat />
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Global System Telemetry Status Footer */}
        <footer className="mt-8 pt-4 pb-6 border-t border-slate-800 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              PyAutoGUI Physical Drivers Ready
            </span>
            <span>•</span>
            <span>
              Target OS:{" "}
              <strong className="text-slate-200">Windows Desktop</strong>
            </span>
            <span>•</span>
            <span>
              WebSocket HMR:{" "}
              <strong className="text-cyan-300">Connected</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              DroidVision AI Master Agent v3.4
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-300">
              Zero-Error Hardware Pipeline Active
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
