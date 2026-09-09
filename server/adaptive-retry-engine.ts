/**
 * Adaptive Retry Engine & Dynamic Coordinate Recalibrator
 * Handles post-execution coordinate recalibration when elements shift,
 * and formulates learning-based retry strategies when verification requires adaptation.
 */

import {
  DetectedUIElement,
  ScreenPerceptionReport,
} from "./ai-perception-engine";

export interface StepAttemptRecord {
  stepId: string;
  attemptNumber: number;
  methodUsed: string;
  coordinates: { x: number; y: number };
  timestamp: number;
  outcome: "success" | "failed" | "unverified";
  errorOrDiff?: string;
}

export interface RecalibrationResult {
  recalibrated: boolean;
  elementId?: string;
  elementName?: string;
  oldCoordinates: { x: number; y: number };
  newCoordinates: { x: number; y: number };
  shiftDistance: number;
  reason: string;
}

export interface AdaptiveRetryPlan {
  retryNeeded: boolean;
  attemptNumber: number;
  adaptedActionType:
    | "click"
    | "double_click"
    | "right_click"
    | "clear_and_type"
    | "type_text"
    | "press_key"
    | "hotkey"
    | "scroll"
    | "wait";
  newCoordinates: { x: number; y: number };
  textPayload?: string;
  keyPayload?: string;
  delayMs: number;
  strategyRationale: string;
  previousAttempts: StepAttemptRecord[];
}

export class AdaptiveRetryEngine {
  private attemptHistory: Map<string, StepAttemptRecord[]> = new Map();

  /**
   * Recalibrate coordinates by finding the target element in the new post-action perception report
   */
  recalibrateElementCoordinates(
    targetName: string,
    currentX: number,
    currentY: number,
    newElements: DetectedUIElement[],
  ): RecalibrationResult {
    if (!newElements || newElements.length === 0) {
      return {
        recalibrated: false,
        oldCoordinates: { x: currentX, y: currentY },
        newCoordinates: { x: currentX, y: currentY },
        shiftDistance: 0,
        reason: "No elements detected in new frame",
      };
    }

    const normTarget = (targetName || "").toLowerCase().trim();

    // 1. Try exact name match
    let match = newElements.find(
      (el) =>
        el.name.toLowerCase().includes(normTarget) ||
        normTarget.includes(el.name.toLowerCase()),
    );

    // 2. If no name match, find closest spatial element within 200px
    if (!match) {
      let minDistance = 200;
      for (const el of newElements) {
        const dist = Math.hypot(el.center.x - currentX, el.center.y - currentY);
        if (dist < minDistance) {
          minDistance = dist;
          match = el;
        }
      }
    }

    if (match) {
      const shiftDistance = Math.hypot(
        match.center.x - currentX,
        match.center.y - currentY,
      );
      const isShifted = shiftDistance > 8; // Moved more than 8 pixels

      return {
        recalibrated: isShifted,
        elementId: match.id,
        elementName: match.name,
        oldCoordinates: { x: currentX, y: currentY },
        newCoordinates: { x: match.center.x, y: match.center.y },
        shiftDistance: Math.round(shiftDistance),
        reason: isShifted
          ? `Element "${match.name}" shifted by ${Math.round(shiftDistance)}px`
          : `Position confirmed at (${match.center.x}, ${match.center.y})`,
      };
    }

    return {
      recalibrated: false,
      oldCoordinates: { x: currentX, y: currentY },
      newCoordinates: { x: currentX, y: currentY },
      shiftDistance: 0,
      reason: "Element position maintained",
    };
  }

  /**
   * Formulate an adaptive retry calculation when a step verification fails
   */
  computeAdaptiveRetry(
    stepId: string,
    actionType: string,
    targetName: string,
    currentX: number,
    currentY: number,
    textPayload: string | undefined,
    perception: ScreenPerceptionReport,
  ): AdaptiveRetryPlan {
    const history = this.attemptHistory.get(stepId) || [];
    const attemptNumber = history.length + 1;

    // Record this attempt in history
    const currentRecord: StepAttemptRecord = {
      stepId,
      attemptNumber,
      methodUsed: actionType,
      coordinates: { x: currentX, y: currentY },
      timestamp: Date.now(),
      outcome: "failed",
    };
    history.push(currentRecord);
    this.attemptHistory.set(stepId, history);

    // First, check if the element has shifted in the current perception
    const recal = this.recalibrateElementCoordinates(
      targetName,
      currentX,
      currentY,
      perception.elements,
    );
    let targetX = recal.newCoordinates.x;
    let targetY = recal.newCoordinates.y;
    let adaptedAction: any = actionType;
    let delayMs = 600 + attemptNumber * 200; // Progressively backoff delay
    let strategyRationale = "";

    if (attemptNumber === 1) {
      // Level 1: Offset correction / Spatial center jitter
      if (recal.recalibrated) {
        strategyRationale = `Recalibrated target coordinates to (${targetX}, ${targetY}) after detecting ${recal.shiftDistance}px layout shift.`;
      } else {
        targetX += 5; // Subtle 5px offset
        targetY += 3;
        strategyRationale = `Applied 5px spatial offset correction to re-trigger hover/focus hit-test.`;
      }
    } else if (attemptNumber === 2) {
      // Level 2: Method upgrade
      if (actionType === "click") {
        adaptedAction = "double_click";
        strategyRationale = `Upgraded click method to double_click to activate stubborn input/button.`;
      } else if (actionType === "type_text") {
        adaptedAction = "clear_and_type";
        strategyRationale = `Upgraded text input to clear_and_type to wipe existing content before typing.`;
      } else {
        adaptedAction = "click";
        strategyRationale = `Re-focused element with primary click before key dispatch.`;
      }
    } else if (attemptNumber === 3) {
      // Level 3: Navigation keyboard fallback or clear & type
      if (actionType === "click" || actionType === "double_click") {
        adaptedAction = "press_key";
        strategyRationale = `Switching to keyboard navigation fallback (Enter key) to commit active element.`;
      } else {
        adaptedAction = "clear_and_type";
        delayMs = 1200;
        strategyRationale = `Performing deep clear_and_type with 1200ms stabilization delay.`;
      }
    } else {
      // Level 4: Ground to primary Qwen suggestion focus point
      targetX = perception.feedbackPosition.x || 960;
      targetY = perception.feedbackPosition.y || 540;
      adaptedAction = "click";
      strategyRationale = `Re-grounding target directly to AI Vision feedback focal point at (${targetX}, ${targetY}).`;
    }

    return {
      retryNeeded: attemptNumber <= 4,
      attemptNumber,
      adaptedActionType: adaptedAction,
      newCoordinates: { x: targetX, y: targetY },
      textPayload,
      delayMs,
      strategyRationale,
      previousAttempts: [...history],
    };
  }

  recordSuccess(stepId: string) {
    const history = this.attemptHistory.get(stepId) || [];
    if (history.length > 0) {
      history[history.length - 1].outcome = "success";
    }
  }

  clearHistory(stepId?: string) {
    if (stepId) {
      this.attemptHistory.delete(stepId);
    } else {
      this.attemptHistory.clear();
    }
  }
}

export const adaptiveRetryEngine = new AdaptiveRetryEngine();
