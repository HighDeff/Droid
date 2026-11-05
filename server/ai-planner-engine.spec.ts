import { describe, expect, it } from "vitest";
import {
  AIPlannerActorEngine,
  type SubTask,
} from "./ai-planner-engine";
import type {
  DetectedUIElement,
  ScreenPerceptionReport,
} from "./ai-perception-engine";

const element = (
  name: string,
  center: { x: number; y: number },
  overrides: Partial<DetectedUIElement> = {},
): DetectedUIElement => ({
  id: `el_${name}`,
  name,
  type: "button",
  boundingBox: { x: center.x - 20, y: center.y - 10, width: 40, height: 20 },
  center,
  confidence: 0.9,
  interactive: true,
  ...overrides,
});

const perception = (
  elements: DetectedUIElement[],
  overrides: Partial<ScreenPerceptionReport> = {},
): ScreenPerceptionReport => ({
  timestamp: Date.now(),
  screenDescription: "A login form with a submit button",
  activeWindow: "Browser",
  visualStateChange: "none",
  elements,
  feedbackPosition: { x: 100, y: 100 },
  primarySuggestion: "Click Submit",
  confidence: 0.9,
  ...overrides,
});

const action = (title: string): SubTask =>
  ({
    id: `sub_${title}`,
    title,
    actionType: "click",
    status: "completed",
  }) as SubTask;

describe("AIPlannerActorEngine abandonment tracking", () => {
  it("does not abandon before the idle-cycle threshold", () => {
    const engine = new AIPlannerActorEngine();
    engine.recordOutcome(action("a"), true, false, "unverified");
    engine.recordOutcome(action("b"), false, false, "failed");
    const verdict = engine.checkAbandonment(3);
    expect(verdict.abandoned).toBe(false);
    expect(verdict.idleCycles).toBe(2);
  });

  it("abandons after maxIdleCycles outcomes with no verified progress", () => {
    const engine = new AIPlannerActorEngine();
    for (let i = 0; i < 3; i += 1) {
      engine.recordOutcome(action(`s${i}`), true, false, "no change seen");
    }
    const verdict = engine.checkAbandonment(3);
    expect(verdict.abandoned).toBe(true);
    expect(verdict.idleCycles).toBe(3);
    expect(verdict.wrapUpSummary).toContain("no verified progress");
  });

  it("verified progress since the last user activity prevents abandonment", () => {
    const engine = new AIPlannerActorEngine();
    engine.recordOutcome(action("a"), true, false, "");
    engine.recordOutcome(action("b"), true, true, "Verified: screen changed");
    engine.recordOutcome(action("c"), false, false, "");
    engine.recordOutcome(action("d"), false, false, "");
    expect(engine.checkAbandonment(3).abandoned).toBe(false);
  });

  it("noteUserActivity resets the idle counters", () => {
    const engine = new AIPlannerActorEngine();
    for (let i = 0; i < 4; i += 1) {
      engine.recordOutcome(action(`s${i}`), false, false, "");
    }
    expect(engine.checkAbandonment(3).abandoned).toBe(true);
    engine.noteUserActivity();
    const verdict = engine.checkAbandonment(3);
    expect(verdict.abandoned).toBe(false);
    expect(verdict.idleCycles).toBe(0);
  });

  it("an unsuccessful-but-verified outcome is not progress", () => {
    const engine = new AIPlannerActorEngine();
    for (let i = 0; i < 3; i += 1) {
      engine.recordOutcome(action(`s${i}`), false, true, "verified failure");
    }
    expect(engine.checkAbandonment(3).abandoned).toBe(true);
  });
});

describe("AIPlannerActorEngine purpose inference and step synthesis", () => {
  it("infers a purpose naming the primary interactive element", () => {
    const engine = new AIPlannerActorEngine();
    const purpose = engine.inferPurpose(
      perception([element("Submit", { x: 300, y: 200 })]),
      { appTab: "browser" },
    );
    expect(purpose.summary).toContain("Submit");
    expect(purpose.confidence).toBeGreaterThan(0);
    expect(purpose.basis.join(" ")).toContain("Submit");
  });

  it("reports zero confidence for degraded perception", () => {
    const engine = new AIPlannerActorEngine();
    const purpose = engine.inferPurpose(perception([], { degraded: true }));
    expect(purpose.confidence).toBe(0);
  });

  it("synthesizes click steps at element centers and never invents typing", () => {
    const engine = new AIPlannerActorEngine();
    const report = perception([
      element("Submit", { x: 300, y: 200 }),
      element("Username", { x: 300, y: 120 }, { type: "input" }),
      element("Ad banner", { x: 10, y: 10 }, { interactive: false }),
    ]);
    const steps = engine.synthesizeSteps(report, engine.inferPurpose(report));
    expect(steps).toHaveLength(2);
    expect(steps.every((s) => s.actionType === "click")).toBe(true);
    expect(steps.map((s) => [s.x, s.y])).toContainEqual([300, 200]);
  });

  it("returns a single wait step when the screen is not readable", () => {
    const engine = new AIPlannerActorEngine();
    const report = perception([], { degraded: true });
    const steps = engine.synthesizeSteps(report, engine.inferPurpose(report));
    expect(steps).toHaveLength(1);
    expect(steps[0].actionType).toBe("wait");
  });
});

describe("AIPlannerActorEngine refineStepsWithFreshPerception", () => {
  const clickStep = (overrides: Partial<SubTask> = {}): SubTask => ({
    id: "step_1",
    title: "Click Submit",
    actionType: "click",
    targetName: "Submit",
    x: 100,
    y: 100,
    delayMs: 400,
    status: "pending",
    ...overrides,
  });

  it("re-grounds a moved target to its fresh center", () => {
    const engine = new AIPlannerActorEngine();
    const { refined, report } = engine.refineStepsWithFreshPerception(
      [clickStep()],
      perception([element("Submit", { x: 340, y: 260 })]),
    );
    expect(refined).toHaveLength(1);
    expect(refined[0].x).toBe(340);
    expect(refined[0].y).toBe(260);
    expect(report[0].status).toBe("regrounded");
  });

  it("keeps original coordinates when the target cannot be identified", () => {
    const engine = new AIPlannerActorEngine();
    const { refined, report } = engine.refineStepsWithFreshPerception(
      [clickStep()],
      perception([element("Something Else", { x: 5, y: 5 })]),
    );
    expect(refined).toHaveLength(1);
    expect(refined[0].x).toBe(100);
    expect(report[0].status).toBe("kept");
  });

  it("drops a coordinate-less step whose target vanished", () => {
    const engine = new AIPlannerActorEngine();
    const { refined, report } = engine.refineStepsWithFreshPerception(
      [clickStep({ x: undefined, y: undefined })],
      perception([element("Something Else", { x: 5, y: 5 })]),
    );
    expect(refined).toHaveLength(0);
    expect(report[0].status).toBe("dropped");
  });

  it("keeps non-click steps verbatim and everything under degraded perception", () => {
    const engine = new AIPlannerActorEngine();
    const wait = clickStep({ id: "w", actionType: "wait", x: undefined, y: undefined });
    const okRun = engine.refineStepsWithFreshPerception(
      [wait],
      perception([element("Submit", { x: 1, y: 1 })]),
    );
    expect(okRun.refined[0]).toBe(wait);
    expect(okRun.report[0].status).toBe("kept");
    const degraded = engine.refineStepsWithFreshPerception(
      [clickStep({ x: undefined, y: undefined })],
      perception([], { degraded: true }),
    );
    expect(degraded.refined).toHaveLength(1);
    expect(degraded.report[0].status).toBe("kept");
  });
});
