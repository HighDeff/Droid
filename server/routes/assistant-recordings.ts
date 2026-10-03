import { Router } from "express";
import { z } from "zod";
import type {
  RecordedAction,
  RecordingSourceMetadata,
} from "@shared/recordings";
import type { AllowlistedAction, PlannedStep } from "@shared/assistant";
import { recordingRepository } from "../recording-state";
import { assistantStateRepository } from "../assistant-state";
import { allowlistedActionSchema } from "./assistant-execution";
import { liveEvents } from "../live-events";

const source = z.object({
  source: z.enum(["browser-panel", "manual", "imported", "assistant"]),
  appId: z.string().max(100).optional(),
  pagePath: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
  sensitiveInputCaptured: z.literal(false),
});
const action = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    timestamp: z.string().datetime(),
    source,
    type: z.literal("mouse-click"),
    x: z.number().finite(),
    y: z.number().finite(),
    button: z.enum(["left", "middle", "right"]),
    target: z.string().max(200).optional(),
  }),
  z.object({
    id: z.string().min(1),
    timestamp: z.string().datetime(),
    source,
    type: z.literal("mouse-move"),
    x: z.number().finite(),
    y: z.number().finite(),
    target: z.string().max(200).optional(),
  }),
  z.object({
    id: z.string().min(1),
    timestamp: z.string().datetime(),
    source,
    type: z.literal("keyboard-key"),
    key: z.string().min(1).max(100),
    code: z.string().max(100).optional(),
    modifiers: z.array(z.string().max(20)).max(5),
    sensitive: z.literal(false),
  }),
  z.object({
    id: z.string().min(1),
    timestamp: z.string().datetime(),
    source,
    type: z.literal("keyboard-text"),
    text: z.string().max(2000).optional(),
    redacted: z.boolean(),
    sensitive: z.literal(true),
  }),
  z.object({
    id: z.string().min(1),
    timestamp: z.string().datetime(),
    source,
    type: z.literal("wait"),
    durationMs: z.number().int().min(0).max(86_400_000),
  }),
  z.object({
    id: z.string().min(1),
    timestamp: z.string().datetime(),
    source,
    type: z.literal("screenshot-checkpoint"),
    label: z.string().trim().min(1).max(200),
    imageRef: z.string().max(500).optional(),
  }),
  z.object({
    id: z.string().min(1),
    timestamp: z.string().datetime(),
    source,
    type: z.literal("note"),
    text: z.string().trim().min(1).max(2000),
  }),
]);
const startBody = z.object({
  sessionId: z.string().trim().min(1).max(200).default("browser"),
  name: z.string().trim().min(1).max(200).default("Untitled recording"),
  source,
});
const appendBody = z.object({ events: z.array(action).min(1).max(500) });

const invalid = (res: any, error: string, issues: unknown) =>
  res.status(400).json({ success: false, error, issues });

export const assistantRecordingsRouter = Router();

assistantRecordingsRouter.post("/start", (req, res) => {
  const parsed = startBody.safeParse(req.body);
  if (!parsed.success)
    return invalid(res, "Invalid recording start", parsed.error.issues);
  res.status(201).json({
    success: true,
    recording: recordingRepository.start(
      parsed.data.sessionId,
      parsed.data.name,
      parsed.data.source as RecordingSourceMetadata,
    ),
  });
});

assistantRecordingsRouter.post("/:recordingId/stop", (req, res) => {
  const recording = recordingRepository.stop(req.params.recordingId);
  if (!recording)
    return res
      .status(404)
      .json({ success: false, error: "Recording not found" });
  res.json({ success: true, recording });
});

assistantRecordingsRouter.post("/:recordingId/events", (req, res) => {
  const parsed = appendBody.safeParse(req.body);
  if (!parsed.success)
    return invalid(res, "Invalid recording events", parsed.error.issues);
  const existing = recordingRepository.get(req.params.recordingId);
  if (!existing)
    return res
      .status(404)
      .json({ success: false, error: "Recording not found" });
  if (existing.status !== "recording")
    return res
      .status(409)
      .json({ success: false, error: "Recording is stopped" });
  res.json({
    success: true,
    recording: recordingRepository.append(
      req.params.recordingId,
      parsed.data.events as RecordedAction[],
    ),
  });
});

assistantRecordingsRouter.get("/", (req, res) =>
  res.json({
    success: true,
    recordings: recordingRepository.list(req.query.sessionId?.toString()),
  }),
);

