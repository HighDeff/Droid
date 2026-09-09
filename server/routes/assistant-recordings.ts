import { Router } from "express";
import { z } from "zod";
import type {
  RecordedAction,
  RecordingSourceMetadata,
} from "@shared/recordings";
import { recordingRepository } from "../recording-state";

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
