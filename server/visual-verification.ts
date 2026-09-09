import type {
  DetectedUIElement,
  ExecutionEvidence,
  FrameAnalysis,
  RegionOfInterest,
  StepVerification,
} from "@shared/assistant";

export interface Observation {
  capture?: {
    captureId?: string;
    sessionId?: string;
    imageRef?: string;
    imageData?: string;
  };
  analysis?: FrameAnalysis;
}

const intersects = (a: RegionOfInterest, b: RegionOfInterest) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

export function verifyObservation(
  verification: StepVerification,
  observation: Observation,
): ExecutionEvidence["verification"] {
  const analysis = observation.analysis;
  if (!analysis || analysis.status !== "completed") {
    return {
      status: "uncertain",
      reason:
        "Fresh analysis is unavailable or did not complete; approval is required.",
      confidence: analysis?.confidence,
    };
  }

  const confidence = analysis.confidence;
  if (verification.kind === "confidence-threshold") {
    const minimum = verification.minConfidence ?? 1;
    return confidence >= minimum
      ? {
          status: "passed",
          reason: `Analysis confidence ${confidence.toFixed(2)} meets the ${minimum.toFixed(2)} threshold.`,
          confidence,
        }
      : {
          status: "uncertain",
          reason: `Analysis confidence ${confidence.toFixed(2)} is below the ${minimum.toFixed(2)} threshold.`,
          confidence,
        };
  }

  if (verification.kind === "text-present") {
    const expected = verification.text?.trim().toLowerCase();
    if (!expected) {
      return {
        status: "uncertain",
        reason: "Text verification has no expected text.",
      };
    }
    const found = analysis.ocrText.some((block) =>
      block.text.toLowerCase().includes(expected),
    );
    return found
      ? {
          status: "passed",
          reason: `Expected text “${verification.text}” was found.`,
          confidence,
        }
      : {
          status: "failed",
          reason: `Expected text “${verification.text}” was not found.`,
          confidence,
        };
  }

  if (verification.kind === "element-present") {
    const expected = verification.elementLabel?.trim().toLowerCase();
    if (!expected) {
      return {
        status: "uncertain",
        reason: "Element verification has no expected label.",
      };
    }
    const found = analysis.detectedElements.some((element) =>
      (element.label ?? "").toLowerCase().includes(expected),
    );
    return found
      ? {
          status: "passed",
          reason: `Expected element “${verification.elementLabel}” was found.`,
          confidence,
        }
      : {
          status: "failed",
          reason: `Expected element “${verification.elementLabel}” was not found.`,
          confidence,
        };
  }

  const region = verification.region;
  if (!region) {
    return {
      status: "uncertain",
      reason: "Region verification has no target region.",
    };
  }
  const found = analysis.detectedElements.some(
    (element: DetectedUIElement) =>
      element.region && intersects(element.region, region),
  );
  return found
    ? {
        status: "passed",
        reason: "A detected UI element intersects the target region.",
        confidence,
      }
    : {
        status: "failed",
        reason: "No detected UI element intersects the target region.",
        confidence,
      };
}
