import React, { useState, useRef } from "react";
import {
  Activity,
  Monitor,
  Maximize2,
  Camera,
  Brush,
  FolderOpen,
  Save,
  Download,
  RefreshCw,
  Brain,
  CheckCircle2,
  Compass,
  CornerDownLeft,
  Crosshair,
  Eye,
  Keyboard,
  Layers,
  MousePointer,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  framePointAsPercent,
  framePointFromClient,
  getContainedFrameViewport,
} from "@/lib/frame-viewport";

export interface SequenceStep {
  id: string;
  stepNumber: number;
  name: string;
  action:
    | "click"
    | "double_click"
    | "right_click"
    | "clear_and_type"
    | "type_text"
    | "press_key"
    | "hotkey"
    | "scroll"
    | "wait";
  x: number;
  y: number;
  delayMs: number;
  dwellDurationMs?: number;
  text?: string;
  keyPayload?: string;
  status: "pending" | "running" | "completed" | "failed";
  recalibrated?: boolean;
  referenceScreenshotUrl?: string;
  allowedVariancePercent?: number;
  dynamicVariablePayloads?: string[];
  targetOcrLabel?: string;
  fallbackMethod?: "direct_click" | "tab_enter" | "arrow_keys" | "escape_retry";
}

export interface AIThinkingState {
  x: number;
  y: number;
  action: string;
  confidence: number;
  isThinking: boolean;
  targetLabel?: string;
}

export interface DetectedEntity {
  type: "player" | "enemy" | "objective" | "item" | "npc" | "partner" | "input";
  name: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  confidence: number;
}

export interface UIElementBox {
  id: string;
  name: string;
  type: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  center: { x: number; y: number };
  confidence: number;
}

export interface VerificationBadgeState {
  status: "verifying" | "verified" | "failed" | "retrying";
  message?: string;
}

export interface RecalibrationNotice {
  stepId: string;
  stepNumber: number;
  oldX: number;
  oldY: number;
  newX: number;
  newY: number;
  distance: number;
}

interface LiveScreenHUDProps {
  screenshotUrl: string;
  isCapturing: boolean;
  aiThinking: AIThinkingState | null;
  entities: DetectedEntity[];
  uiElements?: UIElementBox[];
  perceptionFeedback?: { x: number; y: number; label?: string } | null;
  verificationBadge?: VerificationBadgeState | null;
  recalibrationNotice?: RecalibrationNotice | null;
  sequence: SequenceStep[];
  activeStepId: string | null;
  isRecordMode: boolean;
  onAddStep: (
    stepData: Partial<SequenceStep> & { x: number; y: number },
  ) => void;
  onRepositionStep: (id: string, newX: number, newY: number) => void;
  onSelectStep?: (id: string) => void;
  onLiveStreamChange?: (
    active: boolean,
    snapshotUrl: string | null,
    displaySurface: string | null,
  ) => void;
}

