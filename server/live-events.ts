import type { Response } from "express";

type LiveEvent = {
  id: string;
  type: string;
  sessionId: string;
  payload: unknown;
  createdAt: string;
};

const events = new Map<string, LiveEvent[]>();
const clients = new Map<string, Set<Response>>();

export const liveEvents = {
  publish(sessionId: string, type: string, payload: unknown) {
    const event: LiveEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      sessionId,
      payload,
      createdAt: new Date().toISOString(),
    };
    const history = events.get(sessionId) ?? [];
    history.push(event);
    events.set(sessionId, history.slice(-100));
    for (const response of clients.get(sessionId) ?? []) {
      response.write(
        `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`,
      );
    }
    return event;
  },
  history(sessionId: string) {
    return events.get(sessionId) ?? [];
  },
  subscribe(sessionId: string, response: Response) {
    const sessionClients = clients.get(sessionId) ?? new Set<Response>();
    sessionClients.add(response);
    clients.set(sessionId, sessionClients);
    return () => {
      sessionClients.delete(response);
      if (sessionClients.size === 0) clients.delete(sessionId);
    };
  },
};