assistantRecordingsRouter.get("/:recordingId", (req, res) => {
  const recording = recordingRepository.get(req.params.recordingId);
  if (!recording)
    return res
      .status(404)
      .json({ success: false, error: "Recording not found" });
  res.json({ success: true, recording });
});

assistantRecordingsRouter.post("/:recordingId/operation-pack", (req, res) => {
  const pack = recordingRepository.createOperationPack(req.params.recordingId);
  if (!pack)
    return res
      .status(404)
      .json({ success: false, error: "Recording not found" });
  res.status(201).json({ success: true, operationPack: pack });
});

assistantRecordingsRouter.post("/:recordingId/plan-draft", (req, res) => {
  const plan = recordingRepository.createPlanDraft(req.params.recordingId);
  if (!plan)
    return res
      .status(404)
      .json({ success: false, error: "Recording not found" });
  res.status(201).json({ success: true, planDraft: plan });
});

/**
 * Turn a recording into a REAL, executable workflow in one call:
 * recording -> operation pack -> assistant session -> plan (with allowlisted
 * step actions converted from the recorded events) -> workflow.
 * The workflow can then be run via POST /api/assistant/workflows/:id/run
 * or repeated with live screen awareness via /run-live-aware.
 */
const toWorkflowBody = z.object({
  sessionId: z.string().min(1).max(200).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  repeatCount: z.number().int().min(0).max(1000).default(1),
});

/** Convert recorded events into executable, allowlisted plan-step actions. */
/** Normalize a recorded key name to a pyautogui/ADB-friendly key token. */
function normalizeKeyName(key: string, code?: string): string {
  const k = (key || "").toLowerCase();
  const map: Record<string, string> = {
    " ": "space",
    spacebar: "space",
    enter: "enter",
    return: "enter",
    escape: "escape",
    esc: "escape",
    backspace: "backspace",
    delete: "delete",
    del: "delete",
    tab: "tab",
    capslock: "capslock",
    shift: "shift",
    control: "ctrl",
    ctrl: "ctrl",
    alt: "alt",
    meta: "win",
    win: "win",
    command: "win",
    arrowup: "up",
    arrowdown: "down",
    arrowleft: "left",
    arrowright: "right",
    up: "up",
    down: "down",
    left: "left",
    right: "right",
    home: "home",
    end: "end",
    pageup: "pageup",
    pagedown: "pagedown",
    insert: "insert",
    f1: "f1", f2: "f2", f3: "f3", f4: "f4", f5: "f5", f6: "f6",
    f7: "f7", f8: "f8", f9: "f9", f10: "f10", f11: "f11", f12: "f12",
  };
  if (map[k]) return map[k];
  // Fall back to the physical code (KeyA -> a) for layout independence.
  const m = /^key([a-z])$/i.exec(code || "");
  if (m) return m[1].toLowerCase();
  if (/^[a-z0-9]$/i.test(key)) return key.toLowerCase();
  return "enter";
}

function recordedEventsToActions(
  events: RecordedAction[],
): { action: AllowlistedAction; title: string }[] {
  const out: { action: AllowlistedAction; title: string }[] = [];
  for (const event of events) {
    if (event.type === "mouse-click") {
      out.push({
        title: `Click ${event.button} at (${event.x}, ${event.y})`,
        action: {
          type: "click",
          x: event.x,
          y: event.y,
          button: event.button === "right" ? "right" : "left",
        },
      });
    } else if (event.type === "mouse-move") {
      // Deliberately omitted: replaying raw mouse-move waypoints adds no
      // value (the next click repositions the cursor anyway), and the old
      // code invented real CLICKS here — clicks the user never made.
      continue;
    } else if (event.type === "keyboard-key") {
      const key = normalizeKeyName(event.key, event.code);
      // Shift is implied by the character itself for printable keys
      // ("A" vs "a"), so it only counts as a modifier for non-printables.
      const isPrintable = event.key.length === 1 && /^[a-z0-9]$/i.test(event.key);
      const mods = (event.modifiers || [])
        .map((m) => normalizeKeyName(m))
        .filter(
          (m, i, arr) =>
            arr.indexOf(m) === i && (m !== "shift" || !isPrintable),
        );
      if (mods.length > 0) {
        // Modifier combo (ctrl+c, alt+tab, ...): "+" form, executed as a
        // real hotkey by the device executor.
        const combo = [...mods, key].join("+");
        out.push({
          title: `Hotkey ${combo}`,
          action: { type: "key", key: combo },
        });
      } else if (isPrintable) {
        out.push({
          title: `Type "${event.key}"`,
          action: { type: "type", text: event.key },
        });
      } else {
        out.push({
          title: `Press ${key}`,
          action: { type: "key", key },
        });
      }
    } else if (event.type === "wait") {
      out.push({
        title: `Wait ${event.durationMs}ms`,
        action: { type: "wait", durationMs: Math.min(event.durationMs, 5000) },
      });
    } else if (event.type === "screenshot-checkpoint") {
      out.push({
        title: `Checkpoint: ${event.label}`,
        action: { type: "screenshot", label: event.label.slice(0, 100) },
      });
    }
    // notes and redacted keyboard-text are review metadata — not executable.
  }
  return out;
}

