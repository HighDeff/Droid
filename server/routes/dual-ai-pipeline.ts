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
    const { imageData, endpoint, model } = req.body;
    if (!imageData) {
      return res
        .status(400)
        .json({ success: false, error: "Missing imageData" });
    }

    const report = await qwenVisionEngine.analyzeScreen(
      imageData,
      endpoint,
      model,
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
    } = req.body;

    if (!perceptionReport) {
      return res
        .status(400)
        .json({ success: false, error: "Missing perceptionReport" });
    }

    const decision = await aiPlannerEngine.planAndFormulateAction(
      perceptionReport,
      userObjective,
      endpoint,
      model,
    );

    let executionResult: any = null;

    if (executeImmediately && decision.nextAction) {
      executionResult = await dispatchActionToPython(decision.nextAction);
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

// 3. Post-Execution Coordinate Recalibration
export const handleRecalibrateStep: RequestHandler = async (req, res) => {
  try {
    const { targetName, currentX, currentY, newElements } = req.body;
    const result = adaptiveRetryEngine.recalibrateElementCoordinates(
      targetName || "",
      currentX || 960,
      currentY || 540,
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
    } = req.body;
    const retryPlan = adaptiveRetryEngine.computeAdaptiveRetry(
      stepId || `step_${Date.now()}`,
      actionType || "click",
      targetName || "Target",
      currentX || 960,
      currentY || 540,
      textPayload,
      perception || {
        elements: [],
        feedbackPosition: { x: 960, y: 540 },
        screenDescription: "",
      },
    );

    let executionResult: any = null;
    if (retryPlan.retryNeeded) {
      executionResult = await dispatchActionToPython({
        id: stepId,
        title: `Retry (${retryPlan.attemptNumber}): ${targetName}`,
        actionType: retryPlan.adaptedActionType,
        x: retryPlan.newCoordinates.x,
        y: retryPlan.newCoordinates.y,
        textPayload: retryPlan.textPayload,
        delayMs: retryPlan.delayMs,
      });
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
    const { imageData, userObjective, endpoint, model } = req.body;
    if (!imageData) {
      return res
        .status(400)
        .json({ success: false, error: "Missing imageData" });
    }

    const perception = await qwenVisionEngine.analyzeScreen(
      imageData,
      endpoint,
      model,
    );
    const decision = await aiPlannerEngine.planAndFormulateAction(
      perception,
      userObjective,
      endpoint,
      model,
    );

    let executionResult: any = null;
    if (decision.nextAction) {
      executionResult = await dispatchActionToPython(decision.nextAction);
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

// Dispatch action to Python PyAutoGUI service
export async function dispatchActionToPython(action: any): Promise<any> {
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

      // Normalize action type field from various callers
      const actType = action.actionType || action.action || "click";
      let taskDesc = `Click at ${action.x || 960}, ${action.y || 540}`;
      if (actType === "double_click") {
        taskDesc = `Double click at ${action.x || 960}, ${action.y || 540}`;
      } else if (actType === "right_click") {
        taskDesc = `Right click at ${action.x || 960}, ${action.y || 540}`;
      } else if (actType === "clear_and_type") {
        taskDesc = `Clear and type "${action.textPayload || action.text || ""}" at ${action.x || 960}, ${action.y || 540}`;
      } else if (actType === "type_text" || actType === "type") {
        taskDesc = `Type "${action.textPayload || action.text || ""}" at ${action.x || 960}, ${action.y || 540}`;
      } else if (actType === "press_key") {
        taskDesc = `Press key: ${action.keyPayload || action.key || "enter"}`;
      } else if (actType === "hotkey") {
        taskDesc = `Hotkey: ${action.keyPayload || action.key || "ctrl+a"}`;
      } else if (actType === "scroll") {
        taskDesc = `Scroll at ${action.x || 960}, ${action.y || 540}`;
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
        x: action.x || 960,
        y: action.y || 540,
        targetPosition: { x: action.x || 960, y: action.y || 540 },
        textPayload: action.textPayload || action.text || "",
        keyPayload: action.keyPayload || action.key || "enter",
        delayMs: action.delayMs || action.delay || 500,
        text: action.textPayload || action.text,
      };

      // Wrap in {task: ...} envelope expected by python-service
      const envelope = {
        task: taskPayload,
        targetDevice: action.targetDevice || "desktop",
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

      setTimeout(() => {
        try {
          python.kill();
        } catch {}
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
