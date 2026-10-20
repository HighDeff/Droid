import { assistantStateRepository } from "./assistant-state";
import { executionStateRepository } from "./execution-state";
import { liveEvents } from "./live-events";
import { schedulingWorker } from "./scheduling-worker";
import { methodLearningSystem, type LearningContext } from "./method-learning";
import {
  createDeviceExecutorHandle,
  type DeviceExecutorOpts,
} from "./device-action-executor";
import type { AssistantPlan, AssistantExecution } from "@shared/assistant";

type RuntimeState = {
  iteration: number;
  running: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  stoppedReason?: string;
  executionId?: string;
  successCount: number;
  failureCount: number;
  bestMethod?: {
    successRate: number;
    adaptationNotes: string;
    lastSuccessfulAt: string;
  };
};

const runtime = new Map<string, RuntimeState>();
const MAX_ITERATIONS = 10000; // Support "run 500 times" scenarios
const intervalMs = 5_000;

const stateFor = (workflowId: string) => {
  const current = runtime.get(workflowId) ?? { 
    iteration: 0, 
    running: false, 
    successCount: 0, 
    failureCount: 0 
  };
  runtime.set(workflowId, current);
  return current;
};

const adaptiveDelay = (iteration: number, baseDelay: number = 1000) => {
  // Add adaptive delays to avoid detection and handle varying load times
  const variance = Math.random() * 0.5 + 0.75; // 0.75x to 1.25x
  const iterationFactor = Math.min(1 + (iteration * 0.01), 2); // Gradually increase
  return Math.floor(baseDelay * variance * iterationFactor);
};

const runWorkflow = async (
  workflowId: string,
  sessionId: string,
  deviceOpts?: DeviceExecutorOpts,
  manual = false,
  isRetry = false,
) => {
  const workflow = assistantStateRepository.getWorkflow(workflowId, sessionId);
  // Manual "Run now" bypasses the schedule gate; the timer-driven path still
  // requires an enabled schedule.
  if (!workflow || workflow.status !== "active" || (!manual && !workflow.schedule.enabled))
    return;
  
  const state = stateFor(workflowId);
  const limit = Math.min(workflow.repeatCount || 1, MAX_ITERATIONS);

  // A manual "Run now" is a fresh single attempt, not a continuation of the
  // schedule counter — otherwise one completed run would permanently block
  // every later manual run with "repeat limit reached". Retries keep their
  // counters.
  if (manual && !isRetry) {
    state.iteration = 0;
    state.successCount = 0;
    state.failureCount = 0;
    state.stoppedReason = undefined;
  }

  if (state.running || state.iteration >= limit) {
    if (state.iteration >= limit) {
      state.stoppedReason = "repeat limit reached";
      liveEvents.publish(sessionId, "workflow.stopped", {
        workflowId,
        reason: state.stoppedReason,
        totalIterations: state.iteration,
        successRate: state.successCount / state.iteration,
      });
    }
    return;
  }
  
  state.running = true;
  state.iteration += 1;
  state.lastRunAt = new Date().toISOString();
  
  liveEvents.publish(sessionId, "workflow.iteration.started", {
    workflowId,
    iteration: state.iteration,
    limit,
    estimatedDuration: adaptiveDelay(state.iteration),
  });

  try {
    // Get the workflow's own execution plan (exact association); fall back to
    // the session's primary plan only for workflows created before planId.
    const plan = workflow.planId
      ? assistantStateRepository.getPlan(workflow.planId, sessionId)
      : assistantStateRepository.listPlans(sessionId)[0];
    if (!plan) {
      throw new Error("No execution plan found for workflow");
    }

    // Create and execute the plan
    const execution = executionStateRepository.create(plan);
    state.executionId = execution.id;

    // Install the REAL device executor for this execution only when device
    // routing was provided; otherwise the safe no-op executor stays in place
    // and the run is a dry-run (reported honestly in the published events).
    // The executor is scoped to this execution — it is never installed
    // globally, so it cannot leak into later dry-runs or concurrent runs.
    const live = !!deviceOpts;
    const deviceHandle = live
      ? createDeviceExecutorHandle(deviceOpts!)
      : undefined;
    if (deviceHandle) {
      // STOP cancels the execution, which fires this hook and SIGTERMs/
      // SIGKILLs any Python action process still in flight.
      executionStateRepository.addCancelHook(execution.id, deviceHandle.abort);
    }
    liveEvents.publish(sessionId, "workflow.iteration.executor", {
      workflowId,
      iteration: state.iteration,
      mode: live ? "REAL" : "DRY_RUN",
      targetDevice: deviceOpts?.targetDevice ?? "none",
    });

    // Adaptive execution with automatic retries and method learning
    const result = await executionStateRepository.start(
      execution,
      plan,
      deviceHandle?.executor,
    );
    
    if (result.status === "completed") {
      state.successCount++;
      
      // Update best method if this iteration was successful. "Completed"
      // means every step's device call returned success (dispatch-level);
      // visual outcome verification only applies when steps carry adaptive
      // verification config, so the note says so explicitly.
      const successRate = state.successCount / state.iteration;
      if (!state.bestMethod || successRate > state.bestMethod.successRate) {
        state.bestMethod = {
          successRate,
          adaptationNotes: `Iteration ${state.iteration}: all device calls returned success (dispatch-level; visual verification only where adaptive verification is configured)`,
          lastSuccessfulAt: new Date().toISOString(),
        };
        
        // Save learned method for future use
        assistantStateRepository.updatePlan(plan.id, sessionId, {
          metadata: {
            learnedMethod: state.bestMethod,
            totalSuccessfulRuns: state.successCount,
          },
        });
      }
      
      liveEvents.publish(sessionId, "workflow.iteration.completed", {
        workflowId,
        iteration: state.iteration,
        success: true,
        executionId: execution.id,
        evidenceCount: execution.evidence.length,
        adaptationApplied: state.bestMethod?.adaptationNotes,
      });
    } else {
      state.failureCount++;
      
      // Auto-adapt based on failure
      liveEvents.publish(sessionId, "workflow.iteration.failed", {
        workflowId,
        iteration: state.iteration,
        error: result.error || "Unknown error",
        executionId: execution.id,
        autoAdapt: true,
      });
      
      // Implement automatic retry with adaptation. The running flag must be
      // cleared first — otherwise the recursive call sees running=true and
      // exits immediately, silently dropping the retry. Never retry after a
      // manual stop: the user asked the device to halt.
      if (state.failureCount < 3 && !state.stoppedReason) { // Auto-retry up to 3 times
        state.running = false;
        await new Promise(resolve => setTimeout(resolve, adaptiveDelay(state.iteration, 2000)));
        return runWorkflow(workflowId, sessionId, deviceOpts, manual, true); // Retry same iteration
      }
    }
  } catch (error) {
    state.failureCount++;
    state.stoppedReason = error instanceof Error ? error.message : "Unknown error";
    
    liveEvents.publish(sessionId, "workflow.error", {
      workflowId,
      iteration: state.iteration,
      error: state.stoppedReason,
      autoRecoveryAttempted: true,
    });
  } finally {
    state.running = false;
    state.executionId = undefined;
    
    // Calculate next run time based on schedule or adaptive timing
    if (workflow.schedule.enabled && state.iteration < limit) {
      const nextDelay = adaptiveDelay(state.iteration);
      state.nextRunAt = new Date(Date.now() + nextDelay).toISOString();
      
      // Update workflow schedule
      assistantStateRepository.updateWorkflow(workflowId, sessionId, {
        schedule: {
          ...workflow.schedule,
          nextRunAt: state.nextRunAt,
        },
        goals: workflow.goals.map(goal => ({
          ...goal,
          completed: goal.completed + (state.successCount > 0 ? 1 : 0),
          total: goal.total + 1,
        })),
      });
    }
  }
};

