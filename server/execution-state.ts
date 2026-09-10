import type {
  AllowlistedAction,
  AssistantExecution,
  AssistantPlan,
  ActionExecutionResult,
  ExecutionEvidence,
  ExecutionTimelineEvent,
  PlannedStep,
} from "@shared/assistant";
import { DurableStore, type StorageOptions } from "./durable-store";
import { verifyObservation, type Observation } from "./visual-verification";

const now = () => new Date().toISOString();
const id = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const ACTION_TIMEOUT_MS = 5_000;
export const EXECUTION_TIMEOUT_MS = 30_000;

export type SafeActionExecutor = (
  action: AllowlistedAction,
) => Promise<ActionExecutionResult>;
export type ObservationProvider = (
  step: PlannedStep,
  attempt: number,
) => Promise<Observation>;

const defaultExecutor: SafeActionExecutor = async (action) => {
  if (action.type === "wait") {
    await new Promise((resolve) => setTimeout(resolve, action.durationMs));
  }
  return {
    actionType: action.type,
    success: true,
    message: `${action.type} accepted by the safe execution adapter`,
    data: action.type === "screenshot" ? { captured: false } : undefined,
  };
};

export class ExecutionStateRepository {
  private readonly store: DurableStore;
  private executions = new Map<string, AssistantExecution>();
  private readonly controls = new Map<
    string,
    { paused: boolean; cancelled: boolean }
  >();

  constructor(
    private readonly executeAction: SafeActionExecutor = defaultExecutor,
    optionsOrObserve: StorageOptions | ObservationProvider = {},
    observe: ObservationProvider = async () => ({}),
  ) {
    const options =
      typeof optionsOrObserve === "function" ? {} : optionsOrObserve;
    this.observe =
      typeof optionsOrObserve === "function" ? optionsOrObserve : observe;
    this.store = new DurableStore(options);
    this.load();
  }

  private readonly observe: ObservationProvider;

  private load() {
    this.executions = new Map(
      this.store
        .readCollection<AssistantExecution>("executions")
        .map((execution) => [execution.id, execution]),
    );
  }

  private persist() {
    this.store.writeCollection("executions", [...this.executions.values()]);
  }

  get(id: string): AssistantExecution | undefined {
    this.load();
    return this.executions.get(id);
  }

  create(plan: AssistantPlan): AssistantExecution {
    const execution: AssistantExecution = {
      id: id("execution"),
      planId: plan.id,
      sessionId: plan.sessionId,
      status: "pending",
      currentStep: 0,
      totalSteps: plan.steps.length,
      timeline: [],
      results: [],
      evidence: [],
    };
    this.executions.set(execution.id, execution);
    this.persist();
    this.controls.set(execution.id, { paused: false, cancelled: false });
    return execution;
  }

  pause(executionId: string): AssistantExecution | undefined {
    this.load();
    const execution = this.executions.get(executionId);
    const control = this.controls.get(executionId);
    if (
      !execution ||
      !control ||
      !["running", "pending"].includes(execution.status)
    )
      return execution;
    control.paused = true;
    execution.status = "paused";
    this.addEvent(execution, "info", "Execution paused");
    this.persist();
    return execution;
  }

  cancel(executionId: string): AssistantExecution | undefined {
    this.load();
    const execution = this.executions.get(executionId);
    const control = this.controls.get(executionId);
    if (
      !execution ||
      !control ||
      ["completed", "cancelled", "failed"].includes(execution.status)
    )
      return execution;
    control.cancelled = true;
    control.paused = false;
    execution.status = "cancelled";
    execution.completedAt = now();
    this.addEvent(execution, "info", "Execution cancelled");
    this.persist();
    return execution;
  }

