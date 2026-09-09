import { describe, expect, it, vi } from "vitest";
import {
  AndroidAdbAutomationAdapter,
  DesktopAutomationAdapter,
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
});