export const LiveScreenHUD: React.FC<LiveScreenHUDProps> = ({
  screenshotUrl,
  isCapturing,
  aiThinking,
  entities,
  uiElements = [],
  perceptionFeedback,
  verificationBadge,
  recalibrationNotice,
  sequence,
  activeStepId,
  isRecordMode,
  onAddStep,
  onRepositionStep,
  onSelectStep,
  onLiveStreamChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const streamSyncIntervalRef = useRef<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [draggingStepId, setDraggingStepId] = useState<string | null>(null);
  const [trackDwellTime, setTrackDwellTime] = useState<boolean>(true);
  const [dwellStartTime, setDwellStartTime] = useState<number>(Date.now());
  const [currentDwellMs, setCurrentDwellMs] = useState<number>(0);
  const [clickRipples, setClickRipples] = useState<
    { id: string; x: number; y: number; time: number }[]
  >([]);

  // Realistic Cursor & Spline Replay State
  const [cursorStyle, setCursorStyle] = useState<
    "pointer" | "hand" | "hologram"
  >("pointer");
  const [humanDriftPx, setHumanDriftPx] = useState<number>(6);
  const [flowrateSpeed, setFlowrateSpeed] = useState<number>(750);
  const [overshootPx, setOvershootPx] = useState<number>(10);
  const [recordedTrajectory, setRecordedTrajectory] = useState<
    Array<{ x: number; y: number; time: number }>
  >([]);
  const [isReplayingMovement, setIsReplayingMovement] =
    useState<boolean>(false);
  const [replayingCursorPos, setReplayingCursorPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDrawingOverlayOpen, setIsDrawingOverlayOpen] =
    useState<boolean>(false);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(false);
  const [antiTunnelMode, setAntiTunnelMode] = useState<
    "live_stream" | "anti_tunnel_snapshot" | "pip"
  >("live_stream");
  const [frozenSnapshotUrl, setFrozenSnapshotUrl] = useState<string | null>(
    null,
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasCaptureRef = useRef<HTMLCanvasElement | null>(null);

  // Allow parent (Dashboard header Share) to trigger HUD share via custom event
  React.useEffect(() => {
    const handler = () => handleToggleRealScreenStream();
    window.addEventListener("trigger-hud-share", handler as EventListener);
    return () =>
      window.removeEventListener("trigger-hud-share", handler as EventListener);
  }, [isLiveStreamActive]);

  const notifyLiveChange = (
    active: boolean,
    snap: string | null,
    surface: string | null,
  ) => {
    try {
      onLiveStreamChange?.(active, snap, surface);
    } catch {}
  };

  // Handle pasting or dropping a real screenshot directly onto the canvas
  const handleDropScreenshot = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          fetch("/api/sync-real-frame", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageData: base64 }),
          }).catch(() => {});
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasteScreenshot = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (base64) {
              fetch("/api/sync-real-frame", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageData: base64 }),
              }).catch(() => {});
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // Pop out stream to independent Picture-in-Picture window (Zero Visual Feedback Loop)
  const handleTogglePiP = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.log("PiP toggle error:", err);
      }
    }
  };

  // Start / Stop Browser-Native Real Screen Sharing (getDisplayMedia)
  const handleToggleRealScreenStream = async () => {
    if (isLiveStreamActive) {
      if (streamSyncIntervalRef.current !== null) {
        window.clearInterval(streamSyncIntervalRef.current);
        streamSyncIntervalRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setIsLiveStreamActive(false);
      setFrozenSnapshotUrl(null);
      notifyLiveChange(false, null, null);
      return;
    }

    try {
      // Configure selfBrowserSurface: exclude to prevent infinite visual mirror recursion
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "window",
          cursor: "always",
        } as any,
        audio: false,
        selfBrowserSurface: "exclude",
        surfaceSwitching: "include",
        systemAudio: "exclude",
      } as any);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsLiveStreamActive(true);
        const track = stream.getVideoTracks()[0];
        const settings = (track.getSettings() as any) || {};
        const surface = settings.displaySurface || null;
        if (surface === "monitor") {
          setAntiTunnelMode("anti_tunnel_snapshot");
        }
        // Notify parent immediately with surface (snapshot will follow after first frame)
        notifyLiveChange(true, null, surface);
        setTimeout(() => {
          if (videoRef.current && videoRef.current.videoWidth) {
            const c = document.createElement("canvas");
            c.width = videoRef.current.videoWidth || 1920;
            c.height = videoRef.current.videoHeight || 1080;
            const ctx2 = c.getContext("2d");
            ctx2?.drawImage(videoRef.current!, 0, 0, c.width, c.height);
            const snap = c.toDataURL("image/jpeg", 0.85);
            setFrozenSnapshotUrl(snap);
            notifyLiveChange(true, snap, surface);
          }
        }, 600);

        // Continuous sync to backend
        const canvas = document.createElement("canvas");
        streamSyncIntervalRef.current = window.setInterval(() => {
          if (stream.active && videoRef.current) {
            canvas.width = videoRef.current.videoWidth || 1920;
            canvas.height = videoRef.current.videoHeight || 1080;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            fetch("/api/sync-real-frame", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageData: dataUrl }),
            }).catch(() => {});
          } else {
            if (streamSyncIntervalRef.current !== null) {
              window.clearInterval(streamSyncIntervalRef.current);
              streamSyncIntervalRef.current = null;
            }
          }
        }, 300);
      }

      stream.getVideoTracks()[0].onended = () => {
        if (streamSyncIntervalRef.current !== null) {
          window.clearInterval(streamSyncIntervalRef.current);
          streamSyncIntervalRef.current = null;
        }
        setIsLiveStreamActive(false);
        setFrozenSnapshotUrl(null);
        notifyLiveChange(false, null, null);
      };
    } catch (err) {
      console.log("User cancelled screen share or error:", err);
    }
  };

  React.useEffect(
    () => () => {
      if (streamSyncIntervalRef.current !== null) {
        window.clearInterval(streamSyncIntervalRef.current);
      }
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const [overlayActiveTool, setOverlayActiveTool] = useState<
    "route" | "click" | "task" | "goal" | "avoidance"
  >("route");
  const [isFreehandDrawing, setIsFreehandDrawing] = useState<boolean>(false);
  const [draftedOverlayPoints, setDraftedOverlayPoints] = useState<
    Array<{
      id: string;
      stepNumber: number;
      name: string;
      action: any;
      x: number;
      y: number;
      delayMs: number;
    }>
  >([]);
  const [freehandRoutePoints, setFreehandRoutePoints] = useState<
    Array<{ x: number; y: number }>
  >([]);

  const [splineMotionTrail, setSplineMotionTrail] = useState<
    Array<{ x: number; y: number }>
  >([]);

  // Quick Action Recording Popover State
  const [recordingClickPos, setRecordingClickPos] = useState<{
    x: number;
    y: number;
    pctX: number;
    pctY: number;
  } | null>(null);
  const [popoverAction, setPopoverAction] =
    useState<SequenceStep["action"]>("click");
  const [popoverText, setPopoverText] = useState("");
  const [popoverKey, setPopoverKey] = useState("enter");
  const [popoverDelay, setPopoverDelay] = useState(500);
  const [popoverName, setPopoverName] = useState("");
  const [saveAsNumberedStep, setSaveAsNumberedStep] = useState<boolean>(true);
  const [popoverSaveScreenshot, setPopoverSaveScreenshot] =
    useState<boolean>(true);
  const [dynamicFixupMode, setDynamicFixupMode] = useState<
    "auto_fixup" | "perform_anyways" | "link_workflow"
  >("auto_fixup");
  const [fixupExplanation, setFixupExplanation] = useState<string>("");

  const NATIVE_WIDTH = 1920;
  const NATIVE_HEIGHT = 1080;

  const getNativeCoordinates = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, pctX: 50, pctY: 50 };
    const viewport = getContainedFrameViewport(rect, {
      width: NATIVE_WIDTH,
      height: NATIVE_HEIGHT,
    });
    const point = framePointFromClient(e.clientX, e.clientY, viewport, {
      width: NATIVE_WIDTH,
      height: NATIVE_HEIGHT,
    });

    return {
      ...point,
      pctX: (point.x / NATIVE_WIDTH) * 100,
      pctY: (point.y / NATIVE_HEIGHT) * 100,
    };
  };

  const toPercent = (nativeX: number, nativeY: number) => {
    return {
      left: `${(nativeX / NATIVE_WIDTH) * 100}%`,
      top: `${(nativeY / NATIVE_HEIGHT) * 100}%`,
    };
  };

  const toBoxPercent = (box: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    return {
      left: `${(box.x / NATIVE_WIDTH) * 100}%`,
      top: `${(box.y / NATIVE_HEIGHT) * 100}%`,
      width: `${Math.max(2, (box.width / NATIVE_WIDTH) * 100)}%`,
      height: `${Math.max(2, (box.height / NATIVE_HEIGHT) * 100)}%`,
    };
  };

  // Record continuous trajectory as user moves
  const recordMovementPoint = (x: number, y: number) => {
    if (isRecordMode) {
      setRecordedTrajectory((prev) => [
        ...prev.slice(-60),
        { x, y, time: Date.now() },
      ]);
    }
  };

  // Replay user mouse movement with human-like drift differential
  // Physically execute entire sequence or active step on real user desktop via PyAutoGUI
  const handleExecuteAllOnActualPC = async () => {
    const stepsToRun =
      sequence.length > 0
        ? sequence
        : recordedTrajectory.length > 0
          ? recordedTrajectory.map((t, idx) => ({
              id: `t_${idx}`,
              name: `Step #${idx + 1}`,
              action: "click" as const,
              x: t.x,
              y: t.y,
              dwellDurationMs: 300,
            }))
          : [
              {
                id: "def_1",
                name: "Center Focus Click",
                action: "click" as const,
                x: 960,
                y: 540,
                dwellDurationMs: 300,
              },
            ];

    alert(
      `⚡ Executing ${stepsToRun.length} action(s) directly on your REAL PC via PyAutoGUI! Stand by...`,
    );

    for (let i = 0; i < stepsToRun.length; i++) {
      const step: any = stepsToRun[i];
      try {
        await fetch("/api/execute-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetDevice: "desktop",
            task: {
              id: step.id,
              name: step.name || `Step #${i + 1}`,
              action: step.action || "click",
              targetPosition: { x: step.x, y: step.y },
              textPayload: step.textPayload || step.text || "",
              keyPayload: step.keyPayload || "enter",
            },
          }),
        });
      } catch (err) {
        console.error("Step execution error:", err);
      }
      // Pause between steps
      await new Promise((r) => setTimeout(r, step.dwellDurationMs || 450));
    }
  };

  const handleReplayUserMovementWithDrift = () => {
    if (sequence.length === 0 && recordedTrajectory.length === 0) {
      alert("Please record or create at least one step/path to replay.");
      return;
    }

    setIsReplayingMovement(true);
    setSplineMotionTrail([]);

    // Determine waypoints: sequence steps or recorded trajectory
    const waypoints =
      sequence.length > 0
        ? sequence.map((s) => ({
            x: s.x,
            y: s.y,
            dwell: s.dwellDurationMs || 400,
          }))
        : recordedTrajectory.map((t) => ({ x: t.x, y: t.y, dwell: 200 }));

    let currentWaypointIdx = 0;
    let startX = waypoints[0]?.x || 960;
    let startY = waypoints[0]?.y || 540;

    const animateToNextWaypoint = () => {
      if (currentWaypointIdx >= waypoints.length) {
        setIsReplayingMovement(false);
        setReplayingCursorPos(null);
        return;
      }

      const target = waypoints[currentWaypointIdx];
      const targetX = target.x;
      const targetY = target.y;

      const totalSteps = 25;
      let step = 0;

      // Dispatch physical OS mouse move & click via PyAutoGUI
      fetch("/api/execute-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            id: `replay_step_${currentWaypointIdx}`,
            name: `Replay Waypoint #${currentWaypointIdx + 1}`,
            action: "click",
            targetPosition: { x: targetX, y: targetY },
            textPayload: "",
          },
        }),
      }).catch(() => {});

      const interval = setInterval(() => {
        step++;
        const t = step / totalSteps;
        const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const driftX = (Math.random() - 0.5) * humanDriftPx * 2;
        const driftY = (Math.random() - 0.5) * humanDriftPx * 2;

        const curX = Math.round(startX + (targetX - startX) * easeT + driftX);
        const curY = Math.round(startY + (targetY - startY) * easeT + driftY);

        setReplayingCursorPos({ x: curX, y: curY });
        setSplineMotionTrail((prev) => [
          ...prev.slice(-20),
          { x: curX, y: curY },
        ]);

        if (step >= totalSteps) {
          clearInterval(interval);
          startX = targetX;
          startY = targetY;
          currentWaypointIdx++;
          setTimeout(animateToNextWaypoint, target.dwell || 300);
        }
      }, 25);
    };

    animateToNextWaypoint();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getNativeCoordinates(e);
    setMousePos({ x: coords.x, y: coords.y });
    recordMovementPoint(coords.x, coords.y);
    // Reset dwell start if moved significantly (>20px)
    if (
      !mousePos ||
      Math.hypot(coords.x - mousePos.x, coords.y - mousePos.y) > 20
    ) {
      setDwellStartTime(Date.now());
      setCurrentDwellMs(0);
    } else {
      setCurrentDwellMs(Date.now() - dwellStartTime);
    }

    if (draggingStepId) {
      onRepositionStep(draggingStepId, coords.x, coords.y);
    }
  };

  const handleMouseUp = () => {
    setDraggingStepId(null);
  };

  // Integrate drafted overlay points into the main workflow sequence
  const handleIntegrateOverlayToSequence = () => {
    if (draftedOverlayPoints.length === 0) return;
    draftedOverlayPoints.forEach((pt) => {
      onAddStep({
        stepNumber: sequence.length + 1,
        name: pt.name,
        action: pt.action,
        x: pt.x,
        y: pt.y,
        delayMs: pt.delayMs || 400,
        status: "pending",
      });
    });
    setDraftedOverlayPoints([]);
    setIsDrawingOverlayOpen(false);
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingStepId) return;
    if (isRecordMode) {
      const coords = getNativeCoordinates(e);
      const stepNumber = sequence.length + 1;
      // Left click default
      setPopoverName(`Step ${stepNumber}`);
      setPopoverAction("click");
      setPopoverText("");
      setPopoverDelay(500);
      setRecordingClickPos(coords);
    }
  };

  const handleContainerContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggingStepId) return;
    if (isRecordMode) {
      const coords = getNativeCoordinates(e);
      const stepNumber = sequence.length + 1;
      setPopoverName(`Step ${stepNumber} (Right Click)`);
      setPopoverAction("right_click");
      setPopoverText("");
      setPopoverDelay(500);
      setRecordingClickPos(coords);
    }
  };

  const handleCommitRecordStep = () => {
    if (!recordingClickPos) return;
    const stepNumber = sequence.length + 1;
    // Capture screenshot for save if enabled - use current screenshotUrl prop
    const refUrl = popoverSaveScreenshot ? screenshotUrl : undefined;
    onAddStep({
      stepNumber,
      name: popoverName || `Step ${stepNumber}`,
      action: popoverAction,
      x: recordingClickPos.x,
      y: recordingClickPos.y,
      text: popoverText,
      keyPayload: popoverKey,
      delayMs: popoverDelay,
      status: "pending",
      referenceScreenshotUrl: refUrl,
    } as any);
    setRecordingClickPos(null);
  };

  const polylinePoints = sequence
    .map((step) => {
      const xPct = (step.x / NATIVE_WIDTH) * 100;
      const yPct = (step.y / NATIVE_HEIGHT) * 100;
      return `${xPct},${yPct}`;
    })
    .join(" ");

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video bg-black rounded-lg overflow-hidden select-none border-2 transition-all duration-300 ${
        isRecordMode
          ? "border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.3)] cursor-none"
          : "border-slate-800 shadow-xl cursor-default"
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setMousePos(null);
        setDraggingStepId(null);
      }}
      onClick={handleContainerClick}
      onContextMenu={handleContainerContextMenu}
    >
      <div ref={viewportRef} className="absolute inset-0">
        {/* Native WebRTC Live Real Screen Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain pointer-events-none absolute inset-0 z-0 ${
            isLiveStreamActive && antiTunnelMode === "live_stream"
              ? "block"
              : "hidden"
          }`}
        />

        {/* Anti-Tunnel Freeze Frame Snapshot (Prevents Infinite Visual Loop) */}
        {isLiveStreamActive && antiTunnelMode === "anti_tunnel_snapshot" && (
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-black">
            {frozenSnapshotUrl ? (
              <img
                src={frozenSnapshotUrl}
                alt="Anti-Tunnel Snapshot"
                className="w-full h-full object-contain pointer-events-none"
              />
            ) : (
              <div className="text-center p-4">
                <span className="text-xs font-mono text-cyan-300 animate-pulse">
                  🛡️ Anti-Tunnel Snapshot Active (Zero Visual Feedback Loop)
                </span>
              </div>
            )}
          </div>
        )}

        {!isLiveStreamActive &&
        screenshotUrl &&
        !screenshotUrl.includes("sample_placeholder") ? (
          <img
            src={screenshotUrl}
            alt="Live Screen Capture"
            className="w-full h-full object-contain pointer-events-none absolute inset-0 z-0"
          />
        ) : (
          !isLiveStreamActive && (
            <div
              onClick={handleToggleRealScreenStream}
              className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-center cursor-pointer hover:bg-slate-900/90 transition-all group z-10 select-none"
            >
              <div className="w-20 h-20 rounded-full bg-cyan-950/80 border-2 border-cyan-400/80 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-cyan-300 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-pulse">
                <Monitor className="w-10 h-10 text-cyan-300" />
              </div>

              <h3 className="text-lg font-bold font-mono text-slate-100 mb-1 group-hover:text-cyan-300 transition-colors">
                CLICK ANYWHERE TO START LIVE SCREEN STREAM 📺
              </h3>
              <p className="text-xs font-mono text-slate-300 max-w-md mb-4">
                Direct 60 FPS zero-latency hardware desktop mirror for AI mouse
                navigation, OCR text scanning, and physical PyAutoGUI
                automation.
              </p>

              <Button
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleRealScreenStream();
                }}
                className="h-10 px-6 text-sm font-mono font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-xl shadow-cyan-950 border border-cyan-400/40 gap-2 animate-bounce"
              >
                <Play className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                START REAL DESKTOP STREAM (60 FPS)
              </Button>
            </div>
          )
        )}
      </div>

      {/* Prominent High-Visibility Action Toolbar */}
      <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-xs z-30 relative shadow-md">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-red-600 text-white font-bold animate-pulse">
            LIVE DESKTOP
          </span>
          <span className="text-slate-200 font-bold">
            Physical OS Execution Bridge:
          </span>
          <span className="text-cyan-300">PyAutoGUI Native Drivers Ready</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleToggleRealScreenStream}
            className={`h-8 text-xs font-mono font-bold ${
              isLiveStreamActive
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 animate-pulse"
                : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md"
            }`}
          >
            <Monitor className="w-3.5 h-3.5 mr-1.5" />
            {isLiveStreamActive
              ? "🔴 STREAM ACTIVE"
              : "📺 SHARE SCREEN (60FPS)"}
          </Button>

          <Button
            size="sm"
            onClick={() => setIsDrawingOverlayOpen(!isDrawingOverlayOpen)}
            className={`h-8 text-xs font-mono font-bold ${
              isDrawingOverlayOpen
                ? "bg-cyan-600 text-white ring-2 ring-cyan-400"
                : "bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800"
            }`}
          >
            🎨 Pre-Record Drawing Overlay ({isDrawingOverlayOpen ? "ON" : "OFF"}
            )
          </Button>

          <Button
            size="sm"
            onClick={handleExecuteAllOnActualPC}
            className="h-8 px-4 text-xs font-mono font-bold bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white border border-amber-300 shadow-xl shadow-red-950 gap-1.5 animate-bounce"
          >
            <Zap className="w-4 h-4 text-yellow-300" />
            EXECUTE ON ACTUAL USER PC (PyAutoGUI Native)
          </Button>

          <Button
            size="sm"
            onClick={handleReplayUserMovementWithDrift}
            disabled={isReplayingMovement}
            className="h-8 text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white gap-1"
          >
            <Play className="w-3.5 h-3.5" /> Replay with Drift (±{humanDriftPx}
            px)
          </Button>
        </div>
      </div>

      {/* Cyberpunk HUD Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400/80"></div>
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-400/80"></div>
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-400/80"></div>
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400/80"></div>

        {isCapturing && (
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse transform -translate-y-full animate-[scan_3s_linear_infinite]" />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-24 h-24 border border-dashed border-cyan-400 rounded-full animate-[spin_20s_linear_infinite]"></div>
          <div className="absolute w-4 h-4 border border-cyan-400"></div>
        </div>
      </div>

      {/* 1. Realistic Human Mouse Cursor & Glowing Spline Trail Overlay */}
      {/* Motion Spline Trail */}
      {(splineMotionTrail.length > 0 || (mousePos && isRecordMode)) && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
          {splineMotionTrail.map((pt, idx) => (
            <circle
              key={idx}
              cx={
                framePointAsPercent(pt.x, pt.y, {
                  width: NATIVE_WIDTH,
                  height: NATIVE_HEIGHT,
                }).left
              }
              cy={
                framePointAsPercent(pt.x, pt.y, {
                  width: NATIVE_WIDTH,
                  height: NATIVE_HEIGHT,
                }).top
              }
              r={2 + (idx / splineMotionTrail.length) * 3}
              fill="#06b6d4"
              opacity={(idx / splineMotionTrail.length) * 0.8}
            />
          ))}
        </svg>
      )}

      {/* Realistic Mouse Pointer Arrow / Hand */}
      {(replayingCursorPos || mousePos) && (
        <div
          style={{
            ...framePointAsPercent(
              replayingCursorPos?.x || mousePos?.x || 0,
              replayingCursorPos?.y || mousePos?.y || 0,
              { width: NATIVE_WIDTH, height: NATIVE_HEIGHT },
            ),
          }}
          className="absolute -translate-x-1 -translate-y-1 pointer-events-none z-40 flex flex-col items-start transition-transform duration-75"
        >
          {cursorStyle === "hand" ? (
            <div className="relative">
              <span className="text-2xl drop-shadow-[0_0_10px_rgba(6,182,212,0.9)]">
                👆
              </span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
          ) : (
            <div className="relative">
              {/* Realistic Glowing Arrowhead */}
              <svg
                className="w-6 h-6 drop-shadow-[0_0_10px_rgba(6,182,212,0.95)]"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
            </div>
          )}

          {/* Coordinate & Drift Tag */}
          <div className="mt-0.5 ml-4 px-2 py-0.5 rounded bg-slate-950/90 border border-cyan-500/60 text-[10px] font-mono text-cyan-300 font-bold shadow-xl flex items-center gap-1 backdrop-blur-md">
            <span>
              ({replayingCursorPos?.x || mousePos?.x},{" "}
              {replayingCursorPos?.y || mousePos?.y})
            </span>
            {isReplayingMovement && (
              <span className="text-amber-400 text-[9px] animate-pulse">
                ±{humanDriftPx}px DRIFT
              </span>
            )}
          </div>
        </div>
      )}

      {/* Live Mouse Coordinates Badge */}
      {mousePos && (
        <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2 shadow-2xl pointer-events-none z-30">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>
            X: <strong className="text-white">{mousePos.x}</strong> Y:{" "}
            <strong className="text-white">{mousePos.y}</strong>
          </span>
          {isRecordMode && (
            <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded text-[10px] font-bold animate-pulse">
              RECORDING: Left-click = click • Right-click = right_click rect
            </span>
          )}
        </div>
      )}

      {/* Dynamic Recalibration Banner */}
      {recalibrationNotice && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-amber-950/95 border-2 border-amber-400 px-4 py-2 rounded-xl text-xs font-mono text-amber-200 shadow-2xl flex items-center gap-2.5 z-40 animate-bounce">
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>
            <strong>
              Auto-Recalibrated Step #{recalibrationNotice.stepNumber}:
            </strong>{" "}
            Position shifted from ({recalibrationNotice.oldX},{" "}
            {recalibrationNotice.oldY}) → ({recalibrationNotice.newX},{" "}
            {recalibrationNotice.newY}) [+{recalibrationNotice.distance}px]
          </span>
        </div>
      )}

      {/* Frame Status Badge */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 z-30 pointer-events-none">
        {verificationBadge && (
          <div
            className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 backdrop-blur-md shadow-lg border ${
              verificationBadge.status === "verified"
                ? "bg-emerald-950/90 border-emerald-500 text-emerald-300"
                : verificationBadge.status === "verifying"
                  ? "bg-amber-950/90 border-amber-500 text-amber-300 animate-pulse"
                  : "bg-red-950/90 border-red-500 text-red-300"
            }`}
          >
            {verificationBadge.status === "verified" ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            )}
            <span>
              {verificationBadge.message ||
                verificationBadge.status.toUpperCase()}
            </span>
          </div>
        )}

        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-700 px-2.5 py-1 rounded text-xs font-mono text-slate-300 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isCapturing ? "bg-green-500 animate-ping" : "bg-slate-500"
            }`}
          />
          <span>{isCapturing ? "LIVE 1920x1080" : "IDLE"}</span>
        </div>
      </div>

      {/* SVG Connecting Flow Lines for Click Sequence */}
      {sequence.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <polyline
            points={polylinePoints}
            fill="none"
            stroke="url(#flowGrad)"
            strokeWidth="4"
            filter="url(#glow)"
            strokeDasharray="8 6"
            className="opacity-70 animate-[dash_20s_linear_infinite]"
          />

          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            className="opacity-90"
          />
        </svg>
      )}

      {/* AI #1 Qwen Vision Detected UI Element Bounding Boxes */}
      {uiElements.map((el) => {
        const boxStyle = toBoxPercent(el.boundingBox);
        return (
          <div
            key={el.id}
            style={boxStyle}
            className="absolute border border-cyan-400/60 bg-cyan-500/5 hover:bg-cyan-500/20 hover:border-cyan-300 transition-all rounded pointer-events-none z-10 group"
          >
            <div className="absolute -top-4 left-0 bg-slate-950/90 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 px-1 py-0.2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {el.name} ({el.type}) • {(el.confidence * 100).toFixed(0)}%
            </div>
          </div>
        );
      })}

      {/* AI #1 Perception Feedback Focus Point (Cyan Reticle) */}
      {perceptionFeedback && (
        <div
          style={toPercent(perceptionFeedback.x, perceptionFeedback.y)}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
        >
          <div className="absolute -inset-4 border border-cyan-400/60 rounded-full animate-ping" />
          <div className="w-8 h-8 border border-dashed border-cyan-400 rounded-full flex items-center justify-center bg-cyan-950/30">
            <Eye className="w-3.5 h-3.5 text-cyan-300" />
          </div>
          {perceptionFeedback.label && (
            <div className="absolute top-9 left-1/2 transform -translate-x-1/2 bg-slate-950/90 border border-cyan-500/40 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 whitespace-nowrap shadow-md">
              {perceptionFeedback.label}
            </div>
          )}
        </div>
      )}

      {/* AI #2 Focus & Thinking Animation Layer (Purple / Amber) */}
      {aiThinking && aiThinking.isThinking && (
        <div
          style={toPercent(aiThinking.x, aiThinking.y)}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
        >
          <div className="absolute -inset-10 border-2 border-purple-500/60 rounded-full animate-ping" />
          <div className="absolute -inset-6 border border-cyan-400/80 rounded-full animate-pulse" />

          <div className="w-12 h-12 border-2 border-dashed border-purple-400 rounded-full animate-[spin_4s_linear_infinite] flex items-center justify-center bg-purple-950/40 backdrop-blur-xs shadow-[0_0_20px_rgba(168,85,247,0.8)]">
            <Brain className="w-5 h-5 text-purple-300 animate-pulse" />
          </div>

          <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-slate-950/90 border border-purple-400/80 px-3 py-1.5 rounded-lg shadow-2xl backdrop-blur-md whitespace-nowrap min-w-[160px] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-300">
              <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
              <span>AI #2 Planner Active</span>
            </div>
            <div className="text-[11px] font-mono text-slate-200 mt-0.5">
              {aiThinking.action || "Formulating Next Step"}
            </div>
            <div className="text-[9px] text-purple-400 font-mono mt-0.5">
              Conf: {(aiThinking.confidence * 100).toFixed(0)}% • (
              {aiThinking.x}, {aiThinking.y})
            </div>
          </div>
        </div>
      )}

      {/* Click Sequence Step Nodes (Interactive & Draggable) */}
      {sequence.map((step) => {
        const pos = toPercent(step.x, step.y);
        const isActive = activeStepId === step.id;
        const isDragging = draggingStepId === step.id;

        return (
          <div
            key={step.id}
            style={{ left: pos.left, top: pos.top }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDraggingStepId(step.id);
              if (onSelectStep) onSelectStep(step.id);
            }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing group transition-transform ${
              isDragging ? "scale-125 z-40" : "hover:scale-110"
            }`}
          >
            {isActive && (
              <div className="absolute -inset-3 bg-amber-500/40 rounded-full animate-ping pointer-events-none" />
            )}

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono shadow-2xl border-2 transition-all duration-200 ${
                isActive
                  ? "bg-amber-500 border-white text-black ring-4 ring-amber-400/50 scale-110 shadow-[0_0_20px_rgba(245,158,11,1)]"
                  : step.status === "completed"
                    ? "bg-emerald-600 border-emerald-300 text-white"
                    : step.recalibrated
                      ? "bg-amber-900 border-amber-400 text-amber-200"
                      : "bg-slate-900/90 border-cyan-400 text-cyan-300 hover:border-white hover:bg-cyan-900"
              }`}
            >
              {step.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                step.stepNumber
              )}
            </div>

            <div className="absolute -inset-2 border border-dashed border-cyan-400/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none animate-[spin_8s_linear_infinite]" />

            <div className="absolute top-9 left-1/2 transform -translate-x-1/2 bg-slate-950/95 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-slate-200 shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
              <div className="font-bold text-cyan-300">{step.name}</div>
              <div className="text-slate-300">
                {step.action} {step.text ? `"${step.text}"` : ""} •{" "}
                {step.delayMs}ms ({step.x}, {step.y})
              </div>
            </div>
          </div>
        );
      })}

      {/* Real-Time Motion Particle Ribbon Trail */}
      {splineMotionTrail.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
          <defs>
            <linearGradient
              id="spline-ribbon-grad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
            </linearGradient>
            <filter id="ribbon-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polyline
            points={splineMotionTrail
              .map(
                (pt) =>
                  `${(pt.x / NATIVE_WIDTH) * 1000},${(pt.y / NATIVE_HEIGHT) * 562.5}`,
              )
              .join(" ")}
            fill="none"
            stroke="url(#spline-ribbon-grad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ribbon-glow)"
          />
        </svg>
      )}

      {/* Realistic Glowing Arrowhead Cursor (↖️) & Touch Pointer */}
      {replayingCursorPos && (
        <div
          style={{
            left: `${(replayingCursorPos.x / NATIVE_WIDTH) * 100}%`,
            top: `${(replayingCursorPos.y / NATIVE_HEIGHT) * 100}%`,
          }}
          className="absolute -translate-x-1 -translate-y-1 pointer-events-none z-50 flex flex-col items-start transition-transform duration-75"
        >
          {/* Radial Aura */}
          <div className="absolute -inset-4 bg-cyan-500/30 rounded-full animate-ping" />

          {/* Glowing Arrowhead SVG */}
          <svg
            className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] transform -rotate-12"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M4 0l16 12-7 2 4 8-3 1-4-8-6 5v-20z" />
          </svg>

          {/* Coordinate Tag */}
          <span className="ml-5 -mt-2 px-1.5 py-0.5 rounded bg-black/90 text-[8px] font-mono font-bold text-yellow-300 border border-cyan-800 shadow-md whitespace-nowrap">
            ({replayingCursorPos.x}, {replayingCursorPos.y})
          </span>
        </div>
      )}

      {/* Pre-Recording Freehand Drawing & Step Pinning Overlay Layer */}
      {isDrawingOverlayOpen && (
        <div
          onMouseDown={(e) => {
            const coords = getNativeCoordinates(e);
            if (overlayActiveTool === "route") {
              setIsFreehandDrawing(true);
              setFreehandRoutePoints([{ x: coords.x, y: coords.y }]);
            }
          }}
          onMouseMove={(e) => {
            const coords = getNativeCoordinates(e);
            setMousePos({ x: coords.x, y: coords.y });
            if (isFreehandDrawing && overlayActiveTool === "route") {
              setFreehandRoutePoints((prev) => [
                ...prev,
                { x: coords.x, y: coords.y },
              ]);
            }
          }}
          onMouseUp={() => {
            if (isFreehandDrawing) {
              setIsFreehandDrawing(false);
            }
          }}
          onClick={(e) => {
            const coords = getNativeCoordinates(e);
            if (overlayActiveTool !== "route") {
              const stepNum = sequence.length + 1;
              const actionType =
                overlayActiveTool === "task" ? "type_text" : "click";
              const stepName =
                overlayActiveTool === "goal"
                  ? `Goal Step #${stepNum}`
                  : overlayActiveTool === "task"
                    ? `Type Step #${stepNum}`
                    : `Step #${stepNum}`;

              // Immediately add step to active workflow sequence without closing
              onAddStep({
                stepNumber: stepNum,
                name: stepName,
                action: actionType as any,
                x: coords.x,
                y: coords.y,
                text: overlayActiveTool === "task" ? "input_text" : "",
                delayMs: 400,
                status: "pending",
              });
            }
          }}
          className="absolute inset-0 z-40 bg-black/20 backdrop-blur-[0.5px] pointer-events-auto cursor-crosshair select-none"
        >
          {/* Overlay Top Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 left-1/2 transform -translate-x-1/2 p-1.5 rounded-xl bg-slate-950/95 border border-cyan-500/80 shadow-2xl flex items-center gap-2 text-xs font-mono z-50 pointer-events-auto"
          >
            <span className="text-cyan-300 font-bold px-2 flex items-center gap-1">
              <Brush className="w-3.5 h-3.5 text-cyan-400" />
              <span>DRAW & PIN TOOL:</span>
            </span>
            {(["route", "click", "task", "goal"] as const).map((t) => (
              <button
                key={t}
                onClick={(e) => {
                  e.stopPropagation();
                  setOverlayActiveTool(t);
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                  overlayActiveTool === t
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-950 ring-1 ring-cyan-300"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {t === "route"
                  ? "〰️ Freehand Route"
                  : t === "click"
                    ? "🎯 Step Pin (1-Click)"
                    : t === "task"
                      ? "⚡ Type Task"
                      : "🏆 Goal"}
              </button>
            ))}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDrawingOverlayOpen(false);
              }}
              title="Close Overlay"
              className="px-2 text-slate-300 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>

          {/* Render Drawn Freehand Spline Route */}
          {freehandRoutePoints.length > 1 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-30"
              viewBox="0 0 1000 562.5"
            >
              <defs>
                <linearGradient
                  id="freehand-spline-grad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <polyline
                points={freehandRoutePoints
                  .map(
                    (p) =>
                      `${(p.x / NATIVE_WIDTH) * 1000},${(p.y / NATIVE_HEIGHT) * 562.5}`,
                  )
                  .join(" ")}
                fill="none"
                stroke="url(#freehand-spline-grad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      )}

      {/* Interactive Quick Action Recording Popover */}
      {recordingClickPos && isRecordMode && (
        <div
          style={{
            left: `${Math.min(75, Math.max(25, recordingClickPos.pctX))}%`,
            top: `${Math.min(70, Math.max(30, recordingClickPos.pctY))}%`,
          }}
          onClick={(e) => e.stopPropagation()}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-slate-950/95 border-2 border-amber-500/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md z-50 w-72 space-y-2.5 text-xs text-slate-100"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Record Action Step</span>
            </div>
            <button
              onClick={() => setRecordingClickPos(null)}
              className="text-slate-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span>Coordinates:</span>
            <span className="text-cyan-300 font-bold">
              ({recordingClickPos.x}, {recordingClickPos.y})
            </span>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-300 mb-1 block">
              Action Type:{" "}
              <span className="text-amber-400">
                (Left click = click • Right-click canvas = right_click)
              </span>
            </label>
            <Select
              value={popoverAction}
              onValueChange={(val: any) => setPopoverAction(val)}
            >
              <SelectTrigger
                className={`h-7 text-xs border ${popoverAction === "right_click" ? "bg-amber-950 border-amber-500 text-amber-200" : "bg-slate-900 border-slate-700"}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-xs">
                <SelectItem value="click">🖱️ Left Click</SelectItem>
                <SelectItem value="double_click">🖱️ Double Click</SelectItem>
                <SelectItem value="right_click">
                  🖱️ Right Click ★ (context menu)
                </SelectItem>
                <SelectItem value="clear_and_type">
                  ⌨️ Clear & Type Text
                </SelectItem>
                <SelectItem value="type_text">⌨️ Type Text String</SelectItem>
                <SelectItem value="press_key">
                  🧭 Press Navigation Key
                </SelectItem>
                <SelectItem value="hotkey">
                  ⚡ Key Combination / Hotkey
                </SelectItem>
                <SelectItem value="scroll">📜 Scroll View</SelectItem>
                <SelectItem value="wait">⏳ Wait Delay</SelectItem>
              </SelectContent>
            </Select>
            {popoverAction === "right_click" && (
              <p className="text-[10px] text-amber-300 mt-1 bg-amber-950/40 border border-amber-800 rounded px-1.5 py-0.5">
                Right-click will be executed via pyautogui.rightClick — drift
                respects Exact/Variation mode
              </p>
            )}
          </div>

          {/* Dynamic Payload Inputs for Type / Key */}
          {(popoverAction === "type_text" ||
            popoverAction === "clear_and_type") && (
            <div>
              <label className="text-[10px] font-mono text-slate-300 mb-1 block">
                Text to Type:
              </label>
              <Input
                value={popoverText}
                onChange={(e) => setPopoverText(e.target.value)}
                placeholder="Enter input text..."
                className="h-7 text-xs bg-slate-900 border-slate-700 text-slate-200"
                autoFocus
              />
            </div>
          )}

          {popoverAction === "press_key" && (
            <div>
              <label className="text-[10px] font-mono text-slate-300 mb-1 block">
                Key to Press:
              </label>
              <Select value={popoverKey} onValueChange={setPopoverKey}>
                <SelectTrigger className="h-7 text-xs bg-slate-900 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-xs">
                  <SelectItem value="enter">↵ Enter / Return</SelectItem>
                  <SelectItem value="tab">⇥ Tab (Next Field)</SelectItem>
                  <SelectItem value="escape">⎋ Escape</SelectItem>
                  <SelectItem value="backspace">⌫ Backspace</SelectItem>
                  <SelectItem value="space">Spacebar</SelectItem>
                  <SelectItem value="down">↓ Down Arrow</SelectItem>
                  <SelectItem value="up">↑ Up Arrow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {popoverAction === "hotkey" && (
            <div>
              <label className="text-[10px] font-mono text-slate-300 mb-1 block">
                Hotkey Combination:
              </label>
              <Select value={popoverKey} onValueChange={setPopoverKey}>
                <SelectTrigger className="h-7 text-xs bg-slate-900 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-xs">
                  <SelectItem value="ctrl+a">Ctrl + A (Select All)</SelectItem>
                  <SelectItem value="ctrl+c">Ctrl + C (Copy)</SelectItem>
                  <SelectItem value="ctrl+v">Ctrl + V (Paste)</SelectItem>
                  <SelectItem value="alt+tab">
                    Alt + Tab (Switch Window)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mb-1">
              <span>Step Delay:</span>
              <span className="text-cyan-400 font-bold">{popoverDelay} ms</span>
            </div>
            <Slider
              value={[popoverDelay]}
              min={50}
              max={5000}
              step={50}
              onValueChange={([val]) => setPopoverDelay(val)}
              className="w-full"
            />
          </div>

          <label className="flex items-center gap-1.5 text-[11px] font-mono cursor-pointer select-none">
            <input
              type="checkbox"
              checked={popoverSaveScreenshot}
              onChange={(e) => setPopoverSaveScreenshot(e.target.checked)}
              className="w-3.5 h-3.5 rounded"
            />
            <span
              className={
                popoverSaveScreenshot
                  ? "text-cyan-300 font-bold"
                  : "text-slate-300"
              }
            >
              Save screenshot with this step
            </span>
            <span className="text-slate-400">
              (
              {popoverSaveScreenshot
                ? "ON — stores live frame for preview"
                : "OFF"}
              )
            </span>
          </label>

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleCommitRecordStep}
              className="w-full h-7 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md"
            >
              Add Step #{sequence.length + 1}{" "}
              {popoverAction === "right_click"
                ? "• Right Click"
                : popoverAction === "clear_and_type"
                  ? "• Clear+Type"
                  : ""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
