import type { Response } from "express";

type LiveEvent = {
  id: string;
  type: string;
  sessionId: string;
  payload: unknown;
  createdAt: string;
  userId?: string;
  priority?: "low" | "medium" | "high" | "urgent";
};

type CollaborationState = {
  activeUsers: Map<string, { userId: string; joinedAt: string; lastActivity: string }>;
  pendingClarifications: Map<string, { question: string; askedBy: string; askedAt: string; answer?: string; answeredAt?: string }>;
  goalChanges: Map<string, { oldGoal: string; newGoal: string; changedBy: string; changedAt: string; approvedBy?: string[] }>;
  sharedContext: Map<string, { key: string; value: unknown; updatedAt: string; updatedBy: string }>;
};

const events = new Map<string, LiveEvent[]>();
const clients = new Map<string, Set<Response>>();
const collaborationStates = new Map<string, CollaborationState>();

const getCollaborationState = (sessionId: string): CollaborationState => {
  if (!collaborationStates.has(sessionId)) {
    collaborationStates.set(sessionId, {
      activeUsers: new Map(),
      pendingClarifications: new Map(),
      goalChanges: new Map(),
      sharedContext: new Map(),
    });
  }
  return collaborationStates.get(sessionId)!;
};

export const liveEvents = {
  publish(sessionId: string, type: string, payload: unknown, userId?: string, priority?: "low" | "medium" | "high" | "urgent") {
    const event: LiveEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      sessionId,
      payload,
      createdAt: new Date().toISOString(),
      userId,
      priority,
    };
    const history = events.get(sessionId) ?? [];
    history.push(event);
    events.set(sessionId, history.slice(-100));
    
    // Update user activity
    if (userId) {
      const collabState = getCollaborationState(sessionId);
      const user = collabState.activeUsers.get(userId);
      if (user) {
        user.lastActivity = new Date().toISOString();
        collabState.activeUsers.set(userId, user);
      }
    }
    
    for (const response of clients.get(sessionId) ?? []) {
      response.write(
        `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`,
      );
    }
    return event;
  },
  
  // Real-time collaboration methods
  joinSession(sessionId: string, userId: string, userInfo?: { name?: string; role?: string }) {
    const collabState = getCollaborationState(sessionId);
    collabState.activeUsers.set(userId, {
      userId,
      joinedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    });
    
    this.publish(sessionId, "user.joined", {
      userId,
      userInfo,
      activeUsers: Array.from(collabState.activeUsers.values()),
    }, userId);
    
    return collabState.activeUsers.get(userId);
  },
  
  leaveSession(sessionId: string, userId: string) {
    const collabState = getCollaborationState(sessionId);
    collabState.activeUsers.delete(userId);
    
    this.publish(sessionId, "user.left", {
      userId,
      activeUsers: Array.from(collabState.activeUsers.values()),
    }, userId);
  },
  
  requestClarification(sessionId: string, question: string, askedBy: string, relatedStepId?: string) {
    const collabState = getCollaborationState(sessionId);
    const clarificationId = `clarification_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    collabState.pendingClarifications.set(clarificationId, {
      question,
      askedBy,
      askedAt: new Date().toISOString(),
    });
    
    this.publish(sessionId, "clarification.requested", {
      clarificationId,
      question,
      askedBy,
      relatedStepId,
      pendingCount: collabState.pendingClarifications.size,
    }, askedBy, "high");
    
    return clarificationId;
  },
  
  answerClarification(sessionId: string, clarificationId: string, answer: string, answeredBy: string) {
    const collabState = getCollaborationState(sessionId);
    const clarification = collabState.pendingClarifications.get(clarificationId);
    
    if (clarification) {
      clarification.answer = answer;
      clarification.answeredAt = new Date().toISOString();
      collabState.pendingClarifications.set(clarificationId, clarification);
      
      this.publish(sessionId, "clarification.answered", {
        clarificationId,
        answer,
        answeredBy,
        originalQuestion: clarification.question,
        askedBy: clarification.askedBy,
      }, answeredBy, "high");
      
      // Remove from pending after answering
      setTimeout(() => {
        collabState.pendingClarifications.delete(clarificationId);
      }, 5000);
      
      return true;
    }
    
    return false;
  },
  
  changeGoal(sessionId: string, oldGoal: string, newGoal: string, changedBy: string, reason?: string) {
    const collabState = getCollaborationState(sessionId);
    const changeId = `goal_change_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    collabState.goalChanges.set(changeId, {
      oldGoal,
      newGoal,
      changedBy,
      changedAt: new Date().toISOString(),
      approvedBy: [],
    });
    
    this.publish(sessionId, "goal.changed", {
      changeId,
      oldGoal,
      newGoal,
      changedBy,
      reason,
      requiresApproval: true,
    }, changedBy, "urgent");
    
    return changeId;
  },
  
  approveGoalChange(sessionId: string, changeId: string, approvedBy: string) {
    const collabState = getCollaborationState(sessionId);
    const change = collabState.goalChanges.get(changeId);
    
    if (change) {
      if (!change.approvedBy.includes(approvedBy)) {
        change.approvedBy.push(approvedBy);
      }
      
      this.publish(sessionId, "goal.approval", {
        changeId,
        approvedBy,
        approvalCount: change.approvedBy.length,
        totalApprovalCount: collabState.activeUsers.size,
      }, approvedBy);
      
      // Auto-approve if majority approves
      if (change.approvedBy.length >= Math.ceil(collabState.activeUsers.size / 2)) {
        this.publish(sessionId, "goal.approved", {
          changeId,
          newGoal: change.newGoal,
          approvedBy: change.approvedBy,
        }, "system", "urgent");
      }
      
      return true;
    }
    
    return false;
  },
  
  updateSharedContext(sessionId: string, key: string, value: unknown, updatedBy: string) {
    const collabState = getCollaborationState(sessionId);
    collabState.sharedContext.set(key, {
      key,
      value,
      updatedAt: new Date().toISOString(),
      updatedBy,
    });
    
    this.publish(sessionId, "context.updated", {
      key,
      value,
      updatedBy,
    }, updatedBy);
    
    return true;
  },
  
  getSharedContext(sessionId: string, key?: string) {
    const collabState = getCollaborationState(sessionId);
    if (key) {
      return collabState.sharedContext.get(key);
    }
    return Object.fromEntries(collabState.sharedContext);
  },
  
  getActiveUsers(sessionId: string) {
    const collabState = getCollaborationState(sessionId);
    return Array.from(collabState.activeUsers.values());
  },
  
  getPendingClarifications(sessionId: string) {
    const collabState = getCollaborationState(sessionId);
    return Array.from(collabState.pendingClarifications.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  },
  
  getCollaborationState(sessionId: string) {
    return getCollaborationState(sessionId);
  },
  
  history(sessionId: string) {
    return events.get(sessionId) ?? [];
  },
  
  subscribe(sessionId: string, response: Response) {
    const sessionClients = clients.get(sessionId) ?? new Set<Response>();
    sessionClients.add(response);
    clients.set(sessionId, sessionClients);
    
    // Send current collaboration state on subscribe
    const collabState = getCollaborationState(sessionId);
    response.write(
      `id: init_state\nevent: collaboration.state\ndata: ${JSON.stringify({
        activeUsers: Array.from(collabState.activeUsers.values()),
        pendingClarifications: Array.from(collabState.pendingClarifications.entries()).map(([id, data]) => ({ id, ...data })),
        sharedContext: Object.fromEntries(collabState.sharedContext),
      })}\n\n`,
    );
    
    return () => {
      sessionClients.delete(response);
      if (sessionClients.size === 0) clients.delete(sessionId);
    };
  },
};
