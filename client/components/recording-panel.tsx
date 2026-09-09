import {
  Camera,
  Circle,
  FileText,
  Keyboard,
  MousePointer2,
  Play,
  Square,
  StickyNote,
} from "lucide-react";
import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { RecordedAction, RecordedSession } from "@shared/recordings";

const source = (): RecordedAction["source"] => ({
  source: "browser-panel",
  appId: "highdeff-droid",
  pagePath: window.location.pathname,
  userAgent: navigator.userAgent,
  sensitiveInputCaptured: false,
});

const actionId = () =>
  `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function RecordingPanel() {
  const [recording, setRecording] = useState<RecordedSession>();
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState(false);
  const [result, setResult] = useState("");
  const lastMove = useRef(0);
  const appendQueue = useRef(Promise.resolve());

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`/api/assistant/recordings${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Recording request failed");
    return body;
  }

  async function start() {
    const body = await request<{ recording: RecordedSession }>("/start", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "browser",
        name: `Browser session ${new Date().toLocaleTimeString()}`,
        source: source(),
      }),
    });
    setRecording(body.recording);
    setResult("");
  }

  async function stop() {
    if (!recording) return;
    const body = await request<{ recording: RecordedSession }>(
      `/${recording.id}/stop`,
      { method: "POST" },
    );
    setRecording(body.recording);
  }

  function append(event: RecordedAction) {
    appendQueue.current = appendQueue.current.then(async () => {
      if (!recording || recording.status !== "recording") return;
      const body = await request<{ recording: RecordedSession }>(
        `/${recording.id}/events`,
        { method: "POST", body: JSON.stringify({ events: [event] }) },
      );
      setRecording(body.recording);
    });
    return appendQueue.current;
  }

  async function addNote() {
    if (!note.trim()) return;
    await append({
      id: actionId(),
      timestamp: new Date().toISOString(),
      source: source(),
      type: "note",
      text: note.trim(),
    });
    setNote("");
  }

  async function addCheckpoint() {
    await append({
      id: actionId(),
      timestamp: new Date().toISOString(),
      source: source(),
      type: "screenshot-checkpoint",
      label: `Checkpoint ${new Date().toLocaleTimeString()}`,
    });
  }

  async function makePreview(kind: "operation-pack" | "plan-draft") {
    if (!recording) return;
    const body = await request<{
      operationPack?: unknown;
      planDraft?: unknown;
    }>(`/${recording.id}/${kind}`, { method: "POST" });
    setResult(JSON.stringify(body.operationPack ?? body.planDraft, null, 2));
    setPreview(true);
  }

  return (
    <main className="min-h-screen bg-[#0b1020] p-5 text-slate-100 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Safe interaction capture
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Action recording
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Capture events only inside this panel. Replay is always a review
              preview; this foundation never executes recorded actions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {recording && (
              <Badge className="border-white/10 bg-white/5 text-slate-300">
                {recording.status === "recording" ? (
                  <Circle className="mr-1 h-3 w-3 fill-rose-400 text-rose-400" />
                ) : (
                  "Stopped · "
                )}
                {recording.events.length} events
              </Badge>
            )}
            {!recording || recording.status === "stopped" ? (
              <Button onClick={start}>
                <Circle className="h-4 w-4 fill-current" /> Start recording
              </Button>
            ) : (
              <Button variant="destructive" onClick={stop}>
                <Square className="h-4 w-4" /> Stop recording
              </Button>
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card
            tabIndex={0}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              void append({
                id: actionId(),
                timestamp: new Date().toISOString(),
                source: source(),
                type: "mouse-click",
                x: Math.round(event.clientX - rect.left),
                y: Math.round(event.clientY - rect.top),
                button: "left",
                target: "recording-panel",
              });
            }}
            onMouseMove={(event) => {
              const now = Date.now();
              if (now - lastMove.current < 100) return;
              lastMove.current = now;
              const rect = event.currentTarget.getBoundingClientRect();
              void append({
                id: actionId(),
                timestamp: new Date().toISOString(),
                source: source(),
                type: "mouse-move",
                x: Math.round(event.clientX - rect.left),
                y: Math.round(event.clientY - rect.top),
                target: "recording-panel",
              });
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              void append({
                id: actionId(),
                timestamp: new Date().toISOString(),
                source: source(),
                type: "keyboard-key",
                key: event.key,
                code: event.code,
                modifiers: [
                  event.ctrlKey ? "Ctrl" : "",
                  event.altKey ? "Alt" : "",
                  event.shiftKey ? "Shift" : "",
                  event.metaKey ? "Meta" : "",
                ].filter(Boolean),
                sensitive: false,
              });
            }}
            className="border-cyan-400/20 bg-[#10172a] outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MousePointer2 className="h-5 w-5 text-cyan-300" />
                Recording surface
              </CardTitle>
              <p className="text-sm text-slate-400">
                Focus this surface before pressing keys. Text values are never
                captured by the panel.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-cyan-400/30 bg-cyan-400/5 text-center text-sm text-slate-400">
                Click, move, or press a key here to add a normalized event.
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#10172a]">
            <CardHeader>
              <CardTitle className="text-lg">Review tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={addCheckpoint}
                  disabled={!recording}
                >
                  <Camera className="h-4 w-4" /> Checkpoint
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPreview((value) => !value)}
                  disabled={!recording}
                >
                  <Play className="h-4 w-4" /> Preview
                </Button>
              </div>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add a review note..."
                className="border-white/10 bg-white/5"
              />
              <Button
                variant="secondary"
                className="w-full"
                onClick={addNote}
                disabled={!recording || !note.trim()}
              >
                <StickyNote className="h-4 w-4" /> Add note
              </Button>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() => void makePreview("operation-pack")}
                  disabled={!recording}
                >
                  <FileText className="h-4 w-4" /> Operation pack
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void makePreview("plan-draft")}
                  disabled={!recording}
                >
                  <Keyboard className="h-4 w-4" /> Plan draft
                </Button>
              </div>
              {preview && (
                <p className="rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200">
                  Preview-only mode. Nothing will be sent to a device or
                  browser.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#10172a]">
          <CardHeader>
            <CardTitle className="text-lg">Event timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {!recording?.events.length ? (
              <p className="text-sm text-slate-500">
                Start a recording to see events here.
              </p>
            ) : (
              <div className="space-y-2">
                {recording.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-md border border-white/5 bg-white/[0.03] px-3 py-2 text-sm"
                  >
                    <Badge variant="outline">{event.type}</Badge>
                    <span className="text-slate-300">
                      {event.type === "note"
                        ? event.text
                        : event.type === "screenshot-checkpoint"
                          ? event.label
                          : event.type === "keyboard-key"
                            ? event.key
                            : event.type === "wait"
                              ? `${event.durationMs}ms`
                              : event.type === "mouse-click" ||
                                  event.type === "mouse-move"
                                ? `(${event.x}, ${event.y})`
                                : "redacted input"}
                    </span>
                    <span className="ml-auto text-xs text-slate-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {result && (
              <pre className="mt-4 max-h-52 overflow-auto rounded-md bg-black/30 p-3 text-xs text-slate-400">
                {result}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
