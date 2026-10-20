import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  CalendarClock,
  Eye,
  Play,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Square,
} from "lucide-react";
import type { AssistantWorkflow } from "@shared/assistant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { apiRequest, apiUrl } from "@/lib/api";

interface LiveEvent {
  id: string;
  time: string;
  text: string;
}

export function WorkflowLibraryPanel() {
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem("assistant_session_id") ?? "",
  );
  const [workflows, setWorkflows] = useState<AssistantWorkflow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [liveAwareId, setLiveAwareId] = useState<string | null>(null);
  const [repeatCount, setRepeatCount] = useState(3);
  const [targetDevice, setTargetDevice] = useState<"desktop" | "android">(
    "desktop",
  );
  const [adbDevices, setAdbDevices] = useState<string[]>([]);
  const [selectedAdbDevice, setSelectedAdbDevice] = useState<string>("");
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const stopRef = useRef(false);

  // Load real ADB devices when Android is targeted (no fake device list).
  useEffect(() => {
    if (targetDevice !== "android") return;
    apiRequest<{ devices?: string[] }>(`/api/adb/devices`)
      .then((d) => {
        setAdbDevices(d.devices ?? []);
        setSelectedAdbDevice((prev) => prev || d.devices?.[0] || "");
      })
      .catch(() => setAdbDevices([]));
  }, [targetDevice]);

  const loadWorkflows = async () => {
    setError("");
    setLoading(true);
    try {
      localStorage.setItem("assistant_session_id", sessionId);
      const data = await apiRequest<{ workflows: AssistantWorkflow[] }>(
        `/api/assistant/workflows?sessionId=${encodeURIComponent(sessionId)}`,
      );
      setWorkflows(data.workflows);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load workflows",
      );
    } finally {
      setLoading(false);
    }
  };

  // Live awareness: subscribe to the server-sent workflow event stream so
  // iteration progress, adaptations and completions surface in real time.
  useEffect(() => {
    if (!sessionId) return;
    const src = new EventSource(
      apiUrl(
        `/api/assistant/live/${encodeURIComponent(sessionId)}/events`,
      ),
    );
    const push = (text: string) =>
      setLiveEvents((prev) =>
        [
          {
            id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            time: new Date().toLocaleTimeString(),
            text,
          },
          ...prev,
        ].slice(0, 30),
      );
    // The server sends named SSE events ("event: workflow.iteration.started"
    // with the payload as data:), so listen per type rather than onmessage.
    const onWorkflowEvent = (type: string) => (e: MessageEvent) => {
      let payload = e.data;
      try {
        payload = JSON.stringify(JSON.parse(e.data)).slice(0, 120);
      } catch {}
      push(`${type}: ${payload}`);
    };
    const types = [
      "workflow.created",
      "workflow.iteration.started",
      "workflow.iteration.executor",
      "workflow.iteration.completed",
      "workflow.iteration.failed",
      "workflow.stopped",
      "workflow.error",
      "goal.changed",
      "goal.clarification",
    ];
    const listeners = types.map((t) => {
      const fn = onWorkflowEvent(t);
      src.addEventListener(t, fn as EventListener);
      return [t, fn] as const;
    });
    src.onerror = () => {
      // SSE is best-effort; the run buttons work without it.
    };
    return () => {
      listeners.forEach(([t, fn]) =>
        src.removeEventListener(t, fn as EventListener),
      );
      src.close();
    };
  }, [sessionId]);

  /** Run once on the real device (REAL execution via the device executor). */
  const runOnce = async (workflow: AssistantWorkflow) => {
    setError("");
    setRunningId(workflow.id);
    try {
      await apiRequest(
        `/api/assistant/workflows/${workflow.id}/run?sessionId=${encodeURIComponent(sessionId)}`,
        {
          method: "POST",
          body: JSON.stringify({
            targetDevice,
            deviceId:
              targetDevice === "android" ? selectedAdbDevice || null : null,
          }),
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunningId(null);
      void loadWorkflows();
    }
  };

  const stopWorkflow = async (workflow: AssistantWorkflow) => {
    stopRef.current = true;
    setLiveAwareId(null);
    try {
      await apiRequest(
        `/api/assistant/workflows/${workflow.id}/stop?sessionId=${encodeURIComponent(sessionId)}`,
        { method: "POST" },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stop failed");
    } finally {
      void loadWorkflows();
    }
  };

  /**
   * AI repeat with live awareness: before every iteration the client captures
   * the screen, the planner re-grounds the workflow's steps against the fresh
   * screenshot (moved targets get new coordinates, vanished ones are skipped
   * with reasons), then the adapted steps execute for real. Nothing blind.
   */
  const repeatLiveAware = async (workflow: AssistantWorkflow) => {
    setError("");
    stopRef.current = false;
    setLiveAwareId(workflow.id);
    const push = (text: string) =>
      setLiveEvents((prev) =>
        [
          {
            id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            time: new Date().toLocaleTimeString(),
            text,
          },
          ...prev,
        ].slice(0, 30),
      );
    try {
      for (let iter = 1; iter <= repeatCount; iter++) {
        if (stopRef.current) {
          push(`live-aware repeat stopped by user after ${iter - 1} iterations`);
          break;
        }
        push(`— iteration ${iter}/${repeatCount}: capturing screen…`);
        // 1. Fresh eyes — ADB capture on the selected device for Android,
        // desktop capture otherwise.
        const captureUrl =
          targetDevice === "android"
            ? `/api/adb/capture${selectedAdbDevice ? `?deviceId=${encodeURIComponent(selectedAdbDevice)}` : ""}`
            : `/api/capture-screen`;
        const cap = await apiRequest<{ imageData?: string }>(captureUrl).catch(
          () => ({} as { imageData?: string }),
        );
        if (!cap.imageData) {
          push(`iteration ${iter}: no screen capture available — skipping`);
          continue;
        }
        const perception = await apiRequest<{ report: any }>(
          `/api/ai/describe-screen`,
          {
            method: "POST",
            body: JSON.stringify({ imageData: cap.imageData }),
          },
        ).catch(() => null);
        if (!perception?.report) {
          push(`iteration ${iter}: perception failed — watching only`);
          continue;
        }
        // 2. Adapt steps to the fresh screenshot.
        const adapt = await apiRequest<{
          adaptedSteps: { stepId: string; title: string; action: any }[];
          refinement: { title: string; status: string; reason: string }[];
          droppedCount: number;
        }>(
          `/api/assistant/workflows/${workflow.id}/adapt-steps?sessionId=${encodeURIComponent(sessionId)}`,
          {
            method: "POST",
            body: JSON.stringify({ perceptionReport: perception.report }),
          },
        );
        const kept = adapt.refinement.filter((r) => r.status === "kept").length;
        const moved = adapt.refinement.filter(
          (r) => r.status === "regrounded",
        ).length;
        push(
          `iteration ${iter}: adapted ${adapt.adaptedSteps.length} steps ` +
            `(${kept} stable, ${moved} re-grounded, ${adapt.droppedCount} dropped)`,
        );
        for (const r of adapt.refinement.filter(
          (x) => x.status !== "kept",
        )) {
          push(`  · ${r.status}: ${r.title} — ${r.reason}`);
        }
        // 3. Execute the adapted steps for real, preserving each step's
        // action semantics (typing, keys, waits, screenshots, right-click).
        // Unknown action types are skipped honestly — never invented as clicks.
        const shortcutToKeys: Record<string, string> = {
          back: "alt+Left",
          forward: "alt+Right",
          home: "win+d",
          refresh: "f5",
        };
        const iterSteps: { action: string; title: string }[] = [];
        let iterSuccess = true;
        for (const s of adapt.adaptedSteps) {
          if (stopRef.current) break;
          const a = s.action ?? {};
          const task: any = {
            id: `liveaware_${Date.now()}_${s.stepId}`,
            name: s.title,
            delayMs: a.durationMs ?? 400,
          };
          let skipReason = "";
          switch (a.type) {
            case "click":
              task.action = a.button === "right" ? "right_click" : "click";
              task.targetPosition = { x: a.x ?? 960, y: a.y ?? 540 };
              break;
            case "type":
              if (!a.text) {
                skipReason = "empty text — refusing to type nothing";
                break;
              }
              task.action = "type_text";
              task.textPayload = a.text;
              task.targetPosition = { x: a.x ?? 960, y: a.y ?? 540 };
              break;
            case "key":
              task.action = "press_key";
              task.keyPayload = a.key || "enter";
              break;
            case "wait":
              task.action = "wait";
              task.delayMs = a.durationMs ?? 800;
              break;
            case "screenshot":
              task.action = "screenshot";
              break;
            case "navigate-shortcut":
              task.action = "press_key";
              task.keyPayload = shortcutToKeys[a.shortcut] ?? "f5";
              break;
            default:
              skipReason = `unsupported action type "${a.type}" — skipped, not invented as a click`;
          }
          if (skipReason) {
            push(`  ! step skipped: ${s.title} — ${skipReason}`);
            continue;
          }
          const execRes = await apiRequest<{ success: boolean; error?: string }>(
            `/api/execute-task`,
            {
              method: "POST",
              body: JSON.stringify({
                targetDevice,
                deviceId:
                  targetDevice === "android" ? selectedAdbDevice || null : null,
                task,
              }),
            },
          ).catch((e) => ({ success: false, error: String(e) }));
          if (!execRes.success) {
            push(
              `  ✗ step failed: ${s.title} — ${String(execRes.error || "unknown").slice(0, 80)}`,
            );
            iterSuccess = false;
            iterSteps.push({ action: String(a.type), title: s.title });
            break;
          }
          iterSteps.push({ action: String(a.type), title: s.title });
          await new Promise((r) => setTimeout(r, 450));
        }
        // Learn from every iteration so the method library improves.
        try {
          await apiRequest(`/api/assistant/method-learning/learn-inline`, {
            method: "POST",
            body: JSON.stringify({
              sessionId,
              context: {
                applicationName: "workflow-live-aware-repeat",
                userIntent: `Live-aware repeat of workflow ${workflow.id}`,
                deviceType: targetDevice,
              },
              outcome: {
                success: iterSuccess,
                durationMs: 1000,
                steps: iterSteps,
                notes: [
                  `iteration ${iter}: ${iterSteps.length} steps, ${adapt.droppedCount} dropped by re-grounding`,
                ],
              },
            }),
          });
        } catch {}
        push(`iteration ${iter} complete`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Live-aware repeat failed");
    } finally {
      setLiveAwareId(null);
      void loadWorkflows();
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-950/70 text-slate-100">
      <CardHeader>
        <CardTitle>Workflow library</CardTitle>
        <CardDescription className="text-slate-400">
          Saved workflows from recordings.{" "}
          <span className="text-red-400 font-semibold">Run</span> drives the
          real device;{" "}
          <span className="text-cyan-400 font-semibold">live-aware repeat</span>{" "}
          re-grounds every step against a fresh screenshot before each
          iteration.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <Input
            value={sessionId}
            onChange={(event) => setSessionId(event.target.value)}
            placeholder="Assistant session ID"
            aria-label="Assistant session ID"
            className="border-slate-700 bg-slate-900"
          />
          <Button onClick={loadWorkflows} disabled={!sessionId || loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Load
          </Button>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Device:</span>
            <Button
              size="sm"
              variant={targetDevice === "desktop" ? "default" : "outline"}
              onClick={() => setTargetDevice("desktop")}
            >
              PC
            </Button>
            <Button
              size="sm"
              variant={targetDevice === "android" ? "default" : "outline"}
              onClick={() => setTargetDevice("android")}
            >
              Android
            </Button>
          </div>
          {targetDevice === "android" && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>Device:</span>
              <select
                value={selectedAdbDevice}
                onChange={(e) => setSelectedAdbDevice(e.target.value)}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                aria-label="Android device"
              >
                {adbDevices.length === 0 && (
                  <option value="">No ADB devices found</option>
                )}
                {adbDevices.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Repeat:</span>
            <Input
              type="number"
              min={1}
              max={50}
              value={repeatCount}
              onChange={(e) =>
                setRepeatCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))
              }
              className="w-16 border-slate-700 bg-slate-900"
              aria-label="Repeat count"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {!workflows.length && !error && (
          <p className="text-sm text-slate-400">
            Enter a session ID to view its saved workflows. Record something
            first, then use “Save as workflow”.
          </p>
        )}
        {workflows.map((workflow) => {
          const busy = runningId === workflow.id || liveAwareId === workflow.id;
          return (
            <div
              key={workflow.id}
              className="rounded-lg border border-slate-800 bg-slate-900/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{workflow.name}</h3>
                  <p className="text-sm text-slate-400">
                    {workflow.description || "No description"}
                  </p>
                </div>
                <Badge
                  variant={workflow.status === "paused" ? "secondary" : "default"}
                >
                  {workflow.status}
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                <span>Repeat count: {workflow.repeatCount}</span>
                <span className="flex items-center gap-1">
                  <CalendarClock className="h-4 w-4" />
                  Next run:{" "}
                  {workflow.schedule.nextRunAt
                    ? new Date(workflow.schedule.nextRunAt).toLocaleString()
                    : "Not scheduled"}
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark className="h-4 w-4" />
                  Checkpoints: {workflow.checkpointIds.length}
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  Resume: {workflow.pauseResumePolicy.resumeMode}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => void runOnce(workflow)}
                  disabled={busy}
                  title={`Run this workflow once for real on ${targetDevice}`}
                  className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold"
                >
                  <Play className="mr-1 h-3.5 w-3.5" /> Run once
                  <Badge className="ml-1 bg-red-900 text-white text-[8px] px-1 py-0 h-4">
                    REAL
                  </Badge>
                </Button>
                <Button
                  size="sm"
                  onClick={() => void repeatLiveAware(workflow)}
                  disabled={busy}
                  title={`Repeat ${repeatCount}× — before each iteration the AI re-grounds steps against a fresh screenshot`}
                  className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold"
                >
                  <Repeat className="mr-1 h-3.5 w-3.5" /> Repeat ×{repeatCount}{" "}
                  live-aware
                  <Badge className="ml-1 bg-cyan-900 text-white text-[8px] px-1 py-0 h-4">
                    AI
                  </Badge>
                </Button>
                {busy && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void stopWorkflow(workflow)}
                    className="text-xs font-bold"
                  >
                    <Square className="mr-1 h-3.5 w-3.5" /> Stop
                  </Button>
                )}
              </div>
              {workflow.goals.map((goal) => {
                const percent = goal.total
                  ? (goal.completed / goal.total) * 100
                  : 0;
                return (
                  <div key={goal.goalId} className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-slate-400">
                      <span>{goal.title}</span>
                      <span>
                        {goal.completed}/{goal.total}
                      </span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>
                );
              })}
            </div>
          );
        })}
        {liveEvents.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-black/40 p-3">
            <h4 className="mb-2 flex items-center gap-1 text-xs font-bold text-cyan-300">
              <Eye className="h-3.5 w-3.5" /> Live awareness feed
            </h4>
            <div className="max-h-40 space-y-1 overflow-auto font-mono text-[11px] text-slate-300">
              {liveEvents.map((e) => (
                <div key={e.id}>
                  <span className="text-slate-500">{e.time}</span> {e.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
