import type {
  WaitCondition,
  WaitConditionObservation,
  WaitConditionStatus,
} from "@shared/assistant";

export const MAX_WAIT_TIMEOUT_MS = 120_000;
export const MIN_POLL_INTERVAL_MS = 100;
export const MAX_POLL_INTERVAL_MS = 10_000;

export interface WaitConditionEvaluation {
  status: WaitConditionStatus;
  message: string;
  suggestion?: string;
  confidence?: number;
}

export function normalizeWaitCondition(
  condition: WaitCondition,
): WaitCondition {
  return {
    ...condition,
    timeoutMs: Math.min(Math.max(condition.timeoutMs, 1), MAX_WAIT_TIMEOUT_MS),
    pollIntervalMs: Math.min(
      Math.max(condition.pollIntervalMs, MIN_POLL_INTERVAL_MS),
      MAX_POLL_INTERVAL_MS,
    ),
    confidenceThreshold: Math.min(
      Math.max(condition.confidenceThreshold, 0),
      1,
    ),
  };
}

export function evaluateWaitCondition(
  condition: WaitCondition,
  observation: WaitConditionObservation,
  elapsedMs: number,
): WaitConditionEvaluation {
  const normalized = normalizeWaitCondition(condition);
  if (!normalized.approved) {
    return {
      status: "blocked",
      message: "Condition is awaiting explicit plan approval.",
      suggestion:
        "Review the condition and approve the exact plan before continuing.",
    };
  }

  let met = false;
  let confidence: number | undefined;
  switch (normalized.type) {
    case "visible_text": {
      const haystack = observation.visibleText ?? "";
      const needle = normalized.caseSensitive
        ? normalized.text
        : normalized.text.toLocaleLowerCase();
      const source = normalized.caseSensitive
        ? haystack
        : haystack.toLocaleLowerCase();
      met = source.includes(needle);
      break;
    }
    case "region":
      met = (observation.regions ?? []).some(
        (region) =>
          region.x <= normalized.region.x &&
          region.y <= normalized.region.y &&
          region.x + region.width >=
            normalized.region.x + normalized.region.width &&
          region.y + region.height >=
            normalized.region.y + normalized.region.height &&
          (region.confidence ?? 1) >= normalized.confidenceThreshold,
      );
      break;
    case "close_control":
    case "next_control": {
      const controlType =
        normalized.type === "close_control" ? "close" : "next";
      const match = (observation.controls ?? []).find(
        (control) =>
          control.type === controlType &&
          (!normalized.controlLabel ||
            control.label?.toLocaleLowerCase() ===
              normalized.controlLabel.toLocaleLowerCase()),
      );
      confidence = match?.confidence;
      met = Boolean(
        match && match.confidence >= normalized.confidenceThreshold,
      );
      break;
    }
    case "timer":
      met = (observation.timerElapsedMs ?? elapsedMs) >= normalized.durationMs;
      break;
    case "page_load_stable":
      met = observation.pageLoadStable === true;
      break;
  }

  if (met) {
    return {
      status: "met",
      message: `${normalized.label} is satisfied.`,
      confidence,
    };
  }
  if (elapsedMs >= normalized.timeoutMs) {
    return {
      status: "timed_out",
      message: `${normalized.label} timed out after ${normalized.timeoutMs}ms.`,
      suggestion:
        "Capture a fresh observation, increase the bounded timeout deliberately, or revise the condition.",
      confidence,
    };
  }
  return {
    status: "pending",
    message: `Waiting for ${normalized.label}.`,
    suggestion:
      "Keep the plan paused until the required observation is available.",
    confidence,
  };
}
