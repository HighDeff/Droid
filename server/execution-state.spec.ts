import { describe, expect, it, vi } from "vitest";
import type { AssistantPlan } from "@shared/assistant";
import { ExecutionStateRepository } from "./execution-state";
import { allowlistedActionSchema } from "./routes/assistant-execution";

const plan = (
  action?: AssistantPlan["steps"][number]["action"],
  adaptive?: AssistantPlan["steps"][number]["adaptive"],
): AssistantPlan =>
  ({
    id: "plan-1",
    sessionId: "session-1",
    instruction: {} as AssistantPlan["instruction"],
    sourceCaptureIds: [],
    sourceNoteIds: [],
    clarifications: [],
    steps: [
      {
        id: "step-1",
        order: 1,
        title: "Safe step",
        description: "A test step",
        status: "approved",
        timing: "now",
        confidence: 1,
        prerequisites: [],
        risks: [],
        action,
        adaptive,
      },
    ],
    prerequisites: [],
    risks: [],
    timing: "now",
    confidence: 1,
    approvalState: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }) as AssistantPlan;

describe("allowlisted execution", () => {
  it("rejects unknown action shapes and accepts bounded actions", () => {
    expect(
      allowlistedActionSchema.safeParse({ type: "shell", command: "dir" })
        .success,
    ).toBe(false);
    expect(
      allowlistedActionSchema.safeParse({ type: "click", x: 10, y: 20 })
        .success,
    ).toBe(true);
    expect(
      allowlistedActionSchema.safeParse({ type: "wait", durationMs: 5001 })
        .success,
    ).toBe(false);
  });

  it("tracks completion and supports cancellation without shell execution", async () => {
    const execute = vi.fn(async (action) => ({
      actionType: action.type,
      success: true,
      message: "safe",
    }));
    const repository = new ExecutionStateRepository(execute, {
      mode: "memory",
    });
    const execution = repository.create(plan({ type: "screenshot" }));
    await repository.start(execution, plan({ type: "screenshot" }));
    expect(execution.status).toBe("completed");
    expect(execute).toHaveBeenCalledTimes(1);
    expect(
      execution.timeline.some(
        (event) => event.message === "Execution completed",
      ),
    ).toBe(true);

    const cancelled = repository.create(
      plan({ type: "wait", durationMs: 100 }),
    );
    repository.cancel(cancelled.id);
    await repository.start(cancelled, plan({ type: "wait", durationMs: 100 }));
    expect(cancelled.status).toBe("cancelled");
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("retries failed verification and records fresh evidence", async () => {
    const execute = vi.fn(async (action) => ({
      actionType: action.type,
      success: true,
      message: "safe",
    }));
    let observations = 0;
    const repository = new ExecutionStateRepository(execute, async () => {
      observations += 1;
      return {
        analysis: {
          id: `analysis-${observations}`,
          status: "completed",
          provider: "local-ocr",
          confidence: 0.9,
          ocrText:
            observations > 1
              ? [{ id: "text", text: "Done", confidence: 0.9 }]
              : [],
          detectedElements: [],
          regionsOfInterest: [],
          notes: [],
          analyzedAt: new Date().toISOString(),
        },
      };
    });
    const execution = repository.create(
      plan(
        { type: "click", x: 10, y: 20 },
        {
          verification: { kind: "text-present", text: "Done" },
          retry: { maxAttempts: 2 },
        },
      ),
    );
    await repository.start(
      execution,
      plan(
        { type: "click", x: 10, y: 20 },
        {
          verification: { kind: "text-present", text: "Done" },
          retry: { maxAttempts: 2 },
        },
      ),
    );
    expect(execution.status).toBe("completed");
    expect(execution.evidence).toHaveLength(2);
    expect(execution.timeline.some((event) => event.status === "retry")).toBe(
      true,
    );
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("pauses when analysis is uncertain instead of inventing success", async () => {
    const repository = new ExecutionStateRepository(
      async (action) => ({
        actionType: action.type,
        success: true,
        message: "safe",
      }),
      async () => ({}),
    );
    const execution = repository.create(
      plan(
        { type: "click", x: 10, y: 20 },
        { verification: { kind: "confidence-threshold", minConfidence: 0.8 } },
      ),
    );
    await repository.start(
      execution,
      plan(
        { type: "click", x: 10, y: 20 },
        { verification: { kind: "confidence-threshold", minConfidence: 0.8 } },
      ),
    );
    expect(execution.status).toBe("awaiting_approval");
    expect(execution.pendingApproval?.reason).toContain("unavailable");
  });
});
