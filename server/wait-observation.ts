import { createHash } from "crypto";
import type {
  OCRTextBlock,
  WaitCondition,
  WaitConditionObservation,
} from "@shared/assistant";
import { captureDesktopFrame } from "./routes/screen-capture";
import { recognizeWithProviders } from "./ocr-provider";

type StabilityState = {
  fingerprint: string;
  stableSince: number;
};

const stability = new Map<string, StabilityState>();

const fingerprint = (imageData: string) =>
  createHash("sha256").update(imageData).digest("hex");

function controlsFromText(text: OCRTextBlock[]) {
  return text.flatMap((block) => {
    const value = block.text.trim();
    const normalized = value.toLocaleLowerCase();
    const type =
      /^(close|dismiss|cancel|skip|no thanks|×)$/i.test(value) ||
      normalized.includes("close") ||
      normalized.includes("dismiss")
        ? "close"
        : /^(next|continue|proceed|submit|done)$/i.test(value) ||
            normalized.includes("next") ||
            normalized.includes("continue")
          ? "next"
          : undefined;
    return type
      ? [
          {
            type: type as "close" | "next",
            label: value,
            confidence: block.confidence,
          },
        ]
      : [];
  });
}

export class WaitObservationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WaitObservationError";
  }
}

export class WaitObservationTracker {
  observe(
    condition: WaitCondition,
    imageData: string,
    text: OCRTextBlock[],
    now = Date.now(),
  ): WaitConditionObservation {
    const observation: WaitConditionObservation = {
      visibleText: text.map((block) => block.text).join(" "),
      regions: text.flatMap((block) => (block.region ? [block.region] : [])),
      controls: controlsFromText(text),
    };

    if (condition.type === "page_load_stable") {
      const currentFingerprint = fingerprint(imageData);
      const previous = stability.get(condition.id);
      const stableSince =
        previous?.fingerprint === currentFingerprint
          ? previous.stableSince
          : now;
      stability.set(condition.id, {
        fingerprint: currentFingerprint,
        stableSince,
      });
      observation.pageLoadStable = now - stableSince >= condition.stableForMs;
    }

    return observation;
  }

  reset(conditionId?: string) {
    if (conditionId) stability.delete(conditionId);
    else stability.clear();
  }
}

export const waitObservationTracker = new WaitObservationTracker();

export async function captureWaitObservation(
  condition: WaitCondition,
  startedAt: number,
): Promise<{
  observation: WaitConditionObservation;
  ocrProvider: string;
  ocrErrors: string[];
}> {
  const frame = await captureDesktopFrame();
  if (!frame.success || !frame.imageData) {
    throw new WaitObservationError(
      frame.error ?? "Fresh screen capture was unavailable",
    );
  }
  const ocr = await recognizeWithProviders({ imageData: frame.imageData });
  if (!ocr.result) {
    throw new WaitObservationError(
      `Fresh OCR analysis was unavailable${ocr.errors.length ? `: ${ocr.errors.join("; ")}` : ""}`,
    );
  }
  const observation = waitObservationTracker.observe(
    condition,
    frame.imageData,
    ocr.result.text,
  );
  if (condition.type === "timer") {
    observation.timerElapsedMs = Date.now() - startedAt;
  }
  return {
    observation,
    ocrProvider: ocr.result.provider,
    ocrErrors: ocr.errors,
  };
}
