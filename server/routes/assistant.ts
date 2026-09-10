import { RequestHandler, Router } from "express";
import { z } from "zod";
import { assistantStateRepository } from "../assistant-state";
import { liveEvents } from "../live-events";

const itemStatus = z.enum(["pending", "in_progress", "completed", "blocked"]);
const sessionStatus = z.enum(["active", "paused", "completed", "archived"]);
const progressKind = z.enum([
  "progress",
  "accomplishment",
  "obstacle",
  "suggestion",
]);

const project = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
const subtask = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: itemStatus,
  notes: z.string().optional(),
});
const task = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: itemStatus,
  subtasks: z.array(subtask),
  notes: z.string().optional(),
});
const goal = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: itemStatus,
  tasks: z.array(task),
  notes: z.string().optional(),
});

const sessionCreate = z.object({
  project: project
    .omit({ id: true, createdAt: true, updatedAt: true })
    .extend({ id: z.string().min(1).optional() }),
  status: sessionStatus.default("active"),
  goals: z.array(goal).default([]),
  savedStateIds: z.array(z.string()).default([]),
});
const sessionUpdate = z.object({
  project: project.optional(),
  status: sessionStatus.optional(),
  goals: z.array(goal).optional(),
  savedStateIds: z.array(z.string()).optional(),
});
const captureCreate = z.object({
  imageData: z.string().min(1),
  source: z.string().optional(),
  capturedAt: z.string().datetime().optional(),
  annotations: z
    .array(
      z.object({
        id: z.string().min(1).optional(),
        text: z.string().min(1),
        type: z.string().optional(),
        region: z
          .object({
            id: z.string().min(1).optional(),
            label: z.string().optional(),
            x: z.number(),
            y: z.number(),
            width: z.number().nonnegative(),
            height: z.number().nonnegative(),
            confidence: z.number().min(0).max(1).optional(),
          })
          .optional(),
      }),
    )
    .default([]),
});
const instruction = z.object({
  text: z.string().min(1),
  priority: z.number().finite().optional(),
  completedAt: z.string().datetime().optional(),
});
const operationPack = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  operations: z.array(z.string().min(1)),
  enabled: z.boolean().default(true),
});
const progress = z.object({
  kind: progressKind,
  message: z.string().min(1),
  relatedGoalId: z.string().optional(),
});
const savedState = z.object({
  label: z.string().min(1),
  snapshot: z.record(z.unknown()),
});

const parseBody = <T extends z.ZodTypeAny>(
  schema: T,
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
): any => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: "Invalid request body",
      issues: result.error.issues,
    });
    return undefined;
  }
  return result.data;
};

const requireSession = (
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
) => {
  const session = assistantStateRepository.getSession(req.params.sessionId);
  if (!session) {
    res
      .status(404)
      .json({ success: false, error: "Assistant session not found" });
    return undefined;
  }
  return session;
};

const resourceRoutes = <
  K extends
    | "captures"
    | "instructions"
    | "operationPacks"
    | "progress"
    | "savedStates",
>(
  router: Router,
  path: string,
  kind: K,
  createSchema: z.AnyZodObject,
  responseKey = path.endsWith("s") ? path.slice(0, -1) : path,
) => {
  router.get(`/sessions/:sessionId/${path}`, (req, res) => {
    if (!requireSession(req, res)) return;
    res.json({
      success: true,
      [path]: assistantStateRepository.listResource(kind, req.params.sessionId),
    });
  });
  router.post(`/sessions/:sessionId/${path}`, (req, res) => {
    if (!requireSession(req, res)) return;
    const body = parseBody(createSchema, req, res);
    if (!body) return;
    const created = assistantStateRepository.createResource(
      kind,
      req.params.sessionId,
      body,
    );
    res.status(201).json({ success: true, [responseKey]: created });
  });
  router.get(`/sessions/:sessionId/${path}/:id`, (req, res) => {
    if (!requireSession(req, res)) return;
    const resource = assistantStateRepository.getResource(
      kind,
      req.params.id,
      req.params.sessionId,
    );
    if (!resource)
      return res
        .status(404)
        .json({ success: false, error: "Assistant resource not found" });
    res.json({ success: true, [responseKey]: resource });
  });
  router.put(`/sessions/:sessionId/${path}/:id`, (req, res) => {
    if (!requireSession(req, res)) return;
    const body = parseBody(createSchema.partial(), req, res);
    if (!body) return;
    const updated = assistantStateRepository.updateResource(
      kind,
      req.params.id,
      req.params.sessionId,
      body,
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, error: "Assistant resource not found" });
    res.json({ success: true, [responseKey]: updated });
  });
  router.delete(`/sessions/:sessionId/${path}/:id`, (req, res) => {
    if (!requireSession(req, res)) return;
    if (
      !assistantStateRepository.deleteResource(
        kind,
        req.params.id,
        req.params.sessionId,
      )
    ) {
      return res
        .status(404)
        .json({ success: false, error: "Assistant resource not found" });
    }
    res.status(204).send();
  });
};

export const assistantRouter = Router();

assistantRouter.get("/sessions", (_req, res) =>
  res.json({
    success: true,
    sessions: assistantStateRepository.listSessions(),
  }),
);
assistantRouter.post("/sessions", (req, res) => {
  const body = parseBody(sessionCreate, req, res);
  if (!body) return;
  const created = assistantStateRepository.createSession({
    ...body,
    project: {
      ...body.project,
      id: body.project.id ?? `project_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  res.status(201).json({ success: true, session: created });
});
assistantRouter.get("/sessions/:id", (req, res) => {
  const session = assistantStateRepository.getSession(req.params.id);
  if (!session)
    return res
      .status(404)
      .json({ success: false, error: "Assistant session not found" });
  res.json({ success: true, session });
});
assistantRouter.put("/sessions/:id", (req, res) => {
  const body = parseBody(sessionUpdate, req, res);
  if (!body) return;
  const updated = assistantStateRepository.updateSession(req.params.id, body);
  if (!updated)
    return res
      .status(404)
      .json({ success: false, error: "Assistant session not found" });
  liveEvents.publish(req.params.id, "goal.changed", {
    goals: updated.goals,
    updatedAt: updated.updatedAt,
  });
  res.json({ success: true, session: updated });
});
assistantRouter.delete("/sessions/:id", (req, res) => {
  if (!assistantStateRepository.deleteSession(req.params.id)) {
    return res
      .status(404)
      .json({ success: false, error: "Assistant session not found" });
  }
  res.status(204).send();
});

resourceRoutes(assistantRouter, "captures", "captures", captureCreate);
resourceRoutes(assistantRouter, "instructions", "instructions", instruction);
resourceRoutes(
  assistantRouter,
  "operation-packs",
  "operationPacks",
  operationPack,
  "operationPack",
);
resourceRoutes(assistantRouter, "progress", "progress", progress);
resourceRoutes(
  assistantRouter,
  "saved-states",
  "savedStates",
  savedState,
  "savedState",
);
