import { RequestHandler, Router } from "express";
import { z } from "zod";
import type { FrameAnalysis, RegionOfInterest } from "@shared/assistant";
import { analysisRepository } from "../analysis-state";

const requestSchema = z
  .object({
    captureId: z.string().min(1).optional(),
    sessionId: z.string().min(1).optional(),
    imageRef: z.string().min(1).max(2048).optional(),
    imageData: z.string().min(1).max(50_000_000).optional(),
    source: z.string().min(1).max(128).optional(),
  })
  .refine((body) => body.imageRef || body.imageData, {
    message: "imageRef or imageData is required",
    path: ["imageData"],
  });

const fullFrameRegion = (): RegionOfInterest => ({
  id: "roi_full_frame",
  label: "Captured frame",
  x: 0,
  y: 0,
  width: 1,
  height: 1,
});

export const analysisRouter = Router();

analysisRouter.post("/", ((req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid analysis request",
      issues: parsed.error.issues,
    });
  }

  const { captureId, sessionId, imageRef, imageData, source } = parsed.data;
  const analysis: Omit<FrameAnalysis, "id"> = {
    captureId,
    sessionId,
    source: source ?? (imageRef ? "image-reference" : "captured-image"),
    status: "fallback",
    provider: "deterministic-fallback",
    confidence: 0,
    ocrText: [],
    detectedElements: [],
    regionsOfInterest: [fullFrameRegion()],
    notes: [
      "No local OCR integration is available in this installation.",
      "OCR was not attempted; empty text is not a successful OCR result.",
      imageRef
        ? "The image reference was recorded for downstream analysis."
        : "The captured image data was accepted without persisting the image.",
    ],
    analyzedAt: new Date().toISOString(),
  };

  const created = analysisRepository.create(analysis);
  return res.status(201).json({ success: true, analysis: created });
}) as RequestHandler);

analysisRouter.get("/history", (req, res) => {
  const captureId =
    typeof req.query.captureId === "string" ? req.query.captureId : undefined;
  const sessionId =
    typeof req.query.sessionId === "string" ? req.query.sessionId : undefined;
  res.json({
    success: true,
    analyses: analysisRepository.list(captureId, sessionId),
  });
});

analysisRouter.get("/:id", (req, res) => {
  const analysis = analysisRepository.get(req.params.id);
  if (!analysis) {
    return res
      .status(404)
      .json({ success: false, error: "Analysis not found" });
  }
  return res.json({ success: true, analysis });
});
