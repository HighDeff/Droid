import {
  Annotation,
  AssistantPlan,
  AssistantSession,
  AssistantWorkflow,
  OperationPack,
  ProgressEntry,
  SavedState,
  ScreenshotCapture,
  UserInstruction,
  WaitCondition,
  WaitConditionStatusEvent,
} from "@shared/assistant";
import { DurableStore, type StorageOptions } from "./durable-store";

type ResourceMap = {
  captures: ScreenshotCapture;
  instructions: UserInstruction;
  operationPacks: OperationPack;
  progress: ProgressEntry;
  savedStates: SavedState;
  plans: AssistantPlan;
  workflows: AssistantWorkflow;
  waitConditions: WaitCondition;
  conditionEvents: WaitConditionStatusEvent;
};

const now = () => new Date().toISOString();
const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export class AssistantStateRepository {
  private readonly store: DurableStore;
  private sessions = new Map<string, AssistantSession>();
  private readonly resources: {
    [K in keyof ResourceMap]: Map<string, ResourceMap[K]>;
  } = {
    captures: new Map(),
    instructions: new Map(),
    operationPacks: new Map(),
    progress: new Map(),
    savedStates: new Map(),
    plans: new Map(),
    workflows: new Map(),
    waitConditions: new Map(),
    conditionEvents: new Map(),
  };

  constructor(options: StorageOptions = {}) {
    this.store = new DurableStore(options);
    this.load();
  }

  private load() {
    this.sessions = new Map(
      this.store
        .readCollection<AssistantSession>("sessions")
        .map((item) => [item.id, item]),
    );
    for (const kind of Object.keys(this.resources) as Array<
      keyof ResourceMap
    >) {
      this.loadResource(kind);
    }
  }

  private loadResource<K extends keyof ResourceMap>(kind: K) {
    const values = this.store.readCollection<ResourceMap[K]>(kind);
    this.resources[kind] = new Map(
      values.map((item) => [item.id, item]),
    ) as (typeof this.resources)[K];
  }

  private persist() {
    this.store.writeCollection("sessions", [...this.sessions.values()]);
    for (const kind of Object.keys(this.resources) as Array<
      keyof ResourceMap
    >) {
      this.store.writeCollection(kind, [...this.resources[kind].values()]);
    }
  }

  listSessions(): AssistantSession[] {
    this.load();
    return [...this.sessions.values()];
  }

  getSession(id: string): AssistantSession | undefined {
    this.load();
    return this.sessions.get(id);
  }

  createSession(
    input: Omit<AssistantSession, "id" | "createdAt" | "updatedAt">,
  ): AssistantSession {
    const timestamp = now();
    const session = {
      ...input,
      id: createId("session"),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.sessions.set(session.id, session);
    this.persist();
    return session;
  }

  updateSession(
    id: string,
    updates: Partial<
      Pick<AssistantSession, "project" | "status" | "goals" | "savedStateIds">
    >,
  ): AssistantSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...updates, updatedAt: now() };
    this.sessions.set(id, updated);
    this.persist();
    return updated;
  }

  deleteSession(id: string): boolean {
    if (!this.sessions.delete(id)) return false;
    for (const resourceMap of Object.values(this.resources)) {
      for (const [resourceId, resource] of resourceMap) {
        if (
          "sessionId" in resource &&
          (resource as { sessionId?: string }).sessionId === id
        ) {
          resourceMap.delete(resourceId);
        }
      }
      this.persist();
    }
    return true;
  }

  listResource<K extends keyof ResourceMap>(
    kind: K,
    sessionId: string,
  ): ResourceMap[K][] {
    this.load();
    return [...this.resources[kind].values()].filter(
      (resource) =>
        "sessionId" in resource &&
        (resource as { sessionId?: string }).sessionId === sessionId,
    );
  }

  getResource<K extends keyof ResourceMap>(
    kind: K,
    id: string,
    sessionId: string,
  ): ResourceMap[K] | undefined {
    this.load();
    const resource = this.resources[kind].get(id);
    return resource &&
      "sessionId" in resource &&
      (resource as { sessionId?: string }).sessionId === sessionId
      ? resource
      : undefined;
  }

  createResource<K extends keyof ResourceMap>(
    kind: K,
    sessionId: string,
    input: unknown,
  ): ResourceMap[K] {
    this.load();
    const timestamp = now();
    const inputRecord = input as Record<string, unknown>;
    const resource = {
      ...inputRecord,
      id: createId(kind),
      sessionId,
      createdAt: timestamp,
      ...(kind === "captures"
        ? {
            capturedAt: inputRecord.capturedAt ?? timestamp,
            annotations: (
              (inputRecord.annotations as Array<Record<string, unknown>>) ?? []
            ).map((annotation) => ({
              ...annotation,
              id: annotation.id ?? createId("annotation"),
              ...(annotation.region && typeof annotation.region === "object"
                ? {
                    region: {
                      ...(annotation.region as Record<string, unknown>),
                      id:
                        (annotation.region as Record<string, unknown>).id ??
                        createId("region"),
                    },
                  }
                : {}),
            })),
          }
        : {}),
      ...(kind === "operationPacks" || kind === "workflows"
        ? { updatedAt: timestamp }
        : {}),
    } as ResourceMap[K];
    this.resources[kind].set(resource.id, resource);
    this.persist();
    return resource;
  }

  updateResource<K extends keyof ResourceMap>(
    kind: K,
    id: string,
    sessionId: string,
    updates: unknown,
  ): ResourceMap[K] | undefined {
    this.load();
    const resource = this.getResource(kind, id, sessionId);
    if (!resource) return undefined;
    const updated = {
      ...resource,
      ...(updates as Record<string, unknown>),
      ...(kind === "operationPacks" || kind === "workflows"
        ? { updatedAt: now() }
        : {}),
    } as ResourceMap[K];
    this.resources[kind].set(id, updated);
    this.persist();
    return updated;
  }

  deleteResource<K extends keyof ResourceMap>(
    kind: K,
    id: string,
    sessionId: string,
  ): boolean {
    const exists = this.getResource(kind, id, sessionId);
    if (!exists) return false;
    const deleted = this.resources[kind].delete(id);
    this.persist();
    return deleted;
  }

  addAnnotation(
    captureId: string,
    sessionId: string,
    annotation: Omit<Annotation, "id">,
  ): ScreenshotCapture | undefined {
    const capture = this.getResource("captures", captureId, sessionId);
    if (!capture) return undefined;
    return this.updateResource("captures", captureId, sessionId, {
      annotations: [
        ...capture.annotations,
        { ...annotation, id: createId("annotation") },
      ],
    });
  }

  listPlans(sessionId: string): AssistantPlan[] {
    return [...this.resources.plans.values()]
      .filter((plan) => plan.sessionId === sessionId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getPlan(id: string, sessionId: string): AssistantPlan | undefined {
    return this.getResource("plans", id, sessionId);
  }

  createPlan(
    sessionId: string,
    plan: Omit<AssistantPlan, "id" | "sessionId" | "createdAt" | "updatedAt">,
  ): AssistantPlan {
    return this.createResource("plans", sessionId, plan);
  }

  updatePlan(
    id: string,
    sessionId: string,
    updates: Partial<AssistantPlan>,
  ): AssistantPlan | undefined {
    return this.updateResource("plans", id, sessionId, updates);
  }

  listWorkflows(sessionId: string): AssistantWorkflow[] {
    return [...this.resources.workflows.values()]
      .filter((workflow) => workflow.sessionId === sessionId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getWorkflow(id: string, sessionId: string): AssistantWorkflow | undefined {
    return this.getResource("workflows", id, sessionId);
  }

  createWorkflow(
    sessionId: string,
    workflow: Omit<
      AssistantWorkflow,
      "id" | "sessionId" | "createdAt" | "updatedAt"
    >,
  ): AssistantWorkflow {
    return this.createResource("workflows", sessionId, workflow);
  }

  updateWorkflow(
    id: string,
    sessionId: string,
    updates: Partial<AssistantWorkflow>,
  ): AssistantWorkflow | undefined {
    return this.updateResource("workflows", id, sessionId, updates);
  }

  listWaitConditions(sessionId: string): WaitCondition[] {
    return this.listResource("waitConditions", sessionId);
  }

  getWaitCondition(id: string, sessionId: string): WaitCondition | undefined {
    return this.getResource("waitConditions", id, sessionId);
  }

  createWaitCondition(
    sessionId: string,
    condition: WaitCondition,
  ): WaitCondition {
    return this.createResource("waitConditions", sessionId, condition);
  }

  listConditionEvents(sessionId: string): WaitConditionStatusEvent[] {
    return this.listResource("conditionEvents", sessionId).sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
  }

  addConditionEvent(
    sessionId: string,
    event: Omit<WaitConditionStatusEvent, "id" | "sessionId" | "timestamp">,
  ): WaitConditionStatusEvent {
    return this.createResource("conditionEvents", sessionId, event);
  }
}

export const assistantStateRepository = new AssistantStateRepository();
