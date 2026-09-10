import { describe, expect, it } from "vitest";
import type { OCRTextBlock, WaitCondition } from "@shared/assistant";
import { WaitObservationTracker } from "./wait-observation";

const base = {
  id: "condition-1",
  label: "Page loaded",
  timeoutMs: 5000,
  pollIntervalMs: 500,
  confidenceThreshold: 0.8,
  approved: true,
} satisfies Omit<WaitCondition, "type">;

const text = (value: string, confidence = 0.92): OCRTextBlock => ({
  id: `text-${value}`,
  text: value,
  confidence,
  region: {
    id: `region-${value}`,
    x: 0.1,
    y: 0.2,
    width: 0.2,
    height: 0.1,
  },
});

describe("wait observation capture mapping", () => {
  it("maps OCR text, regions, and safe control signals", () => {
    const tracker = new WaitObservationTracker();
    const observation = tracker.observe(
      { ...base, type: "close_control" },
      "frame",
      [text("Close"), text("Continue")],
    );

    expect(observation.visibleText).toBe("Close Continue");
    expect(observation.regions).toHaveLength(2);
    expect(observation.controls).toEqual([
      { type: "close", label: "Close", confidence: 0.92 },
      { type: "next", label: "Continue", confidence: 0.92 },
    ]);
  });

  it("only reports page stability after the same frame is observed long enough", () => {
    const tracker = new WaitObservationTracker();
    const condition = {
      ...base,
      type: "page_load_stable",
      stableForMs: 1000,
    } satisfies WaitCondition;

    expect(tracker.observe(condition, "frame-a", [], 1000).pageLoadStable).toBe(
      false,
    );
    expect(tracker.observe(condition, "frame-a", [], 1999).pageLoadStable).toBe(
      false,
    );
    expect(tracker.observe(condition, "frame-a", [], 2000).pageLoadStable).toBe(
      true,
    );
    expect(tracker.observe(condition, "frame-b", [], 3000).pageLoadStable).toBe(
      false,
    );
  });
});
