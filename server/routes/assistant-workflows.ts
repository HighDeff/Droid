import { Request, Response, Router } from "express";
import { z } from "zod";
import type {
  AssistantWorkflow,
  OperationPack,
  SavedState,
  WorkflowGoalProgress,
} from "@shared/assistant";
import { assistantStateRepository } from "../assistant-state";
import { workflowRuntime } from "../workflow-runtime";
import { liveEvents } from "../live-events";

const isoDate = z.string().datetime({ offset: true });
const itemStatus = z.enum(["pending", "in_progress", "completed", "blocked"]);
const schedule = z.object({
  enabled: z.boolean(),
  nextRunAt: isoDate.optional(),
  timezone: z.string().min(1).max(100).optional(),
});
const pauseResumePolicy = z.object({
  pauseOnError: z.boolean(),
  allowResume: z.boolean(),
  resumeMode: z.enum(["manual", "scheduled"]),
});
const taskProgress = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
  status: itemStatus,
  completed: z.number().int().min(0),
  total: z.number().int().min(0),
});
const goalProgress = z.object({
  goalId: z.string().min(1),
  title: z.string().min(1),
  status: itemStatus,
  completed: z.number().int().min(0),
  total: z.number().int().min(0),
  tasks: z.array(taskProgress),
});

const workflowFields = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
  status: z
    .enum(["active", "paused", "completed", "archived"])
    .default("active"),
  operationPackIds: z.array(z.string().min(1)).max(100).default([]),
  checkpointIds: z.array(z.string().min(1)).max(100).default([]),
  repeatCount: z.number().int().min(0).max(1000).default(0),
  schedule: schedule.default({ enabled: false }),
  pauseResumePolicy: pauseResumePolicy.default({
    pauseOnError: true,
    allowResume: true,
    resumeMode: "manual",
  }),
  goals: z.array(goalProgress).max(100).default([]),
});

const operationPack = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
  operations: z.array(z.string().trim().min(1).max(500)).max(100),
  enabled: z.boolean().default(true),
});
const checkpoint = z.object({
  label: z.string().trim().min(1).max(120),
  snapshot: z.record(z.unknown()),
});

const parse = <T extends z.ZodTypeAny>(
  schema: T,
  req: Request,
  res: Response,
): z.infer<T> | undefined => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: "Invalid workflow request",
      issues: result.error.issues,
    });
    return undefined;
  }
  return result.data;
};

const sessionIdFrom = (req: Request) =>
  String(req.query.sessionId ?? req.body?.sessionId ?? "");

const requireSession = (sessionId: string, res: Response) => {
  if (!sessionId || !assistantStateRepository.getSession(sessionId)) {
    res
      .status(404)
      .json({ success: false, error: "Assistant session not found" });
    return false;
  }
  return true;
};

const ownsReferences = (
  sessionId: string,
  operationPackIds: string[],
  checkpointIds: string[],
) =>
  operationPackIds.every((id) =>
    assistantStateRepository.getResource("operationPacks", id, sessionId),
  ) &&
  checkpointIds.every((id) =>
    assistantStateRepository.getResource("savedStates", id, sessionId),
  );

export const assistantWorkflowsRouter = Router();

// This repository is intentionally in-memory. Restart persistence is not yet guaranteed.
assistantWorkflowsRouter.get("/", (req, res) => {
  const sessionId = sessionIdFrom(req);
  if (!requireSession(sessionId, res)) return;
  res.json({
    success: true,
    workflows: assistantStateRepository.listWorkflows(sessionId),
    persistence: "in-memory",
  });
});

assistantWorkflowsRouter.post("/", (req, res) => {
  const sessionId = sessionIdFrom(req);
  if (!requireSession(sessionId, res)) return;
  const body = parse(workflowFields, req, res);
  if (!body) return;
  if (!ownsReferences(sessionId, body.operationPackIds, body.checkpointIds)) {
    return res.status(400).json({
      success: false,
      error: "Operation packs and checkpoints must belong to the session",
    });
  }
  const workflow = assistantStateRepository.createWorkflow(
    sessionId,
    body as Omit<
      AssistantWorkflow,
      "id" | "sessionId" | "createdAt" | "updatedAt"
    >,
  );
  res.status(201).json({ success: true, workflow });
});

assistantWorkflowsRouter.get("/:workflowId", (req, res) => {
  const sessionId = sessionIdFrom(req);
  if (!requireSession(sessionId, res)) return;
  const workflow = assistantStateRepository.getWorkflow(
    req.params.workflowId,
    sessionId,
  );
  if (!workflow)
    return res
      .status(404)
      .json({ success: false, error: "Workflow not found" });
  res.json({ success: true, workflow });
});

