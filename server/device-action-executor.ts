/**
 * Real device executor for server-side plan/workflow runs.
 *
 * The default executor in execution-state.ts is a safe no-op ("accepted by
 * the safe execution adapter") — fine for tests, but it means workflow "Run"
 * buttons would animate without touching any device. This module builds a
 * SafeActionExecutor that actually dispatches allowlisted actions to the
 * Python service (PyAutoGUI on desktop, ADB on Android), with the same
 * timeout + SIGKILL escalation discipline as the /api/execute-task route.
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import type {
  ActionExecutionResult,
  AllowlistedAction,
} from "@shared/assistant";
import type { SafeActionExecutor } from "./execution-state";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface DeviceExecutorOpts {
  targetDevice: "desktop" | "android";
  deviceId?: string | null;
  frameSize?: { width: number; height: number } | null;
}

const getPythonCmd = () =>
  process.platform === "win32" ? "python" : "python3";

const PYTHON_TIMEOUT_MS = 25_000;

/** Map an allowlisted plan action onto the python-service task envelope. */
function toTaskPayload(action: AllowlistedAction, id: string) {
  const base = {
    id,
    name: `Workflow step: ${action.type}`,
    status: "running",
    priority: 1,
    createdAt: new Date(),
  };
  switch (action.type) {
    case "click":
      // The button matters: Python's "click" branch always left-clicks,
      // so right-clicks must map to the real "right_click" action.
      return {
        ...base,
        action: action.button === "right" ? "right_click" : "click",
        targetPosition: { x: action.x, y: action.y },
        delayMs: 400,
      };
    case "type":
      // Plan type-actions carry no coordinates (the preceding click step
      // focused the field), so type WITHOUT a focus click — the old
      // mapping clicked the screen center first and stole focus.
      return {
        ...base,
        action: "type_no_focus",
        textPayload: action.text,
        delayMs: 400,
      };
    case "key":
      // "+" combos (ctrl+c, alt+tab) recorded from modifier keys run as a
      // real hotkey; plain keys go through press_key.
      return action.key.includes("+")
        ? {
            ...base,
            action: "hotkey",
            textPayload: action.key,
            delayMs: 300,
          }
        : {
            ...base,
            action: "press_key",
            keyPayload: action.key,
            delayMs: 300,
          };
    case "wait":
      return { ...base, action: "wait", delayMs: action.durationMs };
    case "screenshot":
      return { ...base, action: "screenshot", delayMs: 300 };
    case "navigate-shortcut":
      // Real hotkey dispatch ("alt+Left"); the old press_key mapping passed
      // the whole "alt+Left" string as one key name, which pyautogui rejects.
      return {
        ...base,
        action: "hotkey",
        textPayload:
          action.shortcut === "back"
            ? "alt+Left"
            : action.shortcut === "forward"
              ? "alt+Right"
              : action.shortcut === "home"
                ? "win+d"
                : "f5",
        delayMs: 300,
      };
  }
}

export function createDeviceExecutor(
  opts: DeviceExecutorOpts,
): SafeActionExecutor {
  return createDeviceExecutorHandle(opts).executor;
}

/**
 * Same as createDeviceExecutor, but also returns an abort() that SIGTERMs
 * (then SIGKILLs) any Python action process currently in flight. Workflow
 * STOP wires this through the execution's cancel hooks so stopping a run
 * actually stops the device instead of just flipping a status flag.
 */
export function createDeviceExecutorHandle(opts: DeviceExecutorOpts): {
  executor: SafeActionExecutor;
  abort: () => void;
} {
  const { targetDevice, deviceId, frameSize } = opts;
  const pythonScript = path.join(
    __dirname,
    "../python-service/execute-task.py",
  );
  const inFlight = new Set<ReturnType<typeof spawn>>();
  const abort = () => {
    for (const child of inFlight) {
      try {
        child.kill("SIGTERM");
      } catch {}
      setTimeout(() => {
        try {
          if (child.exitCode === null) child.kill("SIGKILL");
        } catch {}
      }, 2000);
    }
  };

  const executor: SafeActionExecutor = async (
    action: AllowlistedAction,
  ): Promise<ActionExecutionResult> => {
    // Never execute empty typing: an empty type step is a planner bug, not
    // a device action. Refuse loudly instead of "typing" nothing.
    if (action.type === "type" && !(action.text || "").trim()) {
      return {
        actionType: action.type,
        success: false,
        message: "Refusing to execute empty type action (no text payload)",
      };
    }
    const taskPayload = toTaskPayload(action, `wf_${Date.now()}`);
    const envelope = {
      task: taskPayload,
      targetDevice,
      deviceId: deviceId || null,
      frameSize: frameSize || null,
    };

    return new Promise((resolve) => {
      let settled = false;
      const done = (result: ActionExecutionResult) => {
        if (!settled) {
          settled = true;
          resolve(result);
        }
      };
      const fail = (message: string) =>
        done({ actionType: action.type, success: false, message });

      let python: ReturnType<typeof spawn>;
      try {
        python = spawn(getPythonCmd(), [pythonScript], {
          stdio: ["pipe", "pipe", "pipe"],
        });
        inFlight.add(python);
        python.on("close", () => inFlight.delete(python));
      } catch (err) {
        fail(`Failed to start python: ${String(err).slice(0, 120)}`);
        return;
      }

      let output = "";
      let errorOutput = "";
      python.stdout?.on("data", (d) => (output += d.toString()));
      python.stderr?.on("data", (d) => (errorOutput += d.toString()));

      const killTimer = setTimeout(() => {
        try {
          python.kill("SIGTERM");
        } catch {}
        setTimeout(() => {
          try {
            if (python.exitCode === null) python.kill("SIGKILL");
          } catch {}
          fail("Python execution timed out (SIGKILL escalation)");
        }, 3000);
      }, PYTHON_TIMEOUT_MS);

      python.on("error", (err) => {
        clearTimeout(killTimer);
        fail(`Python process error: ${String(err).slice(0, 120)}`);
      });
      python.on("close", (code) => {
        clearTimeout(killTimer);
        if (code === 0) {
          try {
            const parsed = JSON.parse(output.trim().split("\n").pop() || "{}");
            done({
              actionType: action.type,
              success: parsed.success !== false,
              message:
                parsed.message || `${action.type} executed on ${targetDevice}`,
              data: { raw: parsed },
            });
          } catch {
            done({
              actionType: action.type,
              success: true,
              message: `${action.type} executed on ${targetDevice}`,
            });
          }
        } else {
          fail(
            `Python exited with code ${code}: ${errorOutput.slice(0, 200) || output.slice(0, 200)}`,
          );
        }
      });

      try {
        python.stdin?.write(JSON.stringify(envelope));
        python.stdin?.end();
      } catch (err) {
        clearTimeout(killTimer);
        fail(`Failed to send task to python: ${String(err).slice(0, 120)}`);
      }
    });
  };

  return { executor, abort };
}
