import { Router } from "express";
import { z } from "zod";
import { assistantStateRepository } from "../assistant-state";
import { executionStateRepository } from "../execution-state";

const action = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("click"),
    x: z.number().finite().min(0).max(10000),
    y: z.number().finite().min(0).max(10000),
    button: z.enum(["left", "right"]).optional(),
  }),
  z.object({ type: z.literal("type"), text: z.string().min(1).max(4000) }),
  z.object({
    type: z.literal("key"),
    key: z
      .string()
      .regex(/^[A-Za-z0-9]+$/)
      .max(32),
  }),
  z.object({
    type: z.literal("wait"),
    durationMs: z.number().int().min(0).max(5000),
  }),
  z.object({
    type: z.literal("screenshot"),
    label: z.string().max(100).optional(),
  }),
  z.object({
    type: z.literal("navigate-shortcut"),
    shortcut: z.enum(["back", "forward", "home", "refresh"]),
  }),
]);

export const allowlistedActionSchema = action;

const startBody = z.object({
  planId: z.string().min(1),
  sessionId: z.string().min(1),
  confirmation: z.literal(true),
});

export const assistantExecutionRouter = Router();

assistantExecutionRouter.post("/", (req, res) => {
  const parsed = startBody.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({
      success: false,
      error: "A plan ID, session ID, and explicit confirmation are required",
      issues: parsed.error.issues,
    });
  const plan = assistantStateRepository.getPlan(
    parsed.data.planId,
    parsed.data.sessionId,
  );
  if (!plan)
    return res
      .status(404)
      .json({ success: false, error: "Assistant plan not found" });
  if (plan.approvalState !== "approved")
    return res
      .status(409)
      .json({ success: false, error: "Only approved plans may execute" });
  const validatedSteps = plan.steps.map((step) => ({
    ...step,
    action: step.action ? action.safeParse(step.action) : null,
  }));
  if (validatedSteps.some((step) => !step.action?.success)) {
    return res.status(400).json({
      success: false,
      error:
        "Every approved step must contain one validated allowlisted action",
    });
  }
  const execution = executionStateRepository.create(plan);
  void executionStateRepository.start(execution, plan);
  return res.status(202).json({ success: true, execution });
});

assistantExecutionRouter.get("/:executionId", (req, res) => {
  const execution = executionStateRepository.get(req.params.executionId);
  if (!execution)
    return res
      .status(404)
      .json({ success: false, error: "Execution not found" });
  res.json({ success: true, execution });
});

assistantExecutionRouter.post("/:executionId/pause", (req, res) => {
  const execution = executionStateRepository.pause(req.params.executionId);
  if (!execution)
    return res
      .status(404)
      .json({ success: false, error: "Execution not found" });
  res.json({ success: true, execution });
});

assistantExecutionRouter.post("/:executionId/cancel", (req, res) => {
  const execution = executionStateRepository.cancel(req.params.executionId);
  if (!execution)
    return res
      .status(404)
      .json({ success: false, error: "Execution not found" });
  res.json({ success: true, execution });
});
