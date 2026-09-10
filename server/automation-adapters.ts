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
  approved: boolean;
}

export interface CommandRunner {
  (file: string, args: string[]): Promise<void>;
}

export interface CaptureCommandRunner {
  (file: string, args: string[]): Promise<Buffer>;
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

const defaultCaptureRunner: CaptureCommandRunner = (file, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const output: Buffer[] = [];
    let error = "";
    child.stdout.on("data", (data) => output.push(Buffer.from(data)));
    child.stderr.on("data", (data) => (error += data.toString()));
    child.once("error", reject);
    child.once("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(output))
        : reject(new Error(error || `${file} exited with code ${code}`)),
    );
  });

export interface AutomationAdapter {
  execute(request: AutomationRequest): Promise<ActionExecutionResult>;
}

export class AdapterUnavailableError extends Error {
  readonly code = "ADAPTER_UNAVAILABLE";

  constructor(message: string) {
    super(message);
    this.name = "AdapterUnavailableError";
  }
}

export interface DesktopAutomationBridge {
  pointer(action: Extract<AllowlistedAction, { type: "click" }>): Promise<void>;
  typeText?(text: string): Promise<void>;
  key?(key: string): Promise<void>;
}

export interface AutomationAdapterConfig {
  enabled: boolean;
  desktopEnabled: boolean;
  androidEnabled: boolean;
  captureEnabled: boolean;
}

export const automationAdapterConfig = (): AutomationAdapterConfig => ({
  enabled: process.env.AUTOMATION_ADAPTERS_ENABLED === "true",
  desktopEnabled: process.env.DESKTOP_AUTOMATION_ENABLED === "true",
  androidEnabled: process.env.ANDROID_AUTOMATION_ENABLED === "true",
  captureEnabled: process.env.CAPTURE_ADAPTERS_ENABLED === "true",
});

const allowedKeys = new Set([
  "backspace",
  "delete",
  "down",
  "end",
  "enter",
  "escape",
  "home",
  "left",
  "pagedown",
  "pageup",
  "right",
  "space",
  "tab",
  "up",
]);

export function validateKey(key: string): string {
  const normalized = key.trim().toLowerCase();
  if (!allowedKeys.has(normalized)) {
    throw new Error(`Key "${key}" is not in the safe keyboard allowlist`);
  }
  return normalized;
}

export function validateText(text: string): string {
  if (
    text.length === 0 ||
    text.length > 4000 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text)
  ) {
    throw new Error(
      "Text must be 1-4000 characters without control characters",
    );
  }
  return text;
}

function ensureEnabled(
  config: AutomationAdapterConfig,
  target: AutomationTarget,
) {
  if (!config.enabled || !config[`${target}Enabled`]) {
    throw new AdapterUnavailableError(
      `${target} automation is unavailable; enable the adapter and request explicit approval`,
    );
  }
}

export interface CaptureResult {
  imageData: string;
  capturedAt: string;
}

export interface CaptureAdapter {
  capture(approved: boolean): Promise<CaptureResult>;
}

export class DesktopCaptureAdapter implements CaptureAdapter {
  constructor(
    private readonly captureFrame: () => Promise<string>,
    private readonly config: AutomationAdapterConfig = {
      enabled: true,
      desktopEnabled: true,
      androidEnabled: false,
      captureEnabled: true,
    },
  ) {}

  async capture(approved: boolean): Promise<CaptureResult> {
    if (!approved) throw new Error("Explicit approval is required");
    if (!this.config.enabled || !this.config.captureEnabled) {
      throw new AdapterUnavailableError(
        "Desktop capture is unavailable; enable the capture adapter",
      );
    }
    if (!this.config.desktopEnabled) {
      throw new AdapterUnavailableError(
        "Desktop capture is unavailable; enable desktop support",
      );
    }
    const imageData = await this.captureFrame();
    if (!imageData.startsWith("data:image/")) {
      throw new Error("Desktop capture returned an invalid image");
    }
    return { imageData, capturedAt: new Date().toISOString() };
  }
}

export class AndroidAdbCaptureAdapter implements CaptureAdapter {
  constructor(
    private readonly run: CaptureCommandRunner = defaultCaptureRunner,
    private readonly config: AutomationAdapterConfig = {
      enabled: true,
      desktopEnabled: false,
      androidEnabled: true,
      captureEnabled: true,
    },
  ) {}

