import React from "react";
import {
  Zap,
  Ghost,
  BrainCircuit,
  PersonStanding,
  GraduationCap,
  Disc3,
  ListChecks,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Execution mode selector for the screen HUD.
 *
 * Every button here does something DIFFERENT — the badge on each button tells
 * you the truth about what will happen:
 *  - REAL: actually drives the PC / Android device (pyautogui / ADB)
 *  - SIM:  pure simulation — animates on the HUD, touches nothing real
 *  - AI:   the planner decides per-moment whether to interact or just watch
 *
 * Modes:
 *  run-real   — RUN ON PC: executes the recorded sequence for real, steps
 *               derived from the screenshot via AI interpretation/matching.
 *  drift-sim  — DRIFT SIMULATE: replays the path with human-like drift as a
 *               ghost overlay only. No API calls, nothing real moves.
 *  ai-decide  — AI DECIDE: perceives the live screen, then the AI decides
 *               each cycle whether to live-interact or just watch (moving
 *               elements, obstacles, loading states -> it waits and watches).
 *  follower   — FOLLOWER: mirrors YOUR mouse movements and clicks onto the
 *               target device in real time while active.
 *  learning   — LEARNING AUTO-ACT: pulls the best learned method for the
 *               current context, lets the AI set points / build the workflow
 *               from previous examples, executes it, and monitors the
 *               special elements it cares about with per-step verification.
 *  record-run — RECORD THEN RUN: records your movements, and the moment you
 *               stop recording it copies the capture and executes it for real.
 *  step-run   — STEP-RUN: executes the set steps directly, back-to-back,
 *               with no mouse-path animation or navigation in between.
 */
export type ExecutionModeId =
  | "run-real"
  | "drift-sim"
  | "ai-decide"
  | "follower"
  | "learning"
  | "record-run"
  | "step-run";

interface ModeDef {
  id: ExecutionModeId;
  label: string;
  icon: React.ReactNode;
  badge: "REAL" | "SIM" | "AI";
  badgeClass: string;
  description: string;
  needsSequence?: boolean;
}

export const EXECUTION_MODES: ModeDef[] = [
  {
    id: "run-real",
    label: "RUN ON PC",
    icon: <Zap className="w-3.5 h-3.5" />,
    badge: "REAL",
    badgeClass: "bg-red-600 text-white",
    description:
      "REAL execution: drives the actual PC (PyAutoGUI) or Android device (ADB). Steps come from the screenshot via AI interpretation / element matching. This REALLY clicks.",
    needsSequence: true,
  },
  {
    id: "drift-sim",
    label: "DRIFT SIMULATE",
    icon: <Ghost className="w-3.5 h-3.5" />,
    badge: "SIM",
    badgeClass: "bg-purple-600 text-white",
    description:
      "SIMULATION ONLY: replays the path with human-like drift as a ghost cursor on this HUD. Zero API calls — nothing real moves or clicks.",
    needsSequence: true,
  },
  {
    id: "ai-decide",
    label: "AI DECIDE",
    icon: <BrainCircuit className="w-3.5 h-3.5" />,
    badge: "AI",
    badgeClass: "bg-cyan-600 text-white",
    description:
      "AI takes the wheel: perceives the live screen each cycle and decides whether to LIVE-INTERACT or JUST WATCH (moving elements, obstacles, loading spinners → it waits and watches).",
  },
  {
    id: "follower",
    label: "FOLLOWER",
    icon: <PersonStanding className="w-3.5 h-3.5" />,
    badge: "REAL",
    badgeClass: "bg-red-600 text-white",
    description:
      "REAL: copies YOUR mouse movements and clicks onto the target device live while active. You drive, it mirrors. Desktop uses mouse_move; Android mirrors taps.",
  },
  {
    id: "learning",
    label: "LEARNING AUTO-ACT",
    icon: <GraduationCap className="w-3.5 h-3.5" />,
    badge: "AI",
    badgeClass: "bg-cyan-600 text-white",
    description:
      "AI auto-acts from previous examples: pulls the best learned method for this screen, sets its own points, builds the workflow, executes it, and monitors the special elements it cares about with per-step verification.",
  },
  {
    id: "record-run",
    label: "RECORD → RUN",
    icon: <Disc3 className="w-3.5 h-3.5" />,
    badge: "REAL",
    badgeClass: "bg-red-600 text-white",
    description:
      "REAL: starts recording your movements; the moment you stop, it copies the capture into steps and executes them for real on the target device.",
  },
  {
    id: "step-run",
    label: "STEP-RUN",
    icon: <ListChecks className="w-3.5 h-3.5" />,
    badge: "REAL",
    badgeClass: "bg-red-600 text-white",
    description:
      "REAL: executes the set steps directly, back-to-back, with no mouse-path navigation or animation in between. Fast headless dispatch.",
    needsSequence: true,
  },
];

interface ExecutionModeBarProps {
  activeMode: ExecutionModeId | null;
  busyLabel: string | null;
  sequenceCount: number;
  targetDevice: "desktop" | "android";
  onSelectMode: (mode: ExecutionModeId) => void;
  onStop: () => void;
}

export const ExecutionModeBar: React.FC<ExecutionModeBarProps> = ({
  activeMode,
  busyLabel,
  sequenceCount,
  targetDevice,
  onSelectMode,
  onStop,
}) => {
  const activeDef = EXECUTION_MODES.find((m) => m.id === activeMode);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {EXECUTION_MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          const disabled =
            !!activeMode ||
            (mode.needsSequence ? sequenceCount === 0 : false);
          return (
            <Button
              key={mode.id}
              size="sm"
              onClick={() => onSelectMode(mode.id)}
              disabled={disabled}
              title={mode.description}
              className={`h-8 text-[11px] font-mono font-bold gap-1.5 pr-2 ${
                isActive
                  ? "bg-amber-500 text-black ring-2 ring-amber-300 animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              } disabled:opacity-40`}
            >
              {mode.icon}
              {mode.label}
              <Badge
                className={`${mode.badgeClass} text-[8px] px-1 py-0 h-4 font-bold`}
              >
                {mode.badge}
              </Badge>
            </Button>
          );
        })}
        {activeMode && (
          <Button
            size="sm"
            onClick={onStop}
            title="Stop the active mode (or press Esc)"
            className="h-8 text-[11px] font-mono font-bold bg-red-700 hover:bg-red-600 text-white border border-red-400 gap-1.5"
          >
            <Square className="w-3.5 h-3.5" /> STOP
          </Button>
        )}
      </div>
      <div className="text-[10px] font-mono text-slate-400 min-h-[14px]">
        {activeDef ? (
          <span className="text-amber-300">
            ▶ {activeDef.label} active on{" "}
            {targetDevice === "android" ? "ANDROID" : "PC"}
            {busyLabel ? ` — ${busyLabel}` : ""}{" "}
            <span className="text-slate-500">(Esc stops)</span>
          </span>
        ) : (
          <span>
            Pick an execution mode —{" "}
            <span className="text-red-400 font-bold">REAL</span> drives the
            device, <span className="text-purple-400 font-bold">SIM</span>{" "}
            only pretends, <span className="text-cyan-400 font-bold">AI</span>{" "}
            decides.
          </span>
        )}
      </div>
    </div>
  );
};
