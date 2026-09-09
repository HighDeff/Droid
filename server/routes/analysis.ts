import { RequestHandler, Router } from "express";
import { z } from "zod";
import type { FrameAnalysis, RegionOfInterest } from "@shared/assistant";
import { analysisRepository } from "../analysis-state";
import { recognizeWithProviders } from "../ocr-provider";

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

analysisRouter.post("/", (async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid analysis request",
      issues: parsed.error.issues,
    });
  }

  const { captureId, sessionId, imageRef, imageData, source } = parsed.data;
  const ocr = await recognizeWithProviders({ imageData, imageRef });
  const hasOcr = Boolean(ocr.result);
  const analysis: Omit<FrameAnalysis, "id"> = {
    captureId,
    sessionId,
    source: source ?? (imageRef ? "image-reference" : "captured-image"),
    status: hasOcr ? "completed" : "fallback",
    provider: ocr.result?.provider ?? "deterministic-fallback",
    confidence: ocr.result?.confidence ?? 0,
    ocrText: ocr.result?.text ?? [],
    detectedElements: [],
    regionsOfInterest: ocr.result?.regions.length
      ? ocr.result.regions
      : [fullFrameRegion()],
    notes: [
      hasOcr
        ? `OCR completed with ${ocr.result?.provider}.`
        : "No configured OCR provider was available; deterministic fallback was used.",
      ...ocr.errors.map((error) => `OCR provider unavailable: ${error}`),
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
