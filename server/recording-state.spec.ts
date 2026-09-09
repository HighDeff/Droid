import { describe, expect, it } from "vitest";
import type { RecordedAction } from "@shared/recordings";
import { RecordingRepository } from "./recording-state";

const source = {
  source: "browser-panel" as const,
  sensitiveInputCaptured: false as const,
};

describe("RecordingRepository", () => {
  it("keeps recordings isolated and creates preview-only artifacts", () => {
    const repository = new RecordingRepository();
    const recording = repository.start("browser", "Checkout review", source);
    const event: RecordedAction = {
      id: "event_1",
      timestamp: new Date().toISOString(),
      source,
      type: "keyboard-key",
      key: "Enter",
      modifiers: [],
      sensitive: false,
    };

    repository.append(recording.id, [event]);
    expect(repository.list("other-session")).toHaveLength(0);
    expect(repository.get(recording.id)?.events).toHaveLength(1);

    const pack = repository.createOperationPack(recording.id);
    const draft = repository.createPlanDraft(recording.id);
    expect(pack?.previewOnly).toBe(true);
    expect(pack?.operations).toContain("Press Enter");
    expect(draft?.previewOnly).toBe(true);
    expect(draft?.steps[0].requiresReview).toBe(true);
  });

  it("rejects appends after stopping by preserving the stopped snapshot", () => {
    const repository = new RecordingRepository();
    const recording = repository.start("browser", "Stopped recording", source);
    const stopped = repository.stop(recording.id);

    expect(stopped?.status).toBe("stopped");
    expect(repository.append(recording.id, [])).toBeUndefined();
  });
});
