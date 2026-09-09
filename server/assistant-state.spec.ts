import { describe, expect, it } from "vitest";
import { AssistantStateRepository } from "./assistant-state";

describe("AssistantStateRepository", () => {
  it("creates sessions and isolates resources by session", () => {
    const repository = new AssistantStateRepository();
    const first = repository.createSession({
      project: {
        id: "project-one",
        name: "First project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: "active",
      goals: [],
      savedStateIds: [],
    });
    const second = repository.createSession({
      project: {
        id: "project-two",
        name: "Second project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: "active",
      goals: [],
      savedStateIds: [],
    });

    repository.createResource("progress", first.id, {
      kind: "accomplishment",
      message: "Created the first workflow",
    });

    expect(repository.listResource("progress", first.id)).toHaveLength(1);
    expect(repository.listResource("progress", second.id)).toHaveLength(0);
  });

  it("updates and deletes a resource only for its owning session", () => {
    const repository = new AssistantStateRepository();
    const session = repository.createSession({
      project: {
        id: "project",
        name: "Project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: "active",
      goals: [],
      savedStateIds: [],
    });
    const entry = repository.createResource("progress", session.id, {
      kind: "obstacle",
      message: "Initial obstacle",
    });

    expect(
      repository.updateResource("progress", entry.id, "other-session", {
        message: "Wrong owner",
      }),
    ).toBeUndefined();
    expect(
      repository.updateResource("progress", entry.id, session.id, {
        message: "Resolved obstacle",
      })?.message,
    ).toBe("Resolved obstacle");
    expect(
      repository.deleteResource("progress", entry.id, "other-session"),
    ).toBe(false);
    expect(repository.deleteResource("progress", entry.id, session.id)).toBe(
      true,
    );
  });

  it("cascades resource cleanup when a session is deleted", () => {
    const repository = new AssistantStateRepository();
    const session = repository.createSession({
      project: {
        id: "project",
        name: "Project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: "active",
      goals: [],
      savedStateIds: [],
    });
    repository.createResource("instructions", session.id, {
      text: "Keep this instruction",
    });

    expect(repository.deleteSession(session.id)).toBe(true);
    expect(repository.listResource("instructions", session.id)).toHaveLength(0);
    expect(repository.deleteSession(session.id)).toBe(false);
  });

  it("stores plans within their owning session and preserves approval state", () => {
    const repository = new AssistantStateRepository();
    const session = repository.createSession({
      project: {
        id: "project",
        name: "Project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: "active",
      goals: [],
      savedStateIds: [],
    });
    const plan = repository.createPlan(session.id, {
      instruction: {
        id: "instruction",
        sessionId: session.id,
        text: "Review the screen",
        createdAt: new Date().toISOString(),
      },
      sourceCaptureIds: [],
      sourceNoteIds: [],
      clarifications: [],
      steps: [],
      prerequisites: [],
      risks: [],
      timing: "when_ready",
      confidence: 0.7,
      approvalState: "proposed",
    });

    expect(repository.listPlans(session.id)).toHaveLength(1);
    expect(
      repository.updatePlan(plan.id, session.id, {
        approvalState: "approved",
      })?.approvalState,
    ).toBe("approved");
    expect(repository.getPlan(plan.id, "other-session")).toBeUndefined();
  });

  it("stores workflow scheduling state and isolates it by session", () => {
    const repository = new AssistantStateRepository();
    const session = repository.createSession({
      project: {
        id: "project",
        name: "Project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: "active",
      goals: [],
      savedStateIds: [],
    });
    const workflow = repository.createWorkflow(session.id, {
      name: "Nightly verification",
      status: "paused",
      operationPackIds: [],
      checkpointIds: [],
      repeatCount: 3,
      schedule: {
        enabled: true,
        nextRunAt: "2030-01-01T00:00:00.000Z",
        timezone: "UTC",
      },
      pauseResumePolicy: {
        pauseOnError: true,
        allowResume: true,
        resumeMode: "scheduled",
      },
      goals: [],
    });

    expect(repository.listWorkflows(session.id)).toEqual([workflow]);
    expect(
      repository.getWorkflow(workflow.id, "other-session"),
    ).toBeUndefined();
    expect(
      repository.updateWorkflow(workflow.id, session.id, {
        repeatCount: 4,
      })?.repeatCount,
    ).toBe(4);
  });
});
