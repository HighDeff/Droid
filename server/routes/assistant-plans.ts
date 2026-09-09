import { Request, Response, Router } from "express";
import { z } from "zod";
import type {
  AllowlistedAction,
  AssistantPlan,
  InstructionClarification,
  PlanPrerequisite,
  PlanRisk,
  PlannedStep,
  TimingHint,
  WaitCondition,
} from "@shared/assistant";
import { assistantStateRepository } from "../assistant-state";
import {
  adaptiveExecutionPolicySchema,
  allowlistedActionSchema,
} from "./assistant-execution";
import { conditionSchema } from "./assistant-conditions";

const timingHint = z.enum(["now", "soon", "scheduled", "when_ready"]);
const planStep = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["proposed", "edited", "approved"]),
  timing: timingHint,
  confidence: z.number().min(0).max(1),
  prerequisites: z.array(z.string()),
  risks: z.array(z.string()),
  action: allowlistedActionSchema.optional(),
  adaptive: adaptiveExecutionPolicySchema.optional(),
  waitConditions: z.array(conditionSchema).max(20).optional(),
});

const createPlanBody = z.object({
  sessionId: z.string().min(1),
  instructionText: z.string().trim().min(1).max(4000),
  captureIds: z.array(z.string().min(1)).max(20).default([]),
  noteIds: z.array(z.string().min(1)).max(20).default([]),
  notes: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
  timing: timingHint.default("when_ready"),
});

const editPlanBody = z.object({
  steps: z.array(planStep).min(1).max(50),
  timing: timingHint.optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

function makePlan(
  sessionId: string,
  instructionText: string,
  captureIds: string[],
  noteIds: string[],
  notes: string[],
  timing: TimingHint,
): Omit<AssistantPlan, "id" | "sessionId" | "createdAt" | "updatedAt"> {
  const normalized = instructionText.replace(/\s+/g, " ").trim();
  const sourceContext = notes.length
    ? ` Review the ${notes.length} supplied note${notes.length === 1 ? "" : "s"} before deciding.`
    : "";
  const clarification: InstructionClarification = {
    id: createId("clarification"),
    question: "What result should confirm that this instruction is complete?",
    reason: "A success signal was not explicit in the request.",
    required: false,
  };
  const prerequisite: PlanPrerequisite = {
    id: createId("prerequisite"),
    description: "Review the proposed steps and confirm the intended scope.",
    satisfied: false,
    source: "approval gate",
  };
  const risk: PlanRisk = {
    id: createId("risk"),
    description:
      "The request may need more context before any external action is considered.",
    level: "medium",
    mitigation:
      "Use the editable plan to clarify scope; no actions run before approval.",
  };
  const steps: PlannedStep[] = [
    {
      id: createId("step"),
      order: 1,
      title: "Review the instruction and available context",
      description: `Interpret “${normalized}” using the selected captures and notes.${sourceContext}`,
      status: "proposed",
      timing,
      confidence: captureIds.length || noteIds.length ? 0.78 : 0.62,
      prerequisites: [prerequisite.id],
      risks: [risk.id],
    },
    {
      id: createId("step"),
      order: 2,
      title: "Prepare a verification-ready next step",
      description:
        "Describe the next safe, observable step without sending input, changing files, or executing device actions.",
      status: "proposed",
      timing,
      confidence: 0.72,
      prerequisites: [prerequisite.id],
      risks: [risk.id],
    },
  ];

  return {
    instruction: {
      id: createId("instruction"),
      sessionId,
      text: normalized,
      createdAt: new Date().toISOString(),
    },
    sourceCaptureIds: captureIds,
    sourceNoteIds: noteIds,
    clarifications: [clarification],
    steps,
    prerequisites: [prerequisite],
    risks: [risk],
    timing,
    confidence: Math.min(...steps.map((step) => step.confidence)),
    approvalState: "proposed",
  };
}

const requireSession = (sessionId: string, res: Response) => {
  const session = assistantStateRepository.getSession(sessionId);
  if (!session) {
    res
      .status(404)
      .json({ success: false, error: "Assistant session not found" });
    return false;
  }
  return true;
};

export const assistantPlansRouter = Router();

assistantPlansRouter.get("/", (req, res) => {
  const sessionId = String(req.query.sessionId ?? "");
  if (!sessionId || !requireSession(sessionId, res)) return;
  res.json({
    success: true,
    plans: assistantStateRepository.listPlans(sessionId),
  });
});

assistantPlansRouter.post("/", (req, res) => {
  const parsed = createPlanBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid plan request",
      issues: parsed.error.issues,
    });
  }
  const body = parsed.data;
  if (!requireSession(body.sessionId, res)) return;
  const plan = assistantStateRepository.createPlan(
    body.sessionId,
    makePlan(
      body.sessionId,
      body.instructionText,
      body.captureIds,
      body.noteIds,
      body.notes,
      body.timing,
    ),
  );
  res.status(201).json({ success: true, plan });
});

