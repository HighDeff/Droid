import { assistantStateRepository } from "./assistant-state";
import { liveEvents } from "./live-events";

type RuntimeState = {
  iteration: number;
  running: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  stoppedReason?: string;
};

const runtime = new Map<string, RuntimeState>();
const MAX_ITERATIONS = 1000;
const intervalMs = 5_000;

const stateFor = (workflowId: string) => {
  const current = runtime.get(workflowId) ?? { iteration: 0, running: false };
  runtime.set(workflowId, current);
  return current;
};

const runWorkflow = (workflowId: string, sessionId: string) => {
  const workflow = assistantStateRepository.getWorkflow(workflowId, sessionId);
  if (!workflow || workflow.status !== "active" || !workflow.schedule.enabled)
    return;
  const state = stateFor(workflowId);
  const limit = Math.min(workflow.repeatCount || 1, MAX_ITERATIONS);
  if (state.running || state.iteration >= limit) {
    if (state.iteration >= limit) {
      state.stoppedReason = "repeat limit reached";
      liveEvents.publish(sessionId, "workflow.stopped", {
        workflowId,
        reason: state.stoppedReason,
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
  });
  // Operation packs are declarative; execution plans remain the safety boundary.
  state.running = false;
  state.nextRunAt = new Date(Date.now() + intervalMs).toISOString();
  liveEvents.publish(sessionId, "workflow.iteration.completed", {
    workflowId,
    iteration: state.iteration,
  });
};

export const workflowRuntime = {
  start() {
    const timer = setInterval(() => {
      for (const session of assistantStateRepository.listSessions()) {
        for (const workflow of assistantStateRepository.listWorkflows(
          session.id,
        )) {
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
  runNow(workflowId: string, sessionId: string) {
    runWorkflow(workflowId, sessionId);
    return stateFor(workflowId);
  },
};
