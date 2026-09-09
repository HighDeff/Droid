import type {
  AllowlistedAction,
  AssistantExecution,
  AssistantPlan,
  ActionExecutionResult,
  ExecutionTimelineEvent,
} from "@shared/assistant";
import { DurableStore, type StorageOptions } from "./durable-store";

const now = () => new Date().toISOString();
const id = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const ACTION_TIMEOUT_MS = 5_000;
export const EXECUTION_TIMEOUT_MS = 30_000;

export type SafeActionExecutor = (
  action: AllowlistedAction,
) => Promise<ActionExecutionResult>;

const defaultExecutor: SafeActionExecutor = async (action) => {
  // This adapter deliberately performs no shell, code, or process execution.
  // Integrations can replace it with a narrowly scoped device helper.
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
    options: StorageOptions = {},
  ) {
    this.store = new DurableStore(options);
    this.load();
  }

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
    if (storedExecution) execution = storedExecution;
    if (execution.status !== "pending" && execution.status !== "paused")
      return execution;
    const control = this.controls.get(execution.id);
    if (!control) throw new Error("Execution control state not found");
    control.paused = false;
    execution.status = "running";
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
      if (Date.now() > deadline) {
        return this.fail(execution, "Execution timed out");
      }
      const action = plan.steps[index].action;
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
        const result = await Promise.race([
          this.executeAction(action),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Action timed out")),
              ACTION_TIMEOUT_MS,
            ),
          ),
        ]);
        execution.results.push(result);
        this.persist();
        if (!result.success) return this.fail(execution, result.message);
        this.addEvent(
          execution,
          "completed",
          result.message,
          plan.steps[index].id,
          result,
        );
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
  ) {
    execution.timeline.push({
      id: id("event"),
      timestamp: now(),
      status,
      message,
      stepId,
      result,
    });
  }
}

export const executionStateRepository = new ExecutionStateRepository();
