import { Response, Router } from "express";
import { z } from "zod";
import type {
  WaitCondition,
  WaitConditionObservation,
} from "@shared/assistant";
import { assistantStateRepository } from "../assistant-state";
import {
  evaluateWaitCondition,
  MAX_POLL_INTERVAL_MS,
  MAX_WAIT_TIMEOUT_MS,
  MIN_POLL_INTERVAL_MS,
} from "../wait-conditions";

const base = {
  id: z.string().min(1),
  label: z.string().trim().min(1).max(200),
  timeoutMs: z.number().int().min(1).max(MAX_WAIT_TIMEOUT_MS),
  pollIntervalMs: z
    .number()
    .int()
    .min(MIN_POLL_INTERVAL_MS)
    .max(MAX_POLL_INTERVAL_MS),
  confidenceThreshold: z.number().min(0).max(1),
  approved: z.boolean(),
};
const regionSchema = z.object({
  id: z.string().min(1),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive(),
  height: z.number().positive(),
  confidence: z.number().min(0).max(1).optional(),
});
export const conditionSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("visible_text"),
    text: z.string().min(1).max(500),
    caseSensitive: z.boolean().optional(),
  }),
  z.object({
    ...base,
    type: z.literal("region"),
    region: regionSchema,
  }),
  z.object({
    ...base,
    type: z.enum(["close_control", "next_control"]),
    controlLabel: z.string().trim().max(100).optional(),
  }),
  z.object({
    ...base,
    type: z.literal("timer"),
    durationMs: z.number().int().positive().max(MAX_WAIT_TIMEOUT_MS),
  }),
  z.object({
    ...base,
    type: z.literal("page_load_stable"),
    stableForMs: z.number().int().positive().max(MAX_WAIT_TIMEOUT_MS),
  }),
]);

const observationSchema = z.object({
  visibleText: z.string().optional(),
  regions: z.array(regionSchema).optional(),
  controls: z
    .array(
      z.object({
        type: z.enum(["close", "next"]),
        label: z.string().optional(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .optional(),
  pageLoadStable: z.boolean().optional(),
  timerElapsedMs: z.number().nonnegative().optional(),
});

const requireSession = (sessionId: string, res: Response) => {
  if (!assistantStateRepository.getSession(sessionId)) {
    res
      .status(404)
      .json({ success: false, error: "Assistant session not found" });
    return false;
  }
  return true;
};

export const assistantConditionsRouter = Router();

assistantConditionsRouter.get("/", (req, res) => {
  const sessionId = String(req.query.sessionId ?? "");
  if (!sessionId || !requireSession(sessionId, res)) return;
  res.json({
    success: true,
    conditions: assistantStateRepository.listWaitConditions(sessionId),
    events: assistantStateRepository.listConditionEvents(sessionId),
  });
});

assistantConditionsRouter.post("/", (req, res) => {
  const sessionId = String(req.body?.sessionId ?? "");
  const parsed = conditionSchema.safeParse(req.body?.condition);
  if (!sessionId || !parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid wait condition request",
      issues: parsed.success ? undefined : parsed.error.issues,
    });
  }
  if (!requireSession(sessionId, res)) return;
  const condition = assistantStateRepository.createWaitCondition(
    sessionId,
    parsed.data as WaitCondition,
  );
  res.status(201).json({ success: true, condition });
});

assistantConditionsRouter.post("/:conditionId/evaluate", (req, res) => {
  const sessionId = String(req.query.sessionId ?? req.body?.sessionId ?? "");
  if (!sessionId || !requireSession(sessionId, res)) return;
  const condition = assistantStateRepository.getWaitCondition(
    req.params.conditionId,
    sessionId,
  );
  if (!condition) {
    return res
      .status(404)
      .json({ success: false, error: "Wait condition not found" });
  }
  const parsed = observationSchema.safeParse(req.body?.observation ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid wait condition observation",
      issues: parsed.error.issues,
    });
  }
  const elapsedMs = Number(req.body?.elapsedMs ?? 0);
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return res
      .status(400)
      .json({ success: false, error: "elapsedMs must be non-negative" });
  }
  const evaluation = evaluateWaitCondition(
    condition,
    parsed.data as WaitConditionObservation,
    elapsedMs,
  );
  const event = assistantStateRepository.addConditionEvent(sessionId, {
    conditionId: condition.id,
    status: evaluation.status,
    message: evaluation.message,
    suggestion: evaluation.suggestion,
    confidence: evaluation.confidence,
  });
  res.json({ success: true, evaluation, event });
});
