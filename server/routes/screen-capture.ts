import { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";
import type { FrameMetadata } from "@shared/coordinates";

// In-memory cache of the latest real desktop screen frame synced from the user's browser or upload
let latestSyncedRealFrame: {
  imageData: string;
  metadata?: FrameMetadata;
} | null = null;

export const captureDesktopFrame = async (): Promise<{
  success: boolean;
  imageData?: string;
  method?: string;
  metadata?: FrameMetadata;
  error?: string;
}> => {
  if (latestSyncedRealFrame) {
    return {
      success: true,
      imageData: latestSyncedRealFrame.imageData,
      method: "real_desktop_stream",
      metadata: latestSyncedRealFrame.metadata,
    };
  }

  const pythonScript = path.join(__dirname, "../../python-service/capture.py");
  const pythonCmd =
    process.env.PYTHON_CMD ||
    (process.platform === "win32" ? "python" : "python3");

  return new Promise((resolve) => {
    const python = spawn(pythonCmd, [pythonScript], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdoutData = "";
    let stderrData = "";
    let settled = false;
    const finish = (result: {
      success: boolean;
      imageData?: string;
      method?: string;
      error?: string;
    }) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    python.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });
    python.stderr.on("data", (data) => {
      stderrData += data.toString();
    });
    python.on("error", (error) =>
      finish({
        success: false,
        error: `Failed to spawn python (${pythonCmd}): ${error.message}`,
      }),
    );
    python.on("close", (code) => {
      if (settled) return;
      if (code === 0 && stdoutData) {
        try {
          finish(JSON.parse(stdoutData.trim()));
          return;
        } catch {
          finish({
            success: false,
            error: "Failed to parse screen capture response",
          });
          return;
        }
      }
      finish({
        success: false,
        error: stderrData || "Python screen capture service exited with error",
      });
    });

    setTimeout(() => {
      if (!settled) {
        if (!python.killed) python.kill();
        finish({ success: false, error: "Screen capture timeout (5s)" });
      }
    }, 5000);
  });
};

export const handleSyncRealFrame = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { imageData, metadata } = req.body;
    if (
      imageData &&
      typeof imageData === "string" &&
      imageData.startsWith("data:image/")
    ) {
      if (metadata !== undefined) {
        if (
          !metadata ||
          !metadata.pixels ||
          !metadata.viewport ||
          !Number.isInteger(metadata.pixels.width) ||
          !Number.isInteger(metadata.pixels.height) ||
          metadata.pixels.width <= 0 ||
          metadata.pixels.height <= 0 ||
          !Number.isFinite(metadata.scale?.x) ||
          !Number.isFinite(metadata.scale?.y) ||
          !Number.isFinite(metadata.offset?.x) ||
          !Number.isFinite(metadata.offset?.y)
        ) {
          res.status(400).json({
            success: false,
            error: "Invalid frame scale or viewport metadata.",
          });
          return;
        }
      }
      latestSyncedRealFrame = { imageData, metadata };
      res.json({
        success: true,
        message: "Real desktop frame synced successfully.",
      });
    } else {
      res
        .status(400)
        .json({ success: false, error: "Invalid image data format." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to sync real desktop frame." });
  }
};

export const handleCaptureScreen = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    res.json(await captureDesktopFrame());
  } catch (error) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