  async capture(approved: boolean, deviceId?: string): Promise<CaptureResult> {
    if (!approved) throw new Error("Explicit approval is required");
    if (!this.config.enabled || !this.config.captureEnabled) {
      throw new AdapterUnavailableError(
        "Android capture is unavailable; enable the capture adapter",
      );
    }
    if (!this.config.androidEnabled) {
      throw new AdapterUnavailableError(
        "Android capture is unavailable; enable Android support",
      );
    }
    if (!deviceId) throw new Error("An Android device ID is required");
    const validatedDeviceId = validateDeviceId(deviceId);
    const output = await this.run("adb", [
      "-s",
      validatedDeviceId,
      "exec-out",
      "screencap",
      "-p",
    ]);
    if (output.length === 0)
      throw new Error("Android capture returned no data");
    return {
      imageData: `data:image/png;base64,${output.toString("base64")}`,
      capturedAt: new Date().toISOString(),
    };
  }
}

export class DesktopAutomationAdapter implements AutomationAdapter {
  private readonly bridge: DesktopAutomationBridge;
  private readonly config: AutomationAdapterConfig;

  constructor(
    pointer: DesktopAutomationBridge["pointer"],
    config: AutomationAdapterConfig = {
      enabled: true,
      desktopEnabled: true,
      androidEnabled: false,
      captureEnabled: true,
    },
    bridge: Omit<DesktopAutomationBridge, "pointer"> = {},
  ) {
    this.bridge = { pointer, ...bridge };
    this.config = config;
  }

  async execute(request: AutomationRequest): Promise<ActionExecutionResult> {
    if (!request.approved) throw new Error("Explicit approval is required");
    ensureEnabled(this.config, "desktop");
    if (request.action.type === "click") {
      validatePoint(request.action, request.screen, "click coordinates");
      await this.bridge.pointer(request.action);
    } else if (request.action.type === "type") {
      if (!this.bridge.typeText)
        throw new AdapterUnavailableError(
          "Desktop keyboard typing is unavailable in the configured adapter",
        );
      await this.bridge.typeText(validateText(request.action.text));
    } else if (request.action.type === "key") {
      if (!this.bridge.key)
        throw new AdapterUnavailableError(
          "Desktop keyboard input is unavailable in the configured adapter",
        );
      await this.bridge.key(validateKey(request.action.key));
    } else {
      throw new Error(
        `Desktop automation does not support "${request.action.type}"`,
      );
    }
    return {
      actionType: request.action.type,
      success: true,
      message: `${request.action.type} executed by the desktop adapter`,
    };
  }
}

export class AndroidAdbAutomationAdapter implements AutomationAdapter {
  constructor(
    private readonly run: CommandRunner = defaultRunner,
    private readonly config: AutomationAdapterConfig = {
      enabled: true,
      desktopEnabled: false,
      androidEnabled: true,
      captureEnabled: true,
    },
  ) {}

  async execute(request: AutomationRequest): Promise<ActionExecutionResult> {
    if (!request.approved) throw new Error("Explicit approval is required");
    ensureEnabled(this.config, "android");
    if (!request.deviceId) throw new Error("An Android device ID is required");
    const deviceId = validateDeviceId(request.deviceId);
    let args: string[];
    if (request.action.type === "click") {
      validatePoint(request.action, request.screen, "tap coordinates");
      args = [
        "-s",
        deviceId,
        "shell",
        "input",
        "tap",
        String(Math.floor(request.action.x)),
        String(Math.floor(request.action.y)),
      ];
    } else if (request.action.type === "type") {
      args = [
        "-s",
        deviceId,
        "shell",
        "input",
        "text",
        validateText(request.action.text).replace(/ /g, "%s"),
      ];
    } else if (request.action.type === "key") {
      const keyCodes: Record<string, string> = {
        backspace: "KEYCODE_DEL",
        delete: "KEYCODE_FORWARD_DEL",
        down: "KEYCODE_DPAD_DOWN",
        end: "KEYCODE_MOVE_END",
        enter: "KEYCODE_ENTER",
        escape: "KEYCODE_ESCAPE",
        home: "KEYCODE_MOVE_HOME",
        left: "KEYCODE_DPAD_LEFT",
        pagedown: "KEYCODE_PAGE_DOWN",
        pageup: "KEYCODE_PAGE_UP",
        right: "KEYCODE_DPAD_RIGHT",
        space: "KEYCODE_SPACE",
        tab: "KEYCODE_TAB",
        up: "KEYCODE_DPAD_UP",
      };
      args = [
        "-s",
        deviceId,
        "shell",
        "input",
        "keyevent",
        keyCodes[validateKey(request.action.key)],
      ];
    } else {
      throw new Error(
        `Android automation does not support "${request.action.type}"`,
      );
    }
    await this.run("adb", args);
    return {
      actionType: request.action.type,
      success: true,
      message: `${request.action.type} executed by the Android ADB adapter`,
    };
  }
}
