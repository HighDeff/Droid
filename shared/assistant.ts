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
export type PlanApprovalState =
  | "proposed"
  | "needs_clarification"
  | "approved"
  | "rejected";
export type PlanStepStatus = "proposed" | "edited" | "approved";
export type PlanRiskLevel = "low" | "medium" | "high";
export type TimingHint = "now" | "soon" | "scheduled" | "when_ready";

export type AllowlistedActionType =
  | "click"
  | "type"
  | "key"
  | "wait"
  | "screenshot"
  | "navigate-shortcut";

export interface ClickAction {
  type: "click";
  x: number;
  y: number;
  button?: "left" | "right";
}

export interface TypeAction {
  type: "type";
  text: string;
}

export interface KeyAction {
  type: "key";
  key: string;
}

export interface WaitAction {
  type: "wait";
  durationMs: number;
}

export interface ScreenshotAction {
  type: "screenshot";
  label?: string;
}

export interface NavigateShortcutAction {
  type: "navigate-shortcut";
  shortcut: "back" | "forward" | "home" | "refresh";
}

export type AllowlistedAction =
  | ClickAction
  | TypeAction
  | KeyAction
  | WaitAction
  | ScreenshotAction
  | NavigateShortcutAction;

export type ExecutionStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed";

export type ExecutionEventStatus = "started" | "completed" | "failed" | "info";

export interface ExecutionTimelineEvent {
  id: string;
  timestamp: string;
  status: ExecutionEventStatus;
  message: string;
  stepId?: string;
  result?: unknown;
}

export interface ActionExecutionResult {
  actionType: AllowlistedActionType;
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface AssistantExecution {
  id: string;
  planId: string;
  sessionId: string;
  status: ExecutionStatus;
  currentStep: number;
  totalSteps: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  timeline: ExecutionTimelineEvent[];
  results: ActionExecutionResult[];
}

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

export type AnalysisStatus =
  | "queued"
  | "processing"
  | "completed"
  | "fallback"
  | "failed";

export type AnalysisProvider = "local-ocr" | "deterministic-fallback";

export interface CapturedFrameReference {
  captureId?: string;
  sessionId?: string;
  imageRef?: string;
  imageData?: string;
}

export interface OCRTextBlock {
  id: string;
  text: string;
  confidence: number;
  region?: RegionOfInterest;
}

export interface DetectedUIElement {
  id: string;
  type: string;
  label?: string;
  confidence: number;
  region: RegionOfInterest;
}

export interface FrameAnalysis {
  id: string;
  captureId?: string;
  sessionId?: string;
  source?: string;
  status: AnalysisStatus;
  provider: AnalysisProvider;
  confidence: number;
  ocrText: OCRTextBlock[];
  detectedElements: DetectedUIElement[];
  regionsOfInterest: RegionOfInterest[];
  notes: string[];
  analyzedAt: string;
}

export interface UserInstruction {
  id: string;
  sessionId: string;
  text: string;
  priority?: number;
  createdAt: string;
  completedAt?: string;
}

export interface InstructionClarification {
  id: string;
  question: string;
  reason: string;
  required: boolean;
  answer?: string;
}

export interface PlanPrerequisite {
  id: string;
  description: string;
  satisfied: boolean;
  source?: string;
}

export interface PlannedStep {
  id: string;
  order: number;
  title: string;
  description: string;
  status: PlanStepStatus;
  timing: TimingHint;
  confidence: number;
  prerequisites: string[];
  risks: string[];
  action?: AllowlistedAction;
}

export interface PlanRisk {
  id: string;
  description: string;
  level: PlanRiskLevel;
  mitigation?: string;
}

export interface AssistantPlan {
  id: string;
  sessionId: string;
  instruction: UserInstruction;
  sourceCaptureIds: string[];
  sourceNoteIds: string[];
  clarifications: InstructionClarification[];
  steps: PlannedStep[];
  prerequisites: PlanPrerequisite[];
  risks: PlanRisk[];
  timing: TimingHint;
  confidence: number;
  approvalState: PlanApprovalState;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
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

export type WorkflowStatus = "active" | "paused" | "completed" | "archived";
export type WorkflowResumeMode = "manual" | "scheduled";

export interface WorkflowSchedule {
  enabled: boolean;
  nextRunAt?: string;
  timezone?: string;
}

export interface PauseResumePolicy {
  pauseOnError: boolean;
  allowResume: boolean;
  resumeMode: WorkflowResumeMode;
}

export interface WorkflowTaskProgress {
  taskId: string;
  title: string;
  status: AssistantItemStatus;
  completed: number;
  total: number;
}

export interface WorkflowGoalProgress {
  goalId: string;
  title: string;
  status: AssistantItemStatus;
  completed: number;
  total: number;
  tasks: WorkflowTaskProgress[];
}

export interface AssistantWorkflow {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  operationPackIds: string[];
  checkpointIds: string[];
  repeatCount: number;
  schedule: WorkflowSchedule;
  pauseResumePolicy: PauseResumePolicy;
  goals: WorkflowGoalProgress[];
  createdAt: string;
  updatedAt: string;
}

export type CaptureSourceKind = "desktop" | "android";
export type CaptureSourceConnectionState =
  | "connected"
  | "disconnected"
  | "error";

export interface CaptureSource {
  id: string;
  kind: CaptureSourceKind;
  name: string;
  detail?: string;
  connectionState: CaptureSourceConnectionState;
  lastFrameAt?: string;
  error?: string;
  deviceId?: string;
}

export interface CaptureSourceFrame {
  sourceId: string;
  imageData: string;
  capturedAt: string;
}