assistantWorkflowsRouter.put("/:workflowId", (req, res) => {
  const sessionId = sessionIdFrom(req);
  if (!requireSession(sessionId, res)) return;
  const body = parse(workflowFields.partial(), req, res);
  if (!body) return;
  if (
    !ownsReferences(
      sessionId,
      body.operationPackIds ?? [],
      body.checkpointIds ?? [],
    )
  ) {
    return res.status(400).json({
      success: false,
      error: "Operation packs and checkpoints must belong to the session",
    });
  }
  const workflow = assistantStateRepository.updateWorkflow(
    req.params.workflowId,
    sessionId,
    body as Partial<AssistantWorkflow>,
  );
  if (!workflow)
    return res
      .status(404)
      .json({ success: false, error: "Workflow not found" });
  res.json({ success: true, workflow });
});

assistantWorkflowsRouter.post("/:workflowId/operation-packs", (req, res) => {
  const sessionId = sessionIdFrom(req);
  if (!requireSession(sessionId, res)) return;
  const workflow = assistantStateRepository.getWorkflow(
    req.params.workflowId,
    sessionId,
  );
  if (!workflow)
    return res
      .status(404)
      .json({ success: false, error: "Workflow not found" });
  const body = parse(operationPack, req, res);
  if (!body) return;
  const pack = assistantStateRepository.createResource(
    "operationPacks",
    sessionId,
    body,
  ) as OperationPack;
  const updated = assistantStateRepository.updateWorkflow(
    workflow.id,
    sessionId,
    { operationPackIds: [...workflow.operationPackIds, pack.id] },
  );
  res
    .status(201)
    .json({ success: true, operationPack: pack, workflow: updated });
});

assistantWorkflowsRouter.post("/:workflowId/checkpoints", (req, res) => {
  const sessionId = sessionIdFrom(req);
  if (!requireSession(sessionId, res)) return;
  const workflow = assistantStateRepository.getWorkflow(
    req.params.workflowId,
    sessionId,
  );
  if (!workflow)
    return res
      .status(404)
      .json({ success: false, error: "Workflow not found" });
  const body = parse(checkpoint, req, res);
  if (!body) return;
  const savedState = assistantStateRepository.createResource(
    "savedStates",
    sessionId,
    body,
  ) as SavedState;
  const updated = assistantStateRepository.updateWorkflow(
    workflow.id,
    sessionId,
    { checkpointIds: [...workflow.checkpointIds, savedState.id] },
  );
  res
    .status(201)
    .json({ success: true, checkpoint: savedState, workflow: updated });
});

assistantWorkflowsRouter.put("/:workflowId/progress", (req, res) => {
  const sessionId = sessionIdFrom(req);
  if (!requireSession(sessionId, res)) return;
  const workflow = assistantStateRepository.getWorkflow(
    req.params.workflowId,
    sessionId,
  );
  if (!workflow)
    return res
      .status(404)
      .json({ success: false, error: "Workflow not found" });
  const parsed = z
    .object({ goals: z.array(goalProgress).max(100) })
    .safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({
      success: false,
      error: "Invalid workflow progress",
      issues: parsed.error.issues,
    });
  const updated = assistantStateRepository.updateWorkflow(
    workflow.id,
    sessionId,
    { goals: parsed.data.goals as WorkflowGoalProgress[] },
  );
  res.json({ success: true, workflow: updated });
});

assistantWorkflowsRouter.post("/:workflowId/run", (req, res) => {
  const sessionId = sessionIdFrom(req);
  if (!requireSession(sessionId, res)) return;
  const workflow = assistantStateRepository.getWorkflow(
    req.params.workflowId,
    sessionId,
  );
  if (!workflow)
    return res
      .status(404)
      .json({ success: false, error: "Workflow not found" });
  if (workflow.status !== "active") {
    return res
      .status(409)
      .json({ success: false, error: "Only active workflows may run" });
  }
  const runtime = workflowRuntime.runNow(workflow.id, sessionId);
  res.status(202).json({ success: true, workflow, runtime });
});

assistantWorkflowsRouter.get("/:workflowId/runtime", (req, res) => {
  const sessionId = sessionIdFrom(req);
  if (!requireSession(sessionId, res)) return;
  const workflow = assistantStateRepository.getWorkflow(
    req.params.workflowId,
    sessionId,
  );
  if (!workflow)
    return res
      .status(404)
      .json({ success: false, error: "Workflow not found" });
  res.json({ success: true, runtime: workflowRuntime.status(workflow.id) });
});

assistantWorkflowsRouter.post("/:workflowId/stop", (req, res) => {
  const sessionId = sessionIdFrom(req);
  if (!requireSession(sessionId, res)) return;
  const workflow = assistantStateRepository.getWorkflow(
    req.params.workflowId,
    sessionId,
  );
  if (!workflow)
    return res
      .status(404)
      .json({ success: false, error: "Workflow not found" });
  const updated = assistantStateRepository.updateWorkflow(
    workflow.id,
    sessionId,
    {
      status: "paused",
      schedule: { ...workflow.schedule, enabled: false },
    },
  );
  liveEvents.publish(sessionId, "workflow.stopped", {
    workflowId: workflow.id,
    reason: "stopped by user",
  });
  res.json({ success: true, workflow: updated });
});
