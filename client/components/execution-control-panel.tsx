import { useEffect, useState } from "react";
import type { AssistantExecution, AssistantPlan } from "@shared/assistant";
import { AlertTriangle, CheckCircle2, Pause, Play, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Execution request failed");
  return body;
}

export function ExecutionControlPanel({ plan }: { plan: AssistantPlan }) {
  const [execution, setExecution] = useState<AssistantExecution>();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (
      !execution ||
      ["completed", "cancelled", "failed"].includes(execution.status)
    )
      return;
    const timer = window.setInterval(async () => {
      try {
        const response = await request<{ execution: AssistantExecution }>(
          `/api/assistant/execution/${execution.id}`,
        );
        setExecution(response.execution);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not refresh execution",
        );
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [execution]);

  const run = async () => {
    setError("");
    try {
      const response = await request<{ execution: AssistantExecution }>(
        "/api/assistant/execution",
        {
          method: "POST",
          body: JSON.stringify({
            planId: plan.id,
            sessionId: plan.sessionId,
            confirmation: confirmed,
          }),
        },
      );
      setExecution(response.execution);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not start execution",
      );
    }
  };

  const control = async (name: "pause" | "cancel") => {
    if (!execution) return;
    setError("");
    try {
      const response = await request<{ execution: AssistantExecution }>(
        `/api/assistant/execution/${execution.id}/${name}`,
        { method: "POST" },
      );
      setExecution(response.execution);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update execution",
      );
    }
  };

  const approveAlternate = async () => {
    if (!execution?.pendingApproval?.alternateStepId) return;
    setError("");
    try {
      const response = await request<{ execution: AssistantExecution }>(
        `/api/assistant/execution/${execution.id}/approve-alternate`,
        {
          method: "POST",
          body: JSON.stringify({ confirmation: true }),
        },
      );
      setExecution(response.execution);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not select alternate",
      );
    }
  };

  const approvePending = async () => {
    if (!execution?.pendingApproval) return;
    setError("");
    try {
      const response = await request<{ execution: AssistantExecution }>(
        `/api/assistant/execution/${execution.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ confirmation: true }),
        },
      );
      setExecution(response.execution);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not approve execution",
      );
    }
  };

  const canExecute =
    plan.approvalState === "approved" &&
    plan.steps.every((step) => step.action);
  return (
    <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-200">Safe execution</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Only this approved plan and its allowlisted actions can run.
          </p>
        </div>
        <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
          {execution?.status ?? "awaiting confirmation"}
        </Badge>
      </div>
      {!execution && (
        <>
          <label className="mt-4 flex items-center gap-2 text-xs text-slate-300">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(value) => setConfirmed(value === true)}
            />
            I confirm this exact approved plan may execute.
          </label>
          <Button
            onClick={() => void run()}
            disabled={!confirmed || !canExecute}
            className="mt-3 bg-emerald-400 text-slate-950 hover:bg-emerald-300"
          >
            <Play className="h-4 w-4" /> Start execution
          </Button>
          {!canExecute && (
            <p className="mt-2 text-xs text-amber-300">
              Approve the plan and assign an allowlisted action to every step
              first.
            </p>
          )}
        </>
      )}
      {execution && (
        <>
          <p className="mt-3 text-xs text-slate-400">
            Current step:{" "}
            {Math.min(execution.currentStep, execution.totalSteps)} /{" "}
            {execution.totalSteps}
          </p>
          {execution.pendingApproval && (
            <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3">
              <div className="flex items-start gap-2 text-xs text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong>Approval required:</strong>{" "}
                  {execution.pendingApproval.reason}
                </span>
              </div>
              {execution.pendingApproval.alternateStepId && (
                <Button
                  onClick={() => void approveAlternate()}
                  size="sm"
                  className="mt-3 bg-amber-300 text-slate-950 hover:bg-amber-200"
                >
                  Approve alternate step
                </Button>
              )}
              {!execution.pendingApproval.alternateStepId && (
                <Button
                  onClick={() => void approvePending()}
                  size="sm"
                  className="mt-3 bg-amber-300 text-slate-950 hover:bg-amber-200"
                >
                  Approve and continue
                </Button>
              )}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            {execution.status === "paused" && (
              <Button
                onClick={() => void run()}
                size="sm"
                className="bg-cyan-400 text-slate-950"
              >
                <Play className="h-4 w-4" /> Resume
              </Button>
            )}
            {execution.status === "running" && (
              <Button
                onClick={() => void control("pause")}
                size="sm"
                variant="outline"
              >
                <Pause className="h-4 w-4" /> Pause
              </Button>
            )}
            {!["completed", "cancelled", "failed"].includes(
              execution.status,
            ) && (
              <Button
                onClick={() => void control("cancel")}
                size="sm"
                variant="outline"
              >
                <Square className="h-4 w-4" /> Cancel
              </Button>
            )}
          </div>
          <div className="mt-3 max-h-36 space-y-1 overflow-auto text-xs">
            {execution.timeline.map((event) => (
              <p key={event.id} className="flex gap-2 text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                {event.message}
              </p>
            ))}
          </div>
          {execution.evidence.length > 0 && (
            <div className="mt-3 rounded-lg border border-cyan-300/10 bg-cyan-300/5 p-3">
              <p className="text-xs font-medium text-cyan-200">
                Evidence frames
              </p>
              <div className="mt-2 space-y-2">
                {execution.evidence.map((evidence) => (
                  <div key={evidence.id} className="text-xs text-slate-400">
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        Attempt {evidence.attempt} ·{" "}
                        {evidence.verification.status}
                      </span>
                      <span className="text-slate-600">
                        {new Date(evidence.capturedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      {evidence.verification.reason}
                    </p>
                    {evidence.capture?.imageData && (
                      <img
                        src={evidence.capture.imageData}
                        alt={`Evidence for ${evidence.stepId}, attempt ${evidence.attempt}`}
                        className="mt-2 max-h-28 rounded border border-white/10 object-contain"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </div>
  );
}
