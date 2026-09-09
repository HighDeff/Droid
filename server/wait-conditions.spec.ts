import { describe, expect, it } from "vitest";
import type { WaitCondition } from "@shared/assistant";
import {
  evaluateWaitCondition,
  normalizeWaitCondition,
} from "./wait-conditions";

const condition = (patch: Partial<WaitCondition> = {}): WaitCondition =>
  ({
    id: "condition-1",
    type: "visible_text",
    label: "Ready text",
    text: "Ready",
    timeoutMs: 1000,
    pollIntervalMs: 500,
    confidenceThreshold: 0.8,
    approved: true,
    ...patch,
  }) as WaitCondition;

describe("wait conditions", () => {
  it("moves from pending to met when visible text appears", () => {
    expect(evaluateWaitCondition(condition(), {}, 100).status).toBe("pending");
    expect(
      evaluateWaitCondition(condition(), { visibleText: "System Ready" }, 100)
        .status,
    ).toBe("met");
  });

  it("blocks unapproved conditions and times out with guidance", () => {
    expect(
      evaluateWaitCondition(condition({ approved: false }), {}, 100).status,
    ).toBe("blocked");
    const result = evaluateWaitCondition(condition(), {}, 1000);
    expect(result.status).toBe("timed_out");
    expect(result.suggestion).toContain("fresh observation");
  });

  it("requires confidence thresholds for control observations", () => {
    const next = condition({
      type: "next_control",
      controlLabel: "Next",
    });
    expect(
      evaluateWaitCondition(
        next,
        { controls: [{ type: "next", label: "Next", confidence: 0.7 }] },
        50,
      ).status,
    ).toBe("pending");
    expect(
      evaluateWaitCondition(
        next,
        { controls: [{ type: "next", label: "Next", confidence: 0.9 }] },
        50,
      ).status,
    ).toBe("met");
  });

  it("clamps timeout and polling bounds", () => {
    const normalized = normalizeWaitCondition(
      condition({ timeoutMs: 999999, pollIntervalMs: 1 }),
    );
    expect(normalized.timeoutMs).toBe(120000);
    expect(normalized.pollIntervalMs).toBe(100);
  });
});
