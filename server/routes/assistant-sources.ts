import { RequestHandler, Router } from "express";
import { spawn } from "child_process";
import type {
  CaptureSource,
  CaptureSourceConnectionState,
} from "@shared/assistant";
import { captureDesktopFrame } from "./screen-capture";

const desktopSourceId = "desktop";
const sourceState = new Map<
  string,
  { connectionState: CaptureSourceConnectionState; lastFrameAt?: string; error?: string }
>();

const validDeviceId = (value: string) => /^[a-zA-Z0-9._:-]{1,128}$/.test(value);

const runAdb = (args: string[], timeoutMs = 5000) =>
  new Promise<{ stdout: Buffer; stderr: string; code: number | null }>((resolve, reject) => {
    const process = spawn("adb", args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout: Buffer[] = [];
    let stderr = "";
    let settled = false;
    const finish = (result: { stdout: Buffer; stderr: string; code: number | null }) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    process.stdout.on("data", (data) => stdout.push(Buffer.from(data)));
    process.stderr.on("data", (data) => (stderr += data.toString()));
    process.on("error", reject);
    process.on("close", (code) => finish({ stdout: Buffer.concat(stdout), stderr, code }));
    setTimeout(() => {
      if (!settled) {
        process.kill();
        finish({ stdout: Buffer.concat(stdout), stderr, code: null });
      }
    }, timeoutMs);
  });

const listAdbDevices = async () => {
  const result = await runAdb(["devices"]);
  if (result.code !== 0) throw new Error(result.stderr || "ADB device listing failed");
  return result.stdout
    .toString("utf8")
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([id, state]) => id && state === "device" && validDeviceId(id))
    .map(([id]) => id);
};

const getState = (id: string) =>
  sourceState.get(id) ?? { connectionState: "disconnected" as const };

const buildSources = async (): Promise<CaptureSource[]> => {
  const sources: CaptureSource[] = [
    {
      id: desktopSourceId,
      kind: "desktop",
      name: "Desktop",
      detail: "Local screen capture",
      ...getState(desktopSourceId),
    },
  ];
  try {
    const devices = await listAdbDevices();
    for (const deviceId of devices) {
      const id = `android:${deviceId}`;
      sources.push({
        id,
        kind: "android",
        name: deviceId,
        detail: "ADB device",
        deviceId,
        connectionState: getState(id).connectionState,
        lastFrameAt: getState(id).lastFrameAt,
        error: getState(id).error,
      });
    }
  } catch (error) {
    sources.push({
      id: "android",
      kind: "android",
      name: "Android / ADB",
      detail: "ADB is unavailable",
      connectionState: "error",
      error: error instanceof Error ? error.message : "Unable to query ADB",
    });
  }
  return sources;
};

const sourceId = (req: Parameters<RequestHandler>[0]) => req.params.sourceId;

export const assistantSourcesRouter = Router();

assistantSourcesRouter.get("/", async (_req, res) => {
  try {
    res.json({ success: true, sources: await buildSources() });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unable to list sources" });
  }
});

assistantSourcesRouter.get("/:sourceId/status", async (req, res) => {
  const sources = await buildSources();
  const source = sources.find((item) => item.id === sourceId(req));
  if (!source) return res.status(404).json({ success: false, error: "Capture source not found" });
  res.json({ success: true, source });
});

assistantSourcesRouter.post("/:sourceId/connect", async (req, res) => {
  const id = sourceId(req);
  if (id === desktopSourceId) {
    sourceState.set(id, { connectionState: "connected" });
    return res.json({ success: true, source: (await buildSources()).find((item) => item.id === id) });
  }
  if (!id.startsWith("android:")) return res.status(400).json({ success: false, error: "Invalid capture source" });
  const deviceId = id.slice("android:".length);
  if (!validDeviceId(deviceId)) return res.status(400).json({ success: false, error: "Invalid Android device id" });
  try {
    if (!(await listAdbDevices()).includes(deviceId)) throw new Error("Android device is not connected");
    sourceState.set(id, { connectionState: "connected" });
    return res.json({ success: true, source: (await buildSources()).find((item) => item.id === id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to connect Android source";
    sourceState.set(id, { connectionState: "error", error: message });
    return res.status(502).json({ success: false, error: message });
  }
});

assistantSourcesRouter.post("/:sourceId/disconnect", async (req, res) => {
  const id = sourceId(req);
  if (!id || (id !== desktopSourceId && !id.startsWith("android:"))) {
    return res.status(400).json({ success: false, error: "Invalid capture source" });
  }
  sourceState.set(id, { connectionState: "disconnected" });
  res.json({ success: true, source: (await buildSources()).find((item) => item.id === id) });
});

assistantSourcesRouter.post("/:sourceId/capture", async (req, res) => {
  const id = sourceId(req);
  const source = (await buildSources()).find((item) => item.id === id);
  if (!source) return res.status(404).json({ success: false, error: "Capture source not found" });
  try {
    let imageData: string | undefined;
    if (source.kind === "desktop") {
      const result = await captureDesktopFrame();
      if (!result.success || !result.imageData) throw new Error(result.error || "Desktop capture failed");
      imageData = result.imageData;
    } else {
      const deviceId = source.deviceId;
      if (!deviceId || !validDeviceId(deviceId)) throw new Error("Invalid Android device id");
      const result = await runAdb(["-s", deviceId, "exec-out", "screencap", "-p"], 8000);
      if (result.code !== 0) throw new Error(result.stderr || "ADB capture failed");
      const output = result.stdout;
      if (!output.length) throw new Error("ADB returned an empty frame");
      imageData = `data:image/png;base64,${output.toString("base64")}`;
    }
    const capturedAt = new Date().toISOString();
    sourceState.set(id, { connectionState: "connected", lastFrameAt: capturedAt });
    res.json({ success: true, frame: { sourceId: id, imageData, capturedAt } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Capture failed";
    sourceState.set(id, { ...getState(id), connectionState: "error", error: message });
    res.status(502).json({ success: false, error: message });
  }
});
