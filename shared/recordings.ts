export type RecordingStatus = "recording" | "stopped";
export type RecordingSource =
  | "browser-panel"
  | "manual"
  | "imported"
  | "assistant";

export interface RecordingSourceMetadata {
  source: RecordingSource;
  appId?: string;
  pagePath?: string;
  userAgent?: string;
  sensitiveInputCaptured: false;
}

export interface ActionBase {
  id: string;
  timestamp: string;
  source: RecordingSourceMetadata;
}

export interface MouseClickAction extends ActionBase {
  type: "mouse-click";
  x: number;
  y: number;
  button: "left" | "middle" | "right";
  target?: string;
}

export interface MouseMoveAction extends ActionBase {
  type: "mouse-move";
  x: number;
  y: number;
  target?: string;
}

export interface KeyboardKeyAction extends ActionBase {
  type: "keyboard-key";
  key: string;
  code?: string;
  modifiers: string[];
  sensitive: false;
}

export interface KeyboardTextAction extends ActionBase {
  type: "keyboard-text";
  text?: string;
  redacted: boolean;
  sensitive: true;
}

export interface WaitAction extends ActionBase {
  type: "wait";
  durationMs: number;
}

export interface ScreenshotCheckpointAction extends ActionBase {
  type: "screenshot-checkpoint";
  label: string;
  imageRef?: string;
}

export interface NoteAction extends ActionBase {
  type: "note";
  text: string;
}

export type RecordedAction =
  | MouseClickAction
  | MouseMoveAction
  | KeyboardKeyAction
  | KeyboardTextAction
  | WaitAction
  | ScreenshotCheckpointAction
  | NoteAction;

export interface RecordedSession {
  id: string;
  sessionId: string;
  name: string;
  status: RecordingStatus;
  startedAt: string;
  stoppedAt?: string;
  source: RecordingSourceMetadata;
  events: RecordedAction[];
}

export interface RecordingOperationPack {
  id: string;
  recordingId: string;
  name: string;
  description: string;
  previewOnly: true;
  operations: string[];
  createdAt: string;
}

export interface RecordingPlanDraft {
  id: string;
  recordingId: string;
  title: string;
  previewOnly: true;
  steps: Array<{
    order: number;
    actionId: string;
    description: string;
    requiresReview: true;
  }>;
  createdAt: string;
}
