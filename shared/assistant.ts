export type AssistantSessionStatus =
  | "active"
  | "paused"
  | "completed"
  | "archived";
export type AssistantItemStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "blocked";
export type ProgressKind =
  | "progress"
  | "accomplishment"
  | "obstacle"
  | "suggestion";

export interface AssistantProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantSubtask {
  id: string;
  title: string;
  status: AssistantItemStatus;
  notes?: string;
}

export interface AssistantTask {
  id: string;
  title: string;
  status: AssistantItemStatus;
  subtasks: AssistantSubtask[];
  notes?: string;
}

export interface AssistantGoal {
  id: string;
  title: string;
  status: AssistantItemStatus;
  tasks: AssistantTask[];
  notes?: string;
}

export interface AssistantSession {
  id: string;
  project: AssistantProject;
  status: AssistantSessionStatus;
  goals: AssistantGoal[];
  savedStateIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RegionOfInterest {
  id: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

export interface Annotation {
  id: string;
  text: string;
  type?: string;
  region?: RegionOfInterest;
}

export interface ScreenshotCapture {
  id: string;
  sessionId: string;
  imageData: string;
  source?: string;
  capturedAt: string;
  annotations: Annotation[];
}

export interface UserInstruction {
  id: string;
  sessionId: string;
  text: string;
  priority?: number;
  createdAt: string;
  completedAt?: string;
}

export interface OperationPack {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  operations: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressEntry {
  id: string;
  sessionId: string;
  kind: ProgressKind;
  message: string;
  relatedGoalId?: string;
  createdAt: string;
}

export interface SavedState {
  id: string;
  sessionId: string;
  label: string;
  snapshot: Record<string, unknown>;
  createdAt: string;
}