  async start(execution: AssistantExecution, plan: AssistantPlan) {
    this.load();
    const storedExecution = this.executions.get(execution.id);
    if (storedExecution && storedExecution !== execution) {
      Object.assign(execution, storedExecution);
      this.executions.set(execution.id, execution);
    }
    if (execution.status !== "pending" && execution.status !== "paused")
      return execution;
    const control = this.controls.get(execution.id);
    if (!control) throw new Error("Execution control state not found");
    control.paused = false;
    execution.status = "running";
    execution.pendingApproval = undefined;
    execution.startedAt ??= now();
    this.addEvent(execution, "started", "Execution started");
    this.persist();

    const deadline = Date.now() + EXECUTION_TIMEOUT_MS;
    for (
      let index = execution.currentStep;
      index < plan.steps.length;
      index += 1
    ) {
      while (control.paused && !control.cancelled) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (control.cancelled) return execution;
      if (Date.now() > deadline)
        return this.fail(execution, "Execution timed out");

      const step = plan.steps[index];
      const action = step.action;
      if (!action)
        return this.fail(execution, `Step ${index + 1} has no approved action`);
      execution.currentStep = index + 1;
      this.addEvent(
        execution,
        "started",
        `Running step ${index + 1}`,
        plan.steps[index].id,
      );
      this.persist();
      try {
        if (step.adaptive?.captureBefore) {
          const evidence = await this.captureAndVerify(execution, step, 0);
          if (evidence.verification.status === "uncertain") {
            return this.awaitApproval(execution, step, evidence, true);
          }
        }

        let result = await this.runAction(action);
        execution.results.push(result);
        this.persist();
        if (!result.success) return this.fail(execution, result.message);
        this.addEvent(execution, "completed", result.message, step.id, result);

        const verification = step.adaptive?.verification;
        if (verification) {
          const maxAttempts = step.adaptive.retry?.maxAttempts ?? 1;
          let attempt = 1;
          while (true) {
            const evidence = await this.captureAndVerify(
              execution,
              step,
              attempt,
            );
            if (evidence.verification.status === "passed") break;
            if (evidence.verification.status === "uncertain") {
              return this.awaitApproval(execution, step, evidence, false);
            }
            if (attempt >= maxAttempts) {
              const alternateId = step.adaptive.retry?.alternateStepId;
              return alternateId
                ? this.selectAlternate(execution, step, alternateId)
                : this.fail(execution, evidence.verification.reason);
            }
            attempt += 1;
            this.addEvent(
              execution,
              "retry",
              `Verification failed; retrying step ${index + 1} (attempt ${attempt}/${maxAttempts}).`,
              step.id,
              undefined,
              execution.evidence[execution.evidence.length - 1]?.id,
            );
            const delay = Math.min(step.adaptive.retry?.backoffMs ?? 0, 5_000);
            if (delay > 0)
              await new Promise((resolve) => setTimeout(resolve, delay));
            result = await this.runAction(action);
            execution.results.push(result);
            if (!result.success) return this.fail(execution, result.message);
          }
        }
      } catch (error) {
        return this.fail(
          execution,
          error instanceof Error ? error.message : "Action failed",
        );
      }
    }

    execution.status = "completed";
    execution.completedAt = now();
    this.addEvent(execution, "completed", "Execution completed");
    this.persist();
    return execution;
  }

  async approveAlternate(executionId: string, plan: AssistantPlan) {
    const execution = this.executions.get(executionId);
    const pending = execution?.pendingApproval;
    if (!execution || !pending?.alternateStepId) return undefined;
    const currentIndex = plan.steps.findIndex(
      (step) => step.id === pending.stepId,
    );
    const alternate = plan.steps.find(
      (step) => step.id === pending.alternateStepId,
    );
    if (currentIndex < 0 || !alternate) return undefined;
    const alternatePlan = {
      ...plan,
      steps: plan.steps.map((step, index) =>
        index === currentIndex ? { ...alternate, order: step.order } : step,
      ),
    };
    execution.currentStep = currentIndex;
    execution.status = "paused";
    return this.start(execution, alternatePlan);
  }

  async approvePending(executionId: string, plan: AssistantPlan) {
    const execution = this.executions.get(executionId);
    const pending = execution?.pendingApproval;
    if (!execution || !pending) return undefined;
    const stepIndex = plan.steps.findIndex(
      (step) => step.id === pending.stepId,
    );
    if (stepIndex < 0) return undefined;
    execution.currentStep = pending.retryStep ? stepIndex : stepIndex + 1;
    execution.status = "paused";
    return this.start(execution, plan);
  }

