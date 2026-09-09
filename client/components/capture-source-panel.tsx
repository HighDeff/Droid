import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Monitor,
  RefreshCw,
  Smartphone,
  Unplug,
} from "lucide-react";
import type { CaptureSource } from "@shared/assistant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SourceResponse {
  success: boolean;
  sources?: CaptureSource[];
  source?: CaptureSource;
  error?: string;
}

export function CaptureSourcePanel() {
  const [sources, setSources] = useState<CaptureSource[]>([]);
  const [selectedId, setSelectedId] = useState("desktop");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/assistant/sources");
      const data = (await response.json()) as SourceResponse;
      if (!response.ok || !data.success)
        throw new Error(data.error || "Unable to load capture sources");
      setSources(data.sources ?? []);
      setError(undefined);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load capture sources",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  const selected = sources.find((source) => source.id === selectedId);
  const updateSource = async (action: "connect" | "disconnect" | "capture") => {
    if (!selected) return;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/assistant/sources/${encodeURIComponent(selected.id)}/${action}`,
        {
          method: "POST",
        },
      );
      const data = (await response.json()) as SourceResponse;
      if (!response.ok || !data.success)
        throw new Error(data.error || `Unable to ${action} source`);
      await loadSources();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : `Unable to ${action} source`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-300">Capture source</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Choose what the assistant can see.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-500 hover:text-slate-200"
          onClick={() => void loadSources()}
          disabled={loading}
          aria-label="Refresh capture sources"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {sources.map((source) => {
          const Icon = source.kind === "desktop" ? Monitor : Smartphone;
          const isSelected = source.id === selectedId;
          return (
            <button
              key={source.id}
              type="button"
              onClick={() => setSelectedId(source.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                isSelected
                  ? "border-cyan-300/40 bg-cyan-300/10"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-cyan-300" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-slate-200">
                  {source.name}
                </span>
                <span className="block truncate text-[11px] text-slate-500">
                  {source.detail}
                </span>
              </span>
              <Badge
                className={cn(
                  "border text-[10px]",
                  source.connectionState === "connected" &&
                    "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
                  source.connectionState === "error" &&
                    "border-rose-400/20 bg-rose-400/10 text-rose-300",
                  source.connectionState === "disconnected" &&
                    "border-white/10 bg-white/5 text-slate-400",
                )}
              >
                {source.connectionState}
              </Badge>
            </button>
          );
        })}
        {!loading && sources.length === 0 && (
          <p className="text-xs text-slate-500">
            No capture sources available.
          </p>
        )}
      </div>

      {selected && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            className="h-8 bg-cyan-400 text-xs text-slate-950 hover:bg-cyan-300"
            onClick={() =>
              void updateSource(
                selected.connectionState === "connected"
                  ? "capture"
                  : "connect",
              )
            }
            disabled={busy}
          >
            {selected.connectionState === "connected"
              ? "Capture frame"
              : "Connect"}
          </Button>
          {selected.connectionState === "connected" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-white/10 bg-white/[0.03] text-xs text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={() => void updateSource("disconnect")}
              disabled={busy}
            >
              <Unplug className="mr-1.5 h-3.5 w-3.5" /> Disconnect
            </Button>
          )}
        </div>
      )}

      {selected?.lastFrameAt && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Last frame {new Date(selected.lastFrameAt).toLocaleString()}
        </p>
      )}
      {(error || selected?.error) && (
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-rose-300">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error || selected?.error}
        </p>
      )}
    </div>
  );
}
