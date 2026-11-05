import { describe, expect, it } from "vitest";
import { AIPlannerActorEngine, type SubTask } from "./ai-planner-engine";

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