assistantRecordingsRouter.post("/:recordingId/to-workflow", (req, res) => {
  const recording = recordingRepository.get(req.params.recordingId);
  if (!recording)
    return res
      .status(404)
      .json({ success: false, error: "Recording not found" });
  if (recording.events.length === 0)
    return res
      .status(400)
      .json({ success: false, error: "Recording has no events" });

  const parsed = toWorkflowBody.safeParse(req.body ?? {});
  if (!parsed.success)
    return invalid(res, "Invalid workflow request", parsed.error.issues);

  // 1. Operation pack (kept as the human-readable audit trail).
  const pack = recordingRepository.createOperationPack(req.params.recordingId)!;

  // 2. Session — reuse the caller's or create a fresh one.
  let session = parsed.data.sessionId
    ? assistantStateRepository.getSession(parsed.data.sessionId)
    : undefined;
  if (!session) {
    const timestamp = new Date().toISOString();
    session = assistantStateRepository.createSession({
      project: {
        id: `project_${Date.now()}`,
        name: "Recorded workflows",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      status: "active",
      goals: [],
      savedStateIds: [],
    });
  }

  // 3. Convert events to executable allowlisted actions -> plan steps.
  const converted = recordedEventsToActions(recording.events);
  if (converted.length === 0)
    return res.status(400).json({
      success: false,
      error: "No executable actions in recording (only notes/redacted input)",
    });
  const steps: PlannedStep[] = converted.map((c, i) => ({
    id: `step_${Date.now()}_${i}`,
    order: i + 1,
    title: c.title,
    description: `Converted from recording "${recording.name}".`,
    status: "approved" as const,
    timing: "when_ready" as const,
    confidence: 0.9,
    prerequisites: [],
    risks: [],
    action: allowlistedActionSchema.parse(c.action) as AllowlistedAction,
  }));

  const planTimestamp = new Date().toISOString();
  const plan = assistantStateRepository.createPlan(session.id, {
    instruction: {
      id: `instruction_${Date.now()}`,
      sessionId: session.id,
      text: `Execute the ${converted.length} recorded actions from "${recording.name}".`,
      createdAt: planTimestamp,
    },
    sourceCaptureIds: [],
    sourceNoteIds: [],
    clarifications: [],
    steps,
    prerequisites: [],
    risks: [],
    timing: "when_ready",
    confidence: 0.9,
    approvalState: "approved",
    approvedAt: planTimestamp,
  });

  // 4. Store the operation pack as a session resource and link the workflow.
  const storedPack = assistantStateRepository.createResource(
    "operationPacks",
    session.id,
    {
      name: pack.name,
      description: pack.description,
      operations: pack.operations,
      enabled: true,
    },
  );

  const workflow = assistantStateRepository.createWorkflow(session.id, {
    name:
      parsed.data.name ?? `${recording.name} workflow`,
    description: `Executable workflow created from recording "${recording.name}" on ${new Date().toLocaleString()}. REAL execution — running it drives the device.`,
    status: "active",
    planId: plan.id,
    operationPackIds: [storedPack.id],
    checkpointIds: [],
    repeatCount: parsed.data.repeatCount,
    schedule: { enabled: false },
    pauseResumePolicy: {
      pauseOnError: true,
      allowResume: true,
      resumeMode: "manual",
    },
    goals: [],
  });

  liveEvents.publish(session.id, "workflow.created", {
    workflowId: workflow.id,
    planId: plan.id,
    recordingId: recording.id,
    stepCount: steps.length,
  });

  res.status(201).json({
    success: true,
    workflow,
    plan,
    session,
    stepCount: steps.length,
  });
});
