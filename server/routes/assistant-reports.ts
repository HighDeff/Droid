import { Router } from "express";
import { assistantStateRepository } from "../assistant-state";
import { executionStateRepository } from "../execution-state";

export const assistantReportsRouter = Router();

assistantReportsRouter.get("/:executionId", (req, res) => {
  const execution = executionStateRepository.get(req.params.executionId);
  if (!execution)
    return res
      .status(404)
      .json({ success: false, error: "Execution not found" });
  const passed = execution.evidence.filter(
    (item) => item.verification.status === "passed",
  ).length;
  const failed = execution.evidence.filter(
    (item) => item.verification.status === "failed",
  ).length;
  const report = {
    executionId: execution.id,
    generatedAt: new Date().toISOString(),
    status: execution.status,
    beforeAfterScreenshots: execution.evidence.map((item) => ({
      stepId: item.stepId,
      before: item.attempt === 0 ? item.capture : undefined,
      after: item.attempt > 0 ? item.capture : undefined,
    })),
    annotatedEvidence: execution.evidence,
    accomplishments: execution.timeline
      .filter((event) => event.status === "completed")
      .map((event) => event.message),
    remainingWork: execution.totalSteps - execution.currentStep,
    errorSummary: execution.timeline
      .filter((event) => event.status === "failed")
      .map((event) => event.message),
    verification: { passed, failed, total: execution.evidence.length },
  };
  const session = assistantStateRepository.getSession(execution.sessionId);
  res.json({ success: true, report, sessionStatus: session?.status });
});
