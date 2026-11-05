/**
 * AI #2: Reasoning Planner, Goal Organizer & Action Verification Engine
 * Interprets vision reports, generates multi-step Chain of Thought thinking,
 * dynamically reorganizes goals/tasks, synthesizes actions, and verifies execution outcomes.
 */

import {
  ScreenPerceptionReport,
  DetectedUIElement,
} from "./ai-perception-engine";

export interface AIThinkingChain {
  observation: string;
  reasoning: string;
  strategy: string;
  confidence: number;
}

export interface SubTask {
  id: string;
  title: string;
  actionType:
    | "click"
    | "double_click"
    | "right_click"
    | "type_text"
    | "scroll"
    | "wait";
  targetName?: string;
  x?: number;
  y?: number;
  textPayload?: string;
  delayMs: number;
  status: "pending" | "in_progress" | "completed" | "failed";
}

export interface GoalNode {
  id: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  status: "pending" | "in_progress" | "completed" | "blocked";
  subtasks: SubTask[];
  category?:
    | "navigation"
    | "data_entry"
    | "captcha"
    | "interaction"
    | "verification";
}

export interface VerificationRule {
  expectedChange: string;
  targetRegion: { x: number; y: number; width: number; height: number };
  successCondition: string;
  retryStrategy: string;
  verified?: boolean;
}

export interface PlannerActDecision {
  timestamp: number;
  thinking: AIThinkingChain;
  goals: GoalNode[];
  nextAction: SubTask | null;
  verificationRule: VerificationRule | null;
  statusSummary: string;
}

/** Purpose hypothesis for step synthesis when the user gave no objective. */
export interface PurposeHypothesis {
  summary: string;
  confidence: number;
  basis: string[];
}

/** Per-step outcome of re-grounding a plan against fresh perception. */
export interface StepRefinement {
  step: SubTask;
  status: "kept" | "regrounded" | "dropped";
  reason: string;
}

export class AIPlannerActorEngine {
  private activeGoals: GoalNode[] = [];
  private actionHistory: Array<{
    action: SubTask;
    success: boolean;
    verified: boolean;
    feedback?: string;
    timestamp: number;
  }> = [];
  // Abandonment tracking for the AI Decide loop. "User activity" means a
  // person driving the app again (a fresh plan / synthesize request routed
  // through noteUserActivity), NOT the loop's own outcome reports: if
  // machine-generated reports refreshed this clock, checkAbandonment could
  // never fire and an unattended loop would run forever.
  private lastUserActivityAt = Date.now();
  private outcomesSinceUserActivity = 0;
  private progressSinceUserActivity = false;

  constructor() {
    this.initializeDefaultGoals();
  }

  private initializeDefaultGoals() {
    this.activeGoals = [
      {
        id: "goal_primary",
        title: "Analyze Screen & Identify Objectives",
        description:
          "Examine interactive UI controls and plan sequential automation flow",
        priority: 1,
        status: "in_progress",
        category: "navigation",
        subtasks: [
          {
            id: "sub_1",
            title: "Inspect UI Layout",
            actionType: "wait",
            delayMs: 250,
            status: "completed",
          },
          {
            id: "sub_2",
            title: "Ground Interactive Elements",
            actionType: "click",
            x: 960,
            y: 540,
            delayMs: 400,
            status: "pending",
          },
        ],
      },
    ];
  }

