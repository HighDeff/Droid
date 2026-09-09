import { useEffect, useState } from "react";
import type {
  WaitCondition,
  WaitConditionStatusEvent,
  WaitConditionType,
} from "@shared/assistant";
import { Clock3, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const types: WaitConditionType[] = [
  "visible_text",
  "region",
  "close_control",
  "next_control",
  "timer",
  "page_load_stable",
];

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Request failed");
  return body;
}

export function WaitConditionPanel({
  sessionId,
  onConditionCreated,
}: {
  sessionId: string;
  onConditionCreated?: (condition: WaitCondition) => void;
}) {
  const [type, setType] = useState<WaitConditionType>("visible_text");
  const [label, setLabel] = useState("Required screen signal");
  const [value, setValue] = useState("");
  const [timeoutMs, setTimeoutMs] = useState("30000");
  const [threshold, setThreshold] = useState("0.8");
  const [approved, setApproved] = useState(false);
  const [events, setEvents] = useState<WaitConditionStatusEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) return;
    void request<{ events: WaitConditionStatusEvent[] }>(
      `/api/assistant/conditions?sessionId=${encodeURIComponent(sessionId)}`,
    )
      .then((response) => setEvents(response.events))
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "Could not load status",
        ),
      );
  }, [sessionId]);

  const addCondition = async () => {
    setError("");
    const condition = {
      id: `condition_${Date.now()}`,
      type,
      label: label.trim() || "Reviewable wait condition",
      timeoutMs: Number(timeoutMs),
      pollIntervalMs: 500,
      confidenceThreshold: Number(threshold),
      approved,
      ...(type === "visible_text" ? { text: value.trim() || "Ready" } : {}),
      ...(type === "timer" ? { durationMs: Number(value) || 1000 } : {}),
      ...(type === "page_load_stable"
        ? { stableForMs: Number(value) || 1000 }
        : {}),
      ...(type === "close_control" || type === "next_control"
        ? { controlLabel: value.trim() || undefined }
        : {}),
      ...(type === "region"
        ? {
            region: {
              id: `region_${Date.now()}`,
              x: 0,
              y: 0,
              width: 100,
              height: 100,
            },
          }
        : {}),
    } satisfies Omit<WaitCondition, "sessionId">;
    try {
      const response = await request<{ condition: WaitCondition }>(
        `/api/assistant/conditions`,
        {
          method: "POST",
          body: JSON.stringify({ sessionId, condition }),
        },
      );
      onConditionCreated?.(response.condition);
      setValue("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save condition",
      );
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4">
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
        <div>
          <p className="text-sm font-medium text-slate-200">Wait conditions</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Conditions are reviewable gates only. Detected close/next controls
            are never clicked automatically.
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Condition label"
        />
        <select
          value={type}
          onChange={(event) => setType(event.target.value as WaitConditionType)}
          className="rounded-md border border-white/10 bg-[#121b31] px-2 text-xs text-slate-300"
        >
          {types.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={
            type === "visible_text"
              ? "Text to observe"
              : "Value / control label"
          }
        />
        <Input
          type="number"
          value={timeoutMs}
          onChange={(event) => setTimeoutMs(event.target.value)}
          min="1"
          max="120000"
          placeholder="Timeout (ms)"
        />
        <Input
          type="number"
          value={threshold}
          onChange={(event) => setThreshold(event.target.value)}
          min="0"
          max="1"
          step="0.05"
          placeholder="Confidence threshold"
        />
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={approved}
            onChange={(event) => setApproved(event.target.checked)}
            className="accent-cyan-300"
          />
          Approve this exact condition for the plan
        </label>
        <Button
          onClick={() => void addCondition()}
          disabled={!sessionId}
          className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
        >
          Add for review
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      <div className="mt-3 space-y-2">
        {events.length === 0 ? (
          <p className="text-xs text-slate-500">
            No condition status events yet.
          </p>
        ) : (
          events.slice(0, 5).map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-2 rounded-md border border-white/10 bg-[#0d1528] p-2 text-xs"
            >
              <Clock3 className="mt-0.5 h-3.5 w-3.5 text-slate-500" />
              <span className="flex-1 text-slate-300">
                {event.message}
                {event.suggestion ? ` ${event.suggestion}` : ""}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {event.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
