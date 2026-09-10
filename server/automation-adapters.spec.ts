import { describe, expect, it, vi } from "vitest";
import {
  AndroidAdbCaptureAdapter,
  AndroidAdbAutomationAdapter,
  DesktopCaptureAdapter,
  DesktopAutomationAdapter,
  validateKey,
  validateText,
  validateDeviceId,
} from "./automation-adapters";

describe("automation adapters", () => {
  it("accepts only safe ADB device identifiers", () => {
    expect(validateDeviceId("emulator-5554")).toBe("emulator-5554");
    expect(() => validateDeviceId("phone; rm -rf /")).toThrow();
  });

  it("rejects desktop clicks outside the captured screen", async () => {
    const pointer = vi.fn(async () => undefined);
    const adapter = new DesktopAutomationAdapter(pointer);
    await expect(
      adapter.execute({
        target: "desktop",
        screen: { width: 800, height: 600 },
        approved: true,
        action: { type: "click", x: 800, y: 10 },
      }),
    ).rejects.toThrow("outside");
    expect(pointer).not.toHaveBeenCalled();
  });

  it("passes validated Android taps as fixed ADB arguments", async () => {
    const run = vi.fn(async () => undefined);
    const adapter = new AndroidAdbAutomationAdapter(run);
    await adapter.execute({
      target: "android",
      deviceId: "emulator-5554",
      screen: { width: 1080, height: 1920 },
      approved: true,
      action: { type: "click", x: 12.8, y: 44.2 },
    });
    expect(run).toHaveBeenCalledWith("adb", [
      "-s",
      "emulator-5554",
      "shell",
      "input",
      "tap",
      "12",
      "44",
    ]);
  });

  it("rejects keys outside the bounded keyboard allowlist", () => {
    expect(validateKey("ENTER")).toBe("enter");
    expect(() => validateKey("ctrl+c")).toThrow("allowlist");
    expect(() => validateText("hello\u0000world")).toThrow("control");
  });

  it("requires a configured adapter and explicit approval", async () => {
    const pointer = vi.fn(async () => undefined);
    const adapter = new DesktopAutomationAdapter(pointer, {
      enabled: false,
      desktopEnabled: true,
      androidEnabled: false,
      captureEnabled: false,
    });
    await expect(
      adapter.execute({
        target: "desktop",
        screen: { width: 800, height: 600 },
        approved: true,
        action: { type: "click", x: 10, y: 10 },
      }),
    ).rejects.toThrow("unavailable");
    expect(pointer).not.toHaveBeenCalled();
  });

  it("supports bounded desktop keyboard actions through an injected bridge", async () => {
    const typeText = vi.fn(async () => undefined);
    const key = vi.fn(async () => undefined);
    const adapter = new DesktopAutomationAdapter(
      vi.fn(async () => undefined),
      {
        enabled: true,
        desktopEnabled: true,
        androidEnabled: false,
        captureEnabled: false,
      },
      { typeText, key },
    );
    await adapter.execute({
      target: "desktop",
      screen: { width: 800, height: 600 },
      approved: true,
      action: { type: "type", text: "hello world" },
    });
    await adapter.execute({
      target: "desktop",
      screen: { width: 800, height: 600 },
      approved: true,
      action: { type: "key", key: "ENTER" },
    });
    expect(typeText).toHaveBeenCalledWith("hello world");
    expect(key).toHaveBeenCalledWith("enter");
  });

  it("returns real Android capture bytes from fixed ADB arguments", async () => {
    const run = vi.fn(async () => Buffer.from("png"));
    const adapter = new AndroidAdbCaptureAdapter(run, {
      enabled: true,
      desktopEnabled: false,
      androidEnabled: true,
      captureEnabled: true,
    });
    const result = await adapter.capture(true, "emulator-5554");
    expect(result.imageData).toBe(
      `data:image/png;base64,${Buffer.from("png").toString("base64")}`,
    );
    expect(run).toHaveBeenCalledWith("adb", [
      "-s",
      "emulator-5554",
      "exec-out",
      "screencap",
      "-p",
    ]);
  });

  it("rejects unavailable desktop capture explicitly", async () => {
    const adapter = new DesktopCaptureAdapter(
      async () => "data:image/png;base64,x",
      {
        enabled: true,
        desktopEnabled: true,
        androidEnabled: false,
        captureEnabled: false,
      },
    );
    await expect(adapter.capture(true)).rejects.toThrow("unavailable");
  });
});
