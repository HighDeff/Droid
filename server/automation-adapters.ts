import { spawn } from "child_process";
import type {
  AllowlistedAction,
  ActionExecutionResult,
} from "../shared/assistant";
import { validatePoint, type Size } from "../shared/coordinates";

export type AutomationTarget = "desktop" | "android";

export interface AutomationRequest {
  target: AutomationTarget;
  deviceId?: string;
  screen: Size;
  action: AllowlistedAction;
  approved: true;
}

export interface CommandRunner {
  (file: string, args: string[]): Promise<void>;
}

export const adbDeviceIdPattern =
  /^(?:[A-Za-z0-9._-]+|\d{1,3}(?:\.\d{1,3}){3}:\d{1,5})$/;

export function validateDeviceId(deviceId: string): string {
  if (!adbDeviceIdPattern.test(deviceId) || deviceId.length > 128) {
    throw new Error("Invalid Android device ID");
  }
  return deviceId;
}

const defaultRunner: CommandRunner = (file, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(file, args, { stdio: "ignore", windowsHide: true });
    child.once("error", reject);
    child.once("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${file} exited with code ${code}`)),
    );
  });

export interface AutomationAdapter {
  execute(request: AutomationRequest): Promise<ActionExecutionResult>;
}

export class DesktopAutomationAdapter implements AutomationAdapter {
  constructor(
    private readonly pointer: (
      action: Extract<AllowlistedAction, { type: "click" }>,
    ) => Promise<void>,
  ) {}

  async execute(request: AutomationRequest): Promise<ActionExecutionResult> {
    if (!request.approved) throw new Error("Explicit approval is required");
    if (request.action.type === "click") {
      validatePoint(request.action, request.screen, "click coordinates");
      await this.pointer(request.action);
    }
    return {
      actionType: request.action.type,
      success: true,
      message: `${request.action.type} executed by the desktop adapter`,
    };
  }
}

export class AndroidAdbAutomationAdapter implements AutomationAdapter {
  constructor(private readonly run: CommandRunner = defaultRunner) {}

  async execute(request: AutomationRequest): Promise<ActionExecutionResult> {
    if (!request.approved) throw new Error("Explicit approval is required");
    if (!request.deviceId) throw new Error("An Android device ID is required");
    const deviceId = validateDeviceId(request.deviceId);
    if (request.action.type !== "click") {
      throw new Error("Only allowlisted Android tap actions are supported");
    }
    validatePoint(request.action, request.screen, "tap coordinates");
    await this.run("adb", [
      "-s",
      deviceId,
      "shell",
      "input",
      "tap",
      String(Math.floor(request.action.x)),
      String(Math.floor(request.action.y)),
    ]);
    return {
      actionType: "click",
      success: true,
      message: "Tap executed by the Android ADB adapter",
    };
  }
}
