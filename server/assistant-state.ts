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
} from "@shared/assistant";

type ResourceMap = {
  captures: ScreenshotCapture;
  instructions: UserInstruction;
  operationPacks: OperationPack;
  progress: ProgressEntry;
  savedStates: SavedState;
  plans: AssistantPlan;
  workflows: AssistantWorkflow;
};

const now = () => new Date().toISOString();
const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export class AssistantStateRepository {
  private readonly sessions = new Map<string, AssistantSession>();
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
  };

  listSessions(): AssistantSession[] {
    return [...this.sessions.values()];
  }

  getSession(id: string): AssistantSession | undefined {
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
    return updated;
  }

  deleteSession(id: string): boolean {
    if (!this.sessions.delete(id)) return false;
    for (const resourceMap of Object.values(this.resources)) {
      for (const [resourceId, resource] of resourceMap) {
        if (resource.sessionId === id) resourceMap.delete(resourceId);
      }
    }
    return true;
  }

  listResource<K extends keyof ResourceMap>(
    kind: K,
    sessionId: string,
  ): ResourceMap[K][] {
    return [...this.resources[kind].values()].filter(
      (resource) => resource.sessionId === sessionId,
    );
  }

  getResource<K extends keyof ResourceMap>(
    kind: K,
    id: string,
    sessionId: string,
  ): ResourceMap[K] | undefined {
    const resource = this.resources[kind].get(id);
    return resource?.sessionId === sessionId ? resource : undefined;
  }

  createResource<K extends keyof ResourceMap>(
    kind: K,
    sessionId: string,
    input: unknown,
  ): ResourceMap[K] {
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
    return resource;
  }

  updateResource<K extends keyof ResourceMap>(
    kind: K,
    id: string,
    sessionId: string,
    updates: unknown,
  ): ResourceMap[K] | undefined {
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
    return updated;
  }

  deleteResource<K extends keyof ResourceMap>(
    kind: K,
    id: string,
    sessionId: string,
  ): boolean {
    return this.getResource(kind, id, sessionId)
      ? this.resources[kind].delete(id)
      : false;
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
}

export const assistantStateRepository = new AssistantStateRepository();
