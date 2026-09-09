import { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";

// In-memory cache of the latest real desktop screen frame synced from the user's browser or upload
export let latestSyncedRealFrame: string | null = null;

export const handleSyncRealFrame = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { imageData } = req.body;
    if (
      imageData &&
      typeof imageData === "string" &&
      imageData.startsWith("data:image/")
    ) {
      latestSyncedRealFrame = imageData;
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
    // If a real live desktop frame was synced from browser/upload, return it directly
    if (latestSyncedRealFrame) {
      res.json({
        success: true,
        imageData: latestSyncedRealFrame,
        method: "real_desktop_stream",
      });
      return;
    }

    // Otherwise attempt Python service capture
    const pythonScript = path.join(
      __dirname,
      "../../python-service/capture.py",
    );
    const pythonCmd =
      process.env.PYTHON_CMD ||
      (process.platform === "win32" ? "python" : "python3");

    const python = spawn(pythonCmd, [pythonScript], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdoutData = "";
    let stderrData = "";
    let responded = false;

    const sendResponse = (data: any) => {
      if (!responded) {
        responded = true;
        res.json(data);
      }
    };

    python.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    let errorHandled = false;
    python.on("error", (err) => {
      errorHandled = true;
      sendResponse({
        success: false,
        error: `Failed to spawn python (${pythonCmd}): ${err.message}`,
        hint: "Set PYTHON_CMD env or ensure python is in PATH; fallback synthetic frame used client-side.",
      });
    });

    python.on("close", (code) => {
      if (responded) return;

      if (!errorHandled && code === 0 && stdoutData) {
        try {
          const result = JSON.parse(stdoutData.trim());
          sendResponse(result);
        } catch (e) {
          sendResponse({
            success: false,
            error: "Failed to parse Python service response",
            details: stdoutData,
          });
        }
      } else if (!errorHandled) {
        sendResponse({
          success: false,
          error: "Python screen capture service exited with error",
          stderr: stderrData,
          code,
        });
      }
    });

    const timeout = setTimeout(() => {
      if (!python.killed) python.kill();
      sendResponse({
        success: false,
        error: "Screen capture timeout (5s)",
      });
    }, 5000);

    python.on("close", () => {
      clearTimeout(timeout);
    });
  } catch (error) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
