import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AssistantStateRepository } from "./assistant-state";
import { ExecutionStateRepository } from "./execution-state";
import { RecordingRepository } from "./recording-state";

const files: string[] = [];

afterEach(() => {
  for (const file of files.splice(0)) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});

const storageFile = () => {
  const file = path.join(
    os.tmpdir(),
    `assistant-storage-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  files.push(file);
  return file;
};

describe("durable assistant storage", () => {
  it("restores session-scoped resources after a repository restart", () => {
    const filePath = storageFile();
    const first = new AssistantStateRepository({ filePath });
    const session = first.createSession({
      project: {
        id: "project",
        name: "Persistent project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: "active",
      goals: [],
      savedStateIds: [],
    });
    first.createResource("instructions", session.id, { text: "Remember this" });
    first.createResource("progress", session.id, {
      kind: "progress",
      message: "Stored on disk",
    });

    const restarted = new AssistantStateRepository({ filePath });
    expect(restarted.getSession(session.id)?.project.name).toBe(
      "Persistent project",
    );
    expect(restarted.listResource("instructions", session.id)[0].text).toBe(
      "Remember this",
    );
    expect(restarted.listResource("progress", session.id)).toHaveLength(1);
  });

  it("restores recordings and keeps an explicit memory mode isolated", () => {
    const filePath = storageFile();
    const first = new RecordingRepository({ filePath });
    const recording = first.start("session-1", "Persistent recording", {
      source: "manual",
      sensitiveInputCaptured: false,
    });
    first.stop(recording.id);

    const restarted = new RecordingRepository({ filePath });
    expect(restarted.get(recording.id)?.status).toBe("stopped");

    const memory = new RecordingRepository({ mode: "memory", filePath });
    expect(memory.get(recording.id)).toBeUndefined();
  });

  it("restores execution records after a restart", () => {
    const filePath = storageFile();
    const plan = {
      id: "plan-1",
      sessionId: "session-1",
      steps: [],
    } as never;
    const first = new ExecutionStateRepository(undefined, { filePath });
    const execution = first.create(plan);

    const restarted = new ExecutionStateRepository(undefined, { filePath });
    expect(restarted.get(execution.id)).toMatchObject({
      id: execution.id,
      sessionId: "session-1",
      status: "pending",
    });
  });
});
