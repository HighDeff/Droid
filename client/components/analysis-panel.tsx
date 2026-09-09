import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, History, ScanSearch } from "lucide-react";

import type { FrameAnalysis } from "@shared/assistant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface AnalysisPanelProps {
  captureId?: string;
  sessionId?: string;
  imageData?: string;
  imageRef?: string;
}

interface AnalysisResponse {
  success: boolean;
  analysis?: FrameAnalysis;
  analyses?: FrameAnalysis[];
  error?: string;
}

export function AnalysisPanel({
  captureId,
  sessionId,
  imageData: initialImageData = "",
  imageRef: initialImageRef = "",
}: AnalysisPanelProps) {
  const [imageData, setImageData] = useState(initialImageData);
  const [imageRef, setImageRef] = useState(initialImageRef);
  const [analysis, setAnalysis] = useState<FrameAnalysis>();
  const [history, setHistory] = useState<FrameAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const params = new URLSearchParams();
    if (captureId) params.set("captureId", captureId);
    if (sessionId) params.set("sessionId", sessionId);
    fetch(`/api/assistant/analysis/history?${params}`)
      .then(async (response) => {
        const payload = (await response.json()) as AnalysisResponse;
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Unable to load analysis history");
        }
        setHistory(payload.analyses ?? []);
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error ? reason.message : "History unavailable",
        );
      });
  }, [captureId, sessionId]);

  const analyze = async () => {
    if (!imageData.trim() && !imageRef.trim()) {
      setError("Add captured image data or an image reference first.");
      return;
    }
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/assistant/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captureId,
          sessionId,
          imageData: imageData.trim() || undefined,
          imageRef: imageRef.trim() || undefined,
        }),
      });
      const payload = (await response.json()) as AnalysisResponse;
      if (!response.ok || !payload.success || !payload.analysis) {
        throw new Error(payload.error ?? "Analysis failed");
      }
      setAnalysis(payload.analysis);
      setHistory((current) => [payload.analysis!, ...current]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const displayedAnalysis = analysis ?? history[0];
  const confidence = Math.round((displayedAnalysis?.confidence ?? 0) * 100);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#121b31] p-5 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ScanSearch className="h-4 w-4 text-cyan-300" />
            <h2 className="text-sm font-medium text-slate-100">
              Frame analysis
            </h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Safe OCR foundation: analysis reports what is known without taking
            actions on the captured screen.
          </p>
        </div>
        {displayedAnalysis && (
          <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-200">
            {displayedAnalysis.status}
          </Badge>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <input
          value={imageRef}
          onChange={(event) => setImageRef(event.target.value)}
          placeholder="Captured image reference"
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
        />
        <input
          value={imageData}
          onChange={(event) => setImageData(event.target.value)}
          placeholder="Captured image data (data URL)"
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
        />
        <Button
          onClick={analyze}
          disabled={isLoading}
          className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
        >
          {isLoading ? "Analyzing..." : "Analyze frame"}
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-300">OCR text</p>
            <span className="text-[11px] text-slate-500">
              {displayedAnalysis?.ocrText.length ?? 0} blocks
            </span>
          </div>
          {displayedAnalysis?.ocrText.length ? (
            <div className="mt-3 space-y-2">
              {displayedAnalysis.ocrText.map((block) => (
                <div
                  key={block.id}
                  className="rounded-md bg-white/5 p-2 text-sm text-slate-200"
                >
                  {block.text}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No OCR text reported. The current deterministic fallback does not
              claim that OCR succeeded.
            </p>
          )}
          {displayedAnalysis?.notes.map((note) => (
            <p key={note} className="mt-3 text-xs leading-5 text-slate-500">
              {note}
            </p>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-medium text-slate-300">Confidence</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">
            {confidence}%
          </p>
          <Progress
            value={confidence}
            className="mt-3 h-1.5 bg-slate-800 [&>div]:bg-cyan-300"
          />
          <div className="mt-5 space-y-2 text-xs text-slate-500">
            <p>
              Detected elements:{" "}
              <span className="text-slate-300">
                {displayedAnalysis?.detectedElements.length ?? 0}
              </span>
            </p>
            <p>
              Regions of interest:{" "}
              <span className="text-slate-300">
                {displayedAnalysis?.regionsOfInterest.length ?? 0}
              </span>
            </p>
            <p>
              Provider:{" "}
              <span className="text-slate-300">
                {displayedAnalysis?.provider ?? "—"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <History className="h-3.5 w-3.5 text-cyan-300" /> Analysis history
        </div>
        {history.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {history.slice(0, 6).map((entry) => (
              <button
                key={entry.id}
                onClick={() => setAnalysis(entry)}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left hover:bg-white/[0.06]"
              >
                <span>
                  <span className="block text-xs text-slate-300">
                    {new Date(entry.analyzedAt).toLocaleString()}
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    {entry.provider} · {entry.detectedElements.length} elements
                  </span>
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            No analyses are linked to this capture yet.
          </p>
        )}
      </div>
    </section>
  );
}