  private runAction(action: AllowlistedAction) {
    return Promise.race([
      this.executeAction(action),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Action timed out")),
          ACTION_TIMEOUT_MS,
        ),
      ),
    ]);
  }

  private async captureAndVerify(
    execution: AssistantExecution,
    step: PlannedStep,
    attempt: number,
  ): Promise<ExecutionEvidence> {
    this.addEvent(
      execution,
      "capture",
      `Requesting fresh capture for attempt ${attempt}.`,
      step.id,
    );
    const observation = await this.observe(step, attempt);
    this.addEvent(
      execution,
      "analysis",
      "Fresh capture analysis received.",
      step.id,
    );
    const verification = step.adaptive?.verification
      ? verifyObservation(step.adaptive.verification, observation)
      : observation.analysis
        ? { status: "passed" as const, reason: "Fresh analysis recorded." }
        : {
            status: "uncertain" as const,
            reason:
              "Fresh capture was requested but no analysis was provided; approval is required.",
          };
    const evidence: ExecutionEvidence = {
      id: id("evidence"),
      stepId: step.id,
      attempt,
      capturedAt: now(),
      capture: observation.capture,
      analysis: observation.analysis,
      verification,
    };
    execution.evidence.push(evidence);
    this.addEvent(
      execution,
      "verification",
      verification.reason,
      step.id,
      verification,
      evidence.id,
    );
    return evidence;
  }

  private awaitApproval(
    execution: AssistantExecution,
    step: PlannedStep,
    evidence: ExecutionEvidence,
    retryStep: boolean,
  ) {
    execution.status = "awaiting_approval";
    execution.pendingApproval = {
      stepId: step.id,
      reason: evidence.verification.reason,
      alternateStepId: step.adaptive?.retry?.alternateStepId,
      retryStep,
    };
    this.addEvent(
      execution,
      "approval",
      `Paused for approval: ${evidence.verification.reason}`,
      step.id,
      undefined,
      evidence.id,
    );
    return execution;
  }

  private selectAlternate(
    execution: AssistantExecution,
    step: PlannedStep,
    alternateStepId: string,
  ) {
    execution.status = "awaiting_approval";
    execution.pendingApproval = {
      stepId: step.id,
      reason: "Verification remained false after the bounded retry limit.",
      alternateStepId,
    };
    this.addEvent(
      execution,
      "alternate",
      `Alternate step ${alternateStepId} is available for explicit approval.`,
      step.id,
    );
    return execution;
  }

  async approveAlternate(executionId: string, plan: AssistantPlan) {
    const execution = this.executions.get(executionId);
    const pending = execution?.pendingApproval;
    if (!execution || !pending?.alternateStepId) return undefined;
    const currentIndex = plan.steps.findIndex(
      (step) => step.id === pending.stepId,
    );
    const alternate = plan.steps.find(
      (step) => step.id === pending.alternateStepId,
    );
    if (currentIndex < 0 || !alternate) return undefined;
    const alternatePlan = {
      ...plan,
      steps: plan.steps.map((step, index) =>
        index === currentIndex ? { ...alternate, order: step.order } : step,
      ),
    };
    execution.currentStep = currentIndex;
    execution.status = "paused";
    return this.start(execution, alternatePlan);
  }

  async approvePending(executionId: string, plan: AssistantPlan) {
    const execution = this.executions.get(executionId);
    const pending = execution?.pendingApproval;
    if (!execution || !pending) return undefined;
    const stepIndex = plan.steps.findIndex(
      (step) => step.id === pending.stepId,
    );
    if (stepIndex < 0) return undefined;
    execution.currentStep = pending.retryStep ? stepIndex : stepIndex + 1;
    execution.status = "paused";
    return this.start(execution, plan);
  }

  private runAction(action: AllowlistedAction) {
    return Promise.race([
      this.executeAction(action),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Action timed out")),
          ACTION_TIMEOUT_MS,
        ),
      ),
    ]);
  }

  private async captureAndVerify(
    execution: AssistantExecution,
    step: PlannedStep,
    attempt: number,
  ): Promise<ExecutionEvidence> {
    this.addEvent(
      execution,
      "capture",
      `Requesting fresh capture for attempt ${attempt}.`,
      step.id,
    );
    const observation = await this.observe(step, attempt);
    this.addEvent(
      execution,
      "analysis",
      "Fresh capture analysis received.",
      step.id,
    );
    const verification = step.adaptive?.verification
      ? verifyObservation(step.adaptive.verification, observation)
      : observation.analysis
        ? { status: "passed" as const, reason: "Fresh analysis recorded." }
        : {
            status: "uncertain" as const,
            reason:
              "Fresh capture was requested but no analysis was provided; approval is required.",
          };
    const evidence: ExecutionEvidence = {
      id: id("evidence"),
      stepId: step.id,
      attempt,
      capturedAt: now(),
      capture: observation.capture,
      analysis: observation.analysis,
      verification,
    };
    execution.evidence.push(evidence);
    this.addEvent(
      execution,
      "verification",
      verification.reason,
      step.id,
      verification,
      evidence.id,
    );
    return evidence;
  }

  private awaitApproval(
    execution: AssistantExecution,
    step: PlannedStep,
    evidence: ExecutionEvidence,
    retryStep: boolean,
  ) {
    execution.status = "awaiting_approval";
    execution.pendingApproval = {
      stepId: step.id,
      reason: evidence.verification.reason,
      alternateStepId: step.adaptive?.retry?.alternateStepId,
      retryStep,
    };
    this.addEvent(
      execution,
      "approval",
      `Paused for approval: ${evidence.verification.reason}`,
      step.id,
      undefined,
      evidence.id,
    );
    return execution;
  }

  private selectAlternate(
    execution: AssistantExecution,
    step: PlannedStep,
    alternateStepId: string,
  ) {
    execution.status = "awaiting_approval";
    execution.pendingApproval = {
      stepId: step.id,
      reason: "Verification remained false after the bounded retry limit.",
      alternateStepId,
    };
    this.addEvent(
      execution,
      "alternate",
      `Alternate step ${alternateStepId} is available for explicit approval.`,
      step.id,
    );
    return execution;
  }

  private fail(execution: AssistantExecution, error: string) {
    execution.status = "failed";
    execution.error = error;
    execution.completedAt = now();
    this.addEvent(execution, "failed", error);
    this.persist();
    return execution;
  }

  private addEvent(
    execution: AssistantExecution,
    status: ExecutionTimelineEvent["status"],
    message: string,
    stepId?: string,
    result?: unknown,
    evidenceId?: string,
  ) {
    execution.timeline.push({
      id: id("event"),
      timestamp: now(),
      status,
      message,
      stepId,
      result,
      evidenceId,
    });
  }
}

export const executionStateRepository = new ExecutionStateRepository();
