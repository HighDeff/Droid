import type {
  RecordedAction,
  RecordedSession,
  RecordingOperationPack,
  RecordingPlanDraft,
  RecordingSourceMetadata,
} from "@shared/recordings";

const now = () => new Date().toISOString();
const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export class RecordingRepository {
  private readonly recordings = new Map<string, RecordedSession>();

  start(
    sessionId: string,
    name: string,
    source: RecordingSourceMetadata,
  ): RecordedSession {
    const startedAt = now();
    const recording: RecordedSession = {
      id: createId("recording"),
      sessionId,
      name,
      status: "recording",
      startedAt,
      source,
      events: [],
    };
    this.recordings.set(recording.id, recording);
    return recording;
  }

  stop(id: string): RecordedSession | undefined {
    const recording = this.recordings.get(id);
    if (!recording) return undefined;
    const updated = {
      ...recording,
      status: "stopped" as const,
      stoppedAt: recording.stoppedAt ?? now(),
    };
    this.recordings.set(id, updated);
    return updated;
  }

  append(id: string, events: RecordedAction[]): RecordedSession | undefined {
    const recording = this.recordings.get(id);
    if (!recording || recording.status !== "recording") return undefined;
    const updated = { ...recording, events: [...recording.events, ...events] };
    this.recordings.set(id, updated);
    return updated;
  }

  list(sessionId?: string): RecordedSession[] {
    return [...this.recordings.values()]
      .filter((recording) => !sessionId || recording.sessionId === sessionId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  get(id: string): RecordedSession | undefined {
    return this.recordings.get(id);
  }

  createOperationPack(id: string): RecordingOperationPack | undefined {
    const recording = this.get(id);
    if (!recording) return undefined;
    return {
      id: createId("pack"),
      recordingId: id,
      name: `${recording.name} review pack`,
      description:
        "A preview-only representation of recorded browser actions. No actions are executed.",
      previewOnly: true,
      operations: recording.events.map((event) => describeAction(event)),
      createdAt: now(),
    };
  }

  createPlanDraft(id: string): RecordingPlanDraft | undefined {
    const recording = this.get(id);
    if (!recording) return undefined;
    return {
      id: createId("draft"),
      recordingId: id,
      title: `${recording.name} plan draft`,
      previewOnly: true,
      steps: recording.events.map((event, index) => ({
        order: index + 1,
        actionId: event.id,
        description: describeAction(event),
        requiresReview: true as const,
      })),
      createdAt: now(),
    };
  }
}

function describeAction(event: RecordedAction): string {
  switch (event.type) {
    case "mouse-click":
      return `Click ${event.button} at (${event.x}, ${event.y})`;
    case "mouse-move":
      return `Move pointer to (${event.x}, ${event.y})`;
    case "keyboard-key":
      return `Press ${event.key}${event.modifiers.length ? ` with ${event.modifiers.join("+")}` : ""}`;
    case "keyboard-text":
      return event.redacted
        ? "Enter redacted text (value not captured)"
        : "Enter captured text";
    case "wait":
      return `Wait ${event.durationMs}ms`;
    case "screenshot-checkpoint":
      return `Review screenshot checkpoint: ${event.label}`;
    case "note":
      return `Note: ${event.text}`;
  }
}

export const recordingRepository = new RecordingRepository();
