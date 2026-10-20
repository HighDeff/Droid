import { RequestHandler } from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const handleExecuteTask: RequestHandler = async (req, res) => {
  try {
    const pythonScript = path.join(
      __dirname,
      "../../python-service/execute-task.py",
    );
    const pythonCmd =
      process.env.PYTHON_CMD ||
      (process.platform === "win32" ? "python" : "python3");

    const python = spawn(pythonCmd, [pythonScript], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let outputBuffer = "";
    let errorBuffer = "";
    let responseSent = false;

    python.stdout.on("data", (data) => {
      outputBuffer += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorBuffer += data.toString();
    });

    let spawnError: string | null = null;
    python.on("error", (err) => {
      spawnError = `Failed to spawn python (${pythonCmd}): ${err.message}`;
    });

    python.on("close", (code) => {
      if (responseSent) return;
      responseSent = true;

      if (spawnError) {
        return res.json({ success: false, error: spawnError });
      }

      try {
        if (outputBuffer.trim()) {
          const result = JSON.parse(outputBuffer.trim());
          return res.json(result);
        }
      } catch (parseErr) {
        // fallback
      }

      if (code === 0) {
        res.json({
          success: true,
          result: "Task executed successfully",
          details: outputBuffer,
        });
      } else {
        res.json({
          success: false,
          error: errorBuffer || `Execution process failed (code ${code})`,
        });
      }
    });

    // Handle wait tasks without spawning python overhead? Keep python for consistency
    // Write request body to Python stdin
    try {
      python.stdin.write(JSON.stringify(req.body));
      python.stdin.end();
    } catch (e) {
      if (!responseSent) {
        responseSent = true;
        res.json({ success: false, error: String(e) });
      }
    }

    // Escalating kill: SIGTERM first, SIGKILL 3s later if the process
    // refuses to die (e.g. stuck inside a blocking automation call).
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

    // If the client disconnects (user hit Esc/STOP), kill the automation
    // immediately instead of letting it run orphaned on the device.
    req.on("close", () => {
      if (!responseSent) {
        killPython();
        responseSent = true;
      }
    });

    setTimeout(() => {
      if (!responseSent) {
        killPython();
        responseSent = true;
        res.json({ success: false, error: "Execute-task timeout (15s)" });
      }
    }, 15000);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
};