assistantPlansRouter.get("/:planId", (req, res) => {
  const sessionId = String(req.query.sessionId ?? "");
  if (!sessionId || !requireSession(sessionId, res)) return;
  const plan = assistantStateRepository.getPlan(req.params.planId, sessionId);
  if (!plan)
    return res
      .status(404)
      .json({ success: false, error: "Assistant plan not found" });
  res.json({ success: true, plan });
});

assistantPlansRouter.put("/:planId", (req, res) => {
  const sessionId = String(req.query.sessionId ?? req.body?.sessionId ?? "");
  if (!sessionId || !requireSession(sessionId, res)) return;
  const parsed = editPlanBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid plan edit",
      issues: parsed.error.issues,
    });
  }
  const plan = assistantStateRepository.getPlan(req.params.planId, sessionId);
  if (!plan)
    return res
      .status(404)
      .json({ success: false, error: "Assistant plan not found" });
  const steps: PlannedStep[] = parsed.data.steps.map((step) => ({
    id: step.id ?? createId("step"),
    order: step.order ?? 1,
    title: step.title ?? "Untitled step",
    description: step.description ?? "Review this proposed step.",
    status: step.status ?? "edited",
    timing: step.timing ?? "when_ready",
    confidence: step.confidence ?? 0,
    prerequisites: step.prerequisites ?? [],
    risks: step.risks ?? [],
    action: step.action
      ? (allowlistedActionSchema.parse(step.action) as AllowlistedAction)
      : undefined,
    adaptive: step.adaptive
      ? (adaptiveExecutionPolicySchema.parse(
          step.adaptive,
        ) as PlannedStep["adaptive"])
      : undefined,
    waitConditions: step.waitConditions as WaitCondition[] | undefined,
  }));
  const updated = assistantStateRepository.updatePlan(
    req.params.planId,
    sessionId,
    {
      steps,
      ...(parsed.data.timing ? { timing: parsed.data.timing } : {}),
      ...(parsed.data.confidence !== undefined
        ? { confidence: parsed.data.confidence }
        : {}),
      approvalState: "proposed",
    },
  );
  res.json({ success: true, plan: updated });
});

function updateApproval(
  req: Request,
  res: Response,
  state: "approved" | "rejected",
) {
  const sessionId = String(req.query.sessionId ?? req.body?.sessionId ?? "");
  if (!sessionId || !requireSession(sessionId, res)) return;
  const plan = assistantStateRepository.getPlan(req.params.planId, sessionId);
  if (!plan)
    return res
      .status(404)
      .json({ success: false, error: "Assistant plan not found" });
  if (state === "approved") {
    const conditions = plan.steps.flatMap((step) => step.waitConditions ?? []);
    const unapproved = conditions.find((condition) => !condition.approved);
    const lowConfidenceControl = conditions.find(
      (condition) =>
        (condition.type === "close_control" ||
          condition.type === "next_control") &&
        condition.confidenceThreshold < 0.8,
    );
    if (unapproved || lowConfidenceControl) {
      return res.status(409).json({
        success: false,
        error: unapproved
          ? "Every wait condition must be explicitly approved"
          : "Close/next controls require at least 80% confidence",
        suggestion:
          "Review the condition in the plan editor; no detected UI is clicked automatically.",
      });
    }
  }
  const timestamp = new Date().toISOString();
  const updated = assistantStateRepository.updatePlan(
    req.params.planId,
    sessionId,
    {
      approvalState: state,
      ...(state === "approved"
        ? { approvedAt: timestamp, rejectedAt: undefined }
        : { rejectedAt: timestamp, approvedAt: undefined }),
    },
  );
  res.json({ success: true, plan: updated, executed: false });
}

assistantPlansRouter.post("/:planId/approve", (req, res) =>
  updateApproval(req, res, "approved"),
);
assistantPlansRouter.post("/:planId/reject", (req, res) =>
  updateApproval(req, res, "rejected"),
);