export const workflowRuntime = {
  start() {
    const timer = setInterval(() => {
      for (const session of assistantStateRepository.listSessions()) {
        for (const workflow of assistantStateRepository.listWorkflows(session.id)) {
          if (workflow.schedule.enabled && workflow.schedule.nextRunAt) {
            if (Date.parse(workflow.schedule.nextRunAt) <= Date.now()) {
              runWorkflow(workflow.id, session.id);
            }
          }
        }
      }
    }, intervalMs);
    timer.unref?.();
    return timer;
  },
  status(workflowId: string) {
    return stateFor(workflowId);
  },
  runNow(
    workflowId: string,
    sessionId: string,
    deviceOpts?: DeviceExecutorOpts,
  ) {
    runWorkflow(workflowId, sessionId, deviceOpts, true);
    return stateFor(workflowId);
  },
  stop(workflowId: string) {
    const state = stateFor(workflowId);
    state.running = false;
    state.stoppedReason = "Manually stopped";
    // Cancel the in-flight execution: the loop checks the cancelled flag
    // between steps, and the cancel hooks SIGTERM/SIGKILL any running
    // Python device process. This is a real physical stop, not a label.
    if (state.executionId) {
      executionStateRepository.cancel(state.executionId);
      state.executionId = undefined;
    }
    runtime.set(workflowId, state);
    return state;
  },
  getBestMethod(workflowId: string) {
    return stateFor(workflowId).bestMethod;
  },
  setRepeatCount(workflowId: string, count: number) {
    const state = stateFor(workflowId);
    state.iteration = 0; // Reset iteration when changing repeat count
    state.successCount = 0;
    state.failureCount = 0;
    runtime.set(workflowId, state);
    return state;
  },
};
