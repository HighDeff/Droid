import { Router } from "express";
import { z } from "zod";
import { assistantStateRepository } from "../assistant-state";
import { liveEvents } from "../live-events";

const message = z.object({
  type: z.enum(["goal.changed", "goal.clarification", "goal.collaborator"]),
  payload: z.record(z.unknown()),
});

export const assistantLiveRouter = Router();

assistantLiveRouter.get("/:sessionId/events", (req, res) => {
  if (!assistantStateRepository.getSession(req.params.sessionId)) {
    return res
      .status(404)
      .json({ success: false, error: "Assistant session not found" });
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  for (const event of liveEvents.history(req.params.sessionId)) {
    res.write(
      `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`,
    );
  }
  const unsubscribe = liveEvents.subscribe(req.params.sessionId, res);
  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 15_000);
  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

assistantLiveRouter.post("/:sessionId/events", (req, res) => {
  if (!assistantStateRepository.getSession(req.params.sessionId)) {
    return res
      .status(404)
      .json({ success: false, error: "Assistant session not found" });
  }
  const parsed = message.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid collaboration event",
      issues: parsed.error.issues,
    });
  }
  const event = liveEvents.publish(
    req.params.sessionId,
    parsed.data.type,
    parsed.data.payload,
  );
  res.status(202).json({ success: true, event });
});
