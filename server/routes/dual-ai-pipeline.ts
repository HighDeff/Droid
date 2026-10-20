/**
 * Dual-AI Pipeline Express Route Handlers
 * Endpoints for AI #1 Qwen Perception, AI #2 Reasoning Planner, Coordinate Recalibration & Adaptive Retry
 */

import { RequestHandler } from "express";
import { qwenVisionEngine } from "../ai-perception-engine";
import { aiPlannerEngine } from "../ai-planner-engine";
import { adaptiveRetryEngine } from "../adaptive-retry-engine";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. AI #1 Screen Auto-Description & Feedback Positioning
export const handleDescribeScreen: RequestHandler = async (req, res) => {
  try {
    const { imageData, endpoint, model, frameSize } = req.body;
    if (!imageData) {
      return res
        .status(400)
        .json({ success: false, error: "Missing imageData" });
    }

    const report = await qwenVisionEngine.analyzeScreen(
      imageData,
      endpoint,
      model,
      frameSize,
    );
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

// 2. AI #2 Reasoning Planner, Thinking, Goal Reorganization & Action Formulation
export const handlePlanAndAct: RequestHandler = async (req, res) => {
  try {
    const {
      perceptionReport,
      userObjective,
      endpoint,
      model,
      executeImmediately = false,
      targetDevice,
      deviceId,
      frameSize,
      context,
    } = req.body;

    if (!perceptionReport) {
      return res
        .status(400)
        .json({ success: false, error: "Missing perceptionReport" });
    }

    // Surface a user interaction so abandonment tracking stays honest.
    aiPlannerEngine.noteUserActivity();

    const decision = await aiPlannerEngine.planAndFormulateAction(
      perceptionReport,
      userObjective,
      endpoint,
      model,
      {
        recentActions: context?.recentActions,
        appTab: context?.appTab,
        existingSteps: context?.existingSteps,
        sessionId: context?.sessionId,
      },
    );

    let executionResult: any = null;

    if (executeImmediately && decision.nextAction) {
      executionResult = await dispatchActionToPython(decision.nextAction, {
        targetDevice,
        deviceId,
        frameSize,
      });
      // Learn from every executed action: feed the outcome back into the
      // planner's history so future decisions improve during the session.
      const ok = !!executionResult?.success;
      aiPlannerEngine.recordOutcome(
        decision.nextAction,
        ok,
        ok, // dispatch success counts as verified at this layer; visual verification happens client-side
        ok ? "dispatched to device" : String(executionResult?.error || "dispatch failed").slice(0, 120),
      );
    }

    res.json({
      success: true,
      decision,
      executionResult,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

// 2b. AI step synthesis from a screenshot: when the user has no steps at
// all, the planner forms a purpose hypothesis and creates proper steps from
// the detected elements. This is what powers "RUN ON PC" with an empty
// sequence — steps genuinely derived from screenshot AI interpretation.
export const handleSynthesizeSteps: RequestHandler = async (req, res) => {
  try {
    const { perceptionReport, userObjective, context } = req.body;
    if (!perceptionReport) {
      return res
        .status(400)
        .json({ success: false, error: "Missing perceptionReport" });
    }
    aiPlannerEngine.noteUserActivity();
    const needsPurpose =
      !userObjective || userObjective.trim() === "" || userObjective === "auto";
    const purpose = aiPlannerEngine.inferPurpose(perceptionReport, {
      recentActions: context?.recentActions,
      appTab: context?.appTab,
    });
    const steps = aiPlannerEngine.synthesizeSteps(perceptionReport, purpose);
    res.json({
      success: true,
      purpose: needsPurpose ? purpose : null,
      steps: steps.map((s) => ({
        id: s.id,
        name: s.title,
        action:
          s.actionType === "type_text"
            ? "type_text"
            : s.actionType === "wait"
              ? "wait"
              : "click",
        x: s.x,
        y: s.y,
        text: s.textPayload || "",
        delayMs: s.delayMs,
      })),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

// 3. Post-Execution Coordinate Recalibration
export const handleRecalibrateStep: RequestHandler = async (req, res) => {
  try {
    const { targetName, currentX, currentY, newElements, frameSize } = req.body;
    const cx = Math.round((frameSize?.width || 1920) / 2);
    const cy = Math.round((frameSize?.height || 1080) / 2);
    const result = adaptiveRetryEngine.recalibrateElementCoordinates(
      targetName || "",
      currentX ?? cx,
      currentY ?? cy,
      newElements || [],
    );
    res.json({ success: true, recalibration: result });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

// 4. Adaptive Retry Calculation with Learning from Past Methods
export const handleAdaptiveRetry: RequestHandler = async (req, res) => {
  try {
    const {
      stepId,
      actionType,
      targetName,
      currentX,
      currentY,
      textPayload,
      perception,
      frameSize,
    } = req.body;
    const rcx = Math.round((frameSize?.width || 1920) / 2);
    const rcy = Math.round((frameSize?.height || 1080) / 2);
    const retryPlan = adaptiveRetryEngine.computeAdaptiveRetry(
      stepId || `step_${Date.now()}`,
      actionType || "click",
      targetName || "Target",
      currentX ?? rcx,
      currentY ?? rcy,
      textPayload,
      perception || {
        elements: [],
        feedbackPosition: { x: rcx, y: rcy },
        screenDescription: "",
      },
    );

    let executionResult: any = null;
    if (retryPlan.retryNeeded) {
      executionResult = await dispatchActionToPython(
        {
          id: stepId,
          title: `Retry (${retryPlan.attemptNumber}): ${targetName}`,
          actionType: retryPlan.adaptedActionType,
          x: retryPlan.newCoordinates.x,
          y: retryPlan.newCoordinates.y,
          textPayload: retryPlan.textPayload,
          delayMs: retryPlan.delayMs,
        },
        {
          targetDevice: req.body.targetDevice,
          deviceId: req.body.deviceId,
          frameSize: req.body.frameSize,
        },
      );
    }

    res.json({ success: true, retryPlan, executionResult });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

// 5. Unified Autonomous Co-Pilot Step (Perceive -> Plan -> Act -> Verify -> Recalibrate)
export const handleAutonomousStep: RequestHandler = async (req, res) => {
  try {
    const { imageData, userObjective, endpoint, model, targetDevice, deviceId, frameSize } =
      req.body;
    if (!imageData) {
      return res
        .status(400)
        .json({ success: false, error: "Missing imageData" });
    }

    const perception = await qwenVisionEngine.analyzeScreen(
      imageData,
      endpoint,
      model,
      frameSize,
    );
    const decision = await aiPlannerEngine.planAndFormulateAction(
      perception,
      userObjective,
      endpoint,
      model,
    );

    let executionResult: any = null;
    if (decision.nextAction) {
      executionResult = await dispatchActionToPython(decision.nextAction, {
        targetDevice,
        deviceId,
        frameSize,
      });
    }

    res.json({
      success: true,
      perception,
      decision,
      executionResult,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

// Helper to resolve python command robustly (windows: python, py, python3)
function getPythonCmd(): string {
  // Prefer env override, else try platform-appropriate
  if (process.env.PYTHON_CMD) return process.env.PYTHON_CMD;
  return process.platform === "win32" ? "python" : "python3";
}

// Dispatch action to Python PyAutoGUI / ADB service.
// opts carry the caller's device selection; when omitted the action's own
// fields win, falling back to desktop.
export async function dispatchActionToPython(
  action: any,
  opts: { targetDevice?: string; deviceId?: string | null; frameSize?: { width: number; height: number } | null } = {},
): Promise<any> {
  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (val: any) => {
      if (!resolved) {
        resolved = true;
        resolve(val);
      }
    };
    try {
      const pythonScript = path.join(
        __dirname,
        "../../python-service/execute-task.py",
      );
      const pythonCmd = getPythonCmd();

      const python = spawn(pythonCmd, [pythonScript], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let output = "";
      let errorOutput = "";

      // Normalize action type field from various callers.
      // Missing coordinates fall back to the center of the caller's frame
      // (1920x1080 only when no frameSize was provided), never a magic pixel.
      const frameW = opts.frameSize?.width || action.frameSize?.width || 1920;
      const frameH = opts.frameSize?.height || action.frameSize?.height || 1080;
      const fallbackX = Math.round(frameW / 2);
      const fallbackY = Math.round(frameH / 2);
      const actType = action.actionType || action.action || "click";
      let taskDesc = `Click at ${action.x ?? fallbackX}, ${action.y ?? fallbackY}`;
      if (actType === "double_click") {
        taskDesc = `Double click at ${action.x ?? fallbackX}, ${action.y ?? fallbackY}`;
      } else if (actType === "right_click") {
        taskDesc = `Right click at ${action.x ?? fallbackX}, ${action.y ?? fallbackY}`;
      } else if (actType === "clear_and_type") {
        taskDesc = `Clear and type "${action.textPayload || action.text || ""}" at ${action.x ?? fallbackX}, ${action.y ?? fallbackY}`;
      } else if (actType === "type_text" || actType === "type") {
        taskDesc = `Type "${action.textPayload || action.text || ""}" at ${action.x ?? fallbackX}, ${action.y ?? fallbackY}`;
      } else if (actType === "press_key") {
        taskDesc = `Press key: ${action.keyPayload || action.key || "enter"}`;
      } else if (actType === "hotkey") {
        taskDesc = `Hotkey: ${action.keyPayload || action.key || "ctrl+a"}`;
      } else if (actType === "scroll") {
        taskDesc = `Scroll at ${action.x ?? fallbackX}, ${action.y ?? fallbackY}`;
      } else if (actType === "wait") {
        taskDesc = `Wait for ${action.delayMs || 500}ms`;
      }

      const taskPayload = {
        id: action.id || `act_${Date.now()}`,
        name: action.title || action.name || "Dual AI Automated Action",
        description: taskDesc,
        status: "running",
        priority: 1,
        createdAt: new Date(),
        action: actType,
        actionType: actType,
        x: action.x ?? fallbackX,
        y: action.y ?? fallbackY,
        targetPosition: { x: action.x ?? fallbackX, y: action.y ?? fallbackY },
        textPayload: action.textPayload || action.text || "",
        keyPayload: action.keyPayload || action.key || "enter",
        delayMs: action.delayMs || action.delay || 500,
        text: action.textPayload || action.text,
      };

      // Wrap in {task: ...} envelope expected by python-service.
      // Device routing: explicit opts > action fields > desktop default.
      // The python service routes "android" to ADB and rescales frame
      // coordinates to real device pixels when frameSize is provided.
      const envelope = {
        task: taskPayload,
        targetDevice:
          opts.targetDevice || action.targetDevice || "desktop",
        deviceId: opts.deviceId || action.deviceId || null,
        frameSize: opts.frameSize || action.frameSize || null,
      };

      python.stdin.write(JSON.stringify(envelope));
      python.stdin.end();

      python.stdout.on("data", (d) => {
        output += d.toString();
      });
      python.stderr.on("data", (d) => {
        errorOutput += d.toString();
      });

      python.on("error", (err) => {
        safeResolve({
          success: false,
          error: `Failed to spawn python (${pythonCmd}): ${err.message}`,
        });
      });

      python.on("close", (code) => {
        if (code === 0) {
          try {
            safeResolve(
              output.trim()
                ? JSON.parse(output)
                : { success: true, result: "Action completed" },
            );
          } catch {
            safeResolve({
              success: true,
              result: output || "Action completed",
            });
          }
        } else {
          safeResolve({
            success: false,
            error: errorOutput || `Python dispatch failed (code ${code})`,
          });
        }
      });

      // Escalating kill: SIGTERM first, SIGKILL 3s later if stuck.
      const killPython = () => {
        try {
          python.kill("SIGTERM");
        } catch {}
        setTimeout(() => {
          try {
            if (python.exitCode === null) python.kill("SIGKILL");
          } catch {}
        }, 3000);
      };

      setTimeout(() => {
        killPython();
        safeResolve({
          success: false,
          error: "Action execution timeout (15s)",
        });
      }, 15000);
    } catch (e) {
      safeResolve({
        success: false,
        error: e instanceof Error ? e.message : "Dispatch error",
      });
    }
  });
}

/**
 * Record the outcome of a client-executed action (AI Decide loop,
 * live-aware repeats): verifies the visual outcome against a fresh
 * perception, feeds success/verification into the planner's learning
 * history, and returns the abandonment verdict so loops can wrap up
 * gracefully when the user stops driving / no progress is made.
 */
export const handleRecordOutcome: RequestHandler = async (req, res) => {
  try {
    const {
      action,
      success,
      previousPerception,
      currentPerception,
      expectedChange,
      maxIdleCycles,
    } = req.body ?? {};
    if (!action) {
      return res
        .status(400)
        .json({ success: false, error: "Missing action" });
    }
    aiPlannerEngine.noteUserActivity();
    let verified = false;
    let feedback = "no fresh perception provided — outcome recorded as unverified";
    if (previousPerception && currentPerception) {
      const v = await aiPlannerEngine.verifyActionOutcome(
        previousPerception,
        currentPerception,
        {
          expectedChange: expectedChange || "a visible change",
          targetRegion: { x: 0, y: 0, width: 0, height: 0 },
          successCondition: "",
          retryStrategy: "re-ground the target and retry",
        },
      );
      verified = v.verified;
      feedback = v.feedback;
    }
    aiPlannerEngine.recordOutcome(
      action,
      !!success,
      verified,
      feedback.slice(0, 200),
    );
    const abandonment = aiPlannerEngine.checkAbandonment(
      typeof maxIdleCycles === "number" ? maxIdleCycles : 6,
    );
    res.json({ success: true, verified, feedback, abandonment });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
};