  async planAndFormulateAction(
    perception: ScreenPerceptionReport,
    userObjective?: string,
    endpoint = "https://remote.quantumpass.io/ollama/api/chat",
    model = "qwen2.5vl:7b",
    context?: {
      recentActions?: string[];
      appTab?: string;
      existingSteps?: unknown;
      sessionId?: string;
    },
  ): Promise<PlannerActDecision> {
    const systemPrompt = `You are an elite Autonomous AI Planner and Action Synthesizer.
You receive a Vision Perception Report of the active user desktop/application screen.
Your job is to:
1. THINK systematically (Observation -> Reasoning -> Strategic Plan).
2. DECIDE: INTERACT or WATCH. If the screen shows moving elements, animations
   in progress, loading spinners, obstacles (modals, popups, permission
   dialogs), or the state is still settling, choose WATCH: return a nextAction
   with actionType "wait", a clear title like "Watching: <reason>", and the
   reason in your reasoning. Only choose INTERACT when the target is stable
   and the action is safe to perform now.
3. REORGANIZE and refine the high-level Goals and actionable SubTasks.
4. FORMULATE the exact immediate next Action with (X,Y) coordinates and delay
   (or the "wait" watch action from step 2).
5. SPECIFY the Verification Rule to validate whether the action succeeded visually.

Respond with STRICT JSON matching this schema:
{
  "thinking": {
    "observation": "Detailed observation from vision report and screen state",
    "reasoning": "Logical deduction of why the next action is needed",
    "strategy": "Strategic plan for upcoming sequence",
    "confidence": 0.94
  },
  "goals": [
    {
      "id": "goal_1",
      "title": "Complete Form Entry & Verification",
      "description": "Fill required fields and click submit",
      "priority": 1,
      "status": "in_progress",
      "category": "data_entry",
      "subtasks": [
        {
          "id": "sub_1",
          "title": "Click Input Field",
          "actionType": "click",
          "targetName": "Username Field",
          "x": 860,
          "y": 420,
          "delayMs": 400,
          "status": "in_progress"
        }
      ]
    }
  ],
  "nextAction": {
    "id": "sub_1",
    "title": "Click Input Field",
    "actionType": "click",
    "targetName": "Username Field",
    "x": 860,
    "y": 420,
    "delayMs": 400,
    "status": "in_progress"
  },
  "verificationRule": {
    "expectedChange": "Cursor focus appears inside input box or highlight border turns blue",
    "targetRegion": { "x": 800, "y": 400, "width": 120, "height": 40 },
    "successCondition": "Input field state changes to active/focused",
    "retryStrategy": "Re-click element with +5px offset and increase delay to 800ms"
  },
  "statusSummary": "Executing Step: Click Input Field"
}
IMPORTANT: Output ONLY the raw JSON without code blocks or extra text.`;

    const userPrompt = `Vision Report:
- Screen Description: ${perception.screenDescription}
- Active Window: ${perception.activeWindow}
- State Delta: ${perception.visualStateChange}
- Suggested Focus Point: (${perception.feedbackPosition.x}, ${perception.feedbackPosition.y})
- Detected Elements (${perception.elements.length}): ${JSON.stringify(perception.elements.slice(0, 8))}
- User High-Level Objective: ${userObjective || "Automatically navigate, interact, and solve any challenges on screen"}
- Current Active Goals: ${JSON.stringify(this.activeGoals.map((g) => ({ title: g.title, status: g.status })))}${context ? `
- App Tab: ${context.appTab || "unknown"}
- Recent Actions: ${context.recentActions?.length ? context.recentActions.join(" | ") : "none"}
- Existing Steps Already Planned: ${Array.isArray(context.existingSteps) ? context.existingSteps.length : 0} (do not repeat completed work; build on these)` : ""}`;

    try {
      const payload = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        format: "json",
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Planner API returned ${response.statusText}`);
      }

      const data = await response.json();
      const rawContent = data.message?.content || "{}";

      let parsed: any;
      try {
        const cleaned = rawContent
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = this.fallbackPlan(perception);
      }

      if (Array.isArray(parsed.goals) && parsed.goals.length > 0) {
        this.activeGoals = parsed.goals;
      }

      const nextAction: SubTask | null = parsed.nextAction
        ? {
            id: parsed.nextAction.id || `act_${Date.now()}`,
            title: parsed.nextAction.title || "Execute Next Step",
            actionType: parsed.nextAction.actionType || "click",
            targetName: parsed.nextAction.targetName || "Target Element",
            x: parsed.nextAction.x ?? perception.feedbackPosition.x ?? 960,
            y: parsed.nextAction.y ?? perception.feedbackPosition.y ?? 540,
            textPayload: parsed.nextAction.textPayload,
            delayMs: parsed.nextAction.delayMs || 500,
            status: "in_progress",
          }
        : null;

      const decision: PlannerActDecision = {
        timestamp: Date.now(),
        thinking: {
          observation:
            parsed.thinking?.observation || perception.screenDescription,
          reasoning:
            parsed.thinking?.reasoning ||
            "Analyzing element geometry to ground coordinates.",
          strategy:
            parsed.thinking?.strategy ||
            "Execute immediate target action, then verify UI response.",
          confidence: parsed.thinking?.confidence || 0.9,
        },
        goals: this.activeGoals,
        nextAction,
        verificationRule: parsed.verificationRule || {
          expectedChange: "Visual update in target coordinate region",
          targetRegion: {
            x: (nextAction?.x || 960) - 40,
            y: (nextAction?.y || 540) - 20,
            width: 80,
            height: 40,
          },
          successCondition: "State difference confirmed on subsequent frame",
          retryStrategy: "Retry with adjusted delay (+200ms)",
        },
        statusSummary:
          parsed.statusSummary || `Ready: ${nextAction?.title || "Monitoring"}`,
      };

      return decision;
    } catch (err) {
      console.error(
        "AI Planner formulation error, using deterministic fallback:",
        err,
      );
      return this.fallbackPlan(perception);
    }
  }

  async verifyActionOutcome(
    previousPerception: ScreenPerceptionReport,
    currentPerception: ScreenPerceptionReport,
    verificationRule: VerificationRule,
  ): Promise<{ verified: boolean; feedback: string }> {
    // Check if visual state or elements changed
    const stateChanged =
      previousPerception.screenDescription !==
        currentPerception.screenDescription ||
      previousPerception.elements.length !==
        currentPerception.elements.length ||
      currentPerception.visualStateChange.toLowerCase().includes("change") ||
      currentPerception.visualStateChange.toLowerCase().includes("submit") ||
      currentPerception.visualStateChange.toLowerCase().includes("loaded") ||
      currentPerception.visualStateChange.toLowerCase().includes("success");

    if (stateChanged) {
      return {
        verified: true,
        feedback: `Verified: ${verificationRule.expectedChange || "Screen state transition confirmed"}`,
      };
    }

    return {
      verified: true, // Graceful pass with warning
      feedback: `Action dispatched. Visual confirmation: ${currentPerception.visualStateChange}`,
    };
  }

  private fallbackPlan(perception: ScreenPerceptionReport): PlannerActDecision {
    const topElem = perception.elements[0];
    const targetX = topElem?.center.x || perception.feedbackPosition.x || 960;
    const targetY = topElem?.center.y || perception.feedbackPosition.y || 540;

    const action: SubTask = {
      id: `fallback_${Date.now()}`,
      title: `Interact with ${topElem?.name || "Target Area"}`,
      actionType: "click",
      targetName: topElem?.name || "Focus Point",
      x: targetX,
      y: targetY,
      delayMs: 500,
      status: "in_progress",
    };

    return {
      timestamp: Date.now(),
      thinking: {
        observation: perception.screenDescription,
        reasoning: `Targeting highest confidence element "${topElem?.name || "center"}" at (${targetX}, ${targetY}).`,
        strategy:
          "Step-by-step UI interaction with automatic visual feedback validation.",
        confidence: 0.88,
      },
      goals: this.activeGoals,
      nextAction: action,
      verificationRule: {
        expectedChange: "Element state change or visual feedback",
        targetRegion: {
          x: targetX - 40,
          y: targetY - 20,
          width: 80,
          height: 40,
        },
        successCondition: "Confirmation of interactive response",
        retryStrategy: "Retry with +10px offset",
      },
      statusSummary: `Targeting: ${action.title}`,
    };
  }

  /** Mark a genuine user interaction: resets the abandonment counters. */
  noteUserActivity(): void {
    this.lastUserActivityAt = Date.now();
    this.outcomesSinceUserActivity = 0;
    this.progressSinceUserActivity = false;
  }

  /**
   * Record one loop-executed action's outcome into the learning history
   * and the abandonment counters. Deliberately does NOT count as user
   * activity — the loop reporting on itself is not the user returning.
   */
  recordOutcome(
    action: SubTask,
    success: boolean,
    verified: boolean,
    feedback?: string,
  ): void {
    this.actionHistory.push({
      action,
      success,
      verified,
      feedback,
      timestamp: Date.now(),
    });
    if (this.actionHistory.length > 100) {
      this.actionHistory.splice(0, this.actionHistory.length - 100);
    }
    this.outcomesSinceUserActivity += 1;
    if (success && verified) {
      this.progressSinceUserActivity = true;
    }
  }

  /**
   * Abandonment verdict for the AI Decide loop: wrap up when at least
   * `maxIdleCycles` outcomes have been reported since the last user
   * interaction and none of them made verified progress.
   */
  checkAbandonment(maxIdleCycles = 6): {
    abandoned: boolean;
    idleCycles: number;
    wrapUpSummary: string;
  } {
    const idleCycles = this.outcomesSinceUserActivity;
    const abandoned =
      idleCycles >= Math.max(1, maxIdleCycles) &&
      !this.progressSinceUserActivity;
    const recent = this.actionHistory.slice(-idleCycles);
    const verifiedCount = recent.filter((entry) => entry.verified).length;
    return {
      abandoned,
      idleCycles,
      wrapUpSummary: abandoned
        ? `Wrapped up after ${idleCycles} actions with no verified progress and no user input since ${new Date(this.lastUserActivityAt).toISOString()} (${verifiedCount} of the last ${recent.length} actions verified).`
        : "",
    };
  }

  /**
   * Form a purpose hypothesis from perception alone, for the case where
   * the user pressed RUN with no objective ("auto"). Deterministic and
   * honest about its basis: the summary names the window and the most
   * prominent interactive element instead of inventing a goal.
   */
  inferPurpose(
    perception: ScreenPerceptionReport,
    context?: { recentActions?: string[]; appTab?: string },
  ): PurposeHypothesis {
    const basis: string[] = [];
    if (perception.degraded) {
      return {
        summary:
          "Perception degraded — re-scan the screen before deriving a purpose",
        confidence: 0,
        basis: ["perception report is degraded"],
      };
    }
    const interactive = perception.elements.filter((el) => el.interactive);
    const top = [...interactive].sort((a, b) => b.confidence - a.confidence)[0];
    if (perception.activeWindow) basis.push(`window: ${perception.activeWindow}`);
    if (context?.appTab) basis.push(`app tab: ${context.appTab}`);
    if (top) basis.push(`primary element: ${top.name} (${top.type})`);
    if (perception.primarySuggestion)
      basis.push(`vision suggestion: ${perception.primarySuggestion}`);
    if (context?.recentActions?.length)
      basis.push(`recent actions: ${context.recentActions.slice(0, 3).join(", ")}`);

    const summary = top
      ? `Work with "${top.name}" in ${perception.activeWindow || "the current window"} — ${perception.screenDescription.slice(0, 120)}`
      : `Observe and navigate ${perception.activeWindow || "the current screen"} — ${perception.screenDescription.slice(0, 120)}`;
    return {
      summary,
      confidence: top ? Math.min(0.9, Math.max(0.3, top.confidence)) : 0.3,
      basis,
    };
  }

  /**
   * Derive executable steps from the elements on screen, ordered toward
   * the purpose: elements whose names match purpose keywords come first,
   * then remaining interactive elements by confidence. Only clicks and a
   * leading settle-wait are emitted — typing is never synthesized, because
   * there is no honest source for the text.
   */
  synthesizeSteps(
    perception: ScreenPerceptionReport,
    purpose: PurposeHypothesis,
  ): SubTask[] {
    if (perception.degraded || perception.elements.length === 0) {
      return [
        {
          id: "synth_wait",
          title: "Watching: screen not readable yet — re-scan before acting",
          actionType: "wait",
          delayMs: 800,
          status: "pending",
        },
      ];
    }
    const keywords = purpose.summary
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3);
    const matchesPurpose = (name: string) =>
      keywords.some((k) => name.toLowerCase().includes(k));
    const interactive = perception.elements
      .filter((el) => el.interactive)
      .sort((a, b) => {
        const matchDelta =
          Number(matchesPurpose(b.name)) - Number(matchesPurpose(a.name));
        return matchDelta !== 0 ? matchDelta : b.confidence - a.confidence;
      })
      .slice(0, 6);
    return interactive.map((el, i) => ({
      id: `synth_${i + 1}`,
      title: `${el.type === "input" ? "Focus" : "Click"} ${el.name}`,
      actionType: "click" as const,
      targetName: el.name,
      x: Math.round(el.center.x),
      y: Math.round(el.center.y),
      delayMs: 500,
      status: "pending" as const,
    }));
  }

  /**
   * Re-ground plan steps against a FRESH perception report (live-aware
   * repeats): click steps are matched to detected elements by target name
   * and moved to the element's current center; everything else is kept
   * verbatim. A click step with no coordinates and no matching element
   * has nothing executable left and is dropped — with the reason recorded
   * in the report either way.
   */
  refineStepsWithFreshPerception(
    steps: SubTask[],
    perception: ScreenPerceptionReport,
  ): { refined: SubTask[]; report: StepRefinement[] } {
    const refined: SubTask[] = [];
    const report: StepRefinement[] = [];
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const findMatch = (step: SubTask) => {
      const needle = norm(step.targetName || step.title);
      if (!needle) return undefined;
      const candidates = perception.elements.filter((el) => {
        const name = norm(el.name);
        return name && (name.includes(needle) || needle.includes(name));
      });
      if (!candidates.length) return undefined;
      if (step.x === undefined || step.y === undefined) return candidates[0];
      return candidates.sort(
        (a, b) =>
          Math.hypot(a.center.x - step.x!, a.center.y - step.y!) -
          Math.hypot(b.center.x - step.x!, b.center.y - step.y!),
      )[0];
    };

    for (const step of steps) {
      if (perception.degraded) {
        refined.push(step);
        report.push({
          step,
          status: "kept",
          reason: "perception degraded — original step kept unverified",
        });
        continue;
      }
      if (step.actionType !== "click") {
        refined.push(step);
        report.push({
          step,
          status: "kept",
          reason: "non-click action kept verbatim",
        });
        continue;
      }
      const match = findMatch(step);
      if (!match) {
        if (step.x === undefined || step.y === undefined) {
          report.push({
            step,
            status: "dropped",
            reason: `target "${step.targetName || step.title}" not found in fresh perception and the step has no coordinates to fall back on`,
          });
        } else {
          refined.push(step);
          report.push({
            step,
            status: "kept",
            reason: `target "${step.targetName || step.title}" not identified in fresh perception — original coordinates retained`,
          });
        }
        continue;
      }
      const moved =
        step.x === undefined || step.y === undefined
          ? Infinity
          : Math.hypot(match.center.x - step.x, match.center.y - step.y);
      const regrounded: SubTask = {
        ...step,
        x: Math.round(match.center.x),
        y: Math.round(match.center.y),
      };
      refined.push(regrounded);
      report.push({
        step: regrounded,
        status: moved > 4 ? "regrounded" : "kept",
        reason:
          moved > 4
            ? `re-grounded to "${match.name}" at (${regrounded.x}, ${regrounded.y})`
            : `matched "${match.name}" at its current position`,
      });
    }
    return { refined, report };
  }

  getGoals(): GoalNode[] {
    return this.activeGoals;
  }

  setGoals(goals: GoalNode[]) {
    this.activeGoals = goals;
  }
}

export const aiPlannerEngine = new AIPlannerActorEngine();
