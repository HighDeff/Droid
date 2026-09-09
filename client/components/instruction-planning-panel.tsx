import { useState } from "react";
import type { AssistantPlan, PlannedStep, TimingHint } from "@shared/assistant";
import { Check, Pencil, ShieldAlert, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ExecutionControlPanel } from "@/components/execution-control-panel";

const timingOptions: TimingHint[] = ["now", "soon", "scheduled", "when_ready"];

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Request failed");
  return body;
}

export function InstructionComposer({
  instruction,
  onInstructionChange,
  onSubmit,
  busy,
}: {
  instruction: string;
  onInstructionChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-200">
            Prepare a safe plan
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Describe the outcome you want. This stage only proposes steps; it
            never sends input or runs device actions.
          </p>
          <Textarea
            value={instruction}
            onChange={(event) => onInstructionChange(event.target.value)}
            placeholder="e.g. Find the primary action and explain what needs attention."
            className="mt-3 min-h-24 border-white/10 bg-[#0d1528] text-slate-100 placeholder:text-slate-600"
            maxLength={4000}
          />
          <Button
            onClick={onSubmit}
            disabled={busy || !instruction.trim()}
            className="mt-3 bg-cyan-400 text-slate-950 hover:bg-cyan-300"
          >
            {busy ? "Preparing…" : "Prepare plan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PlanReview({
  plan,
  onChange,
  onApprove,
  onReject,
  busy,
}: {
  plan: AssistantPlan;
  onChange: (plan: AssistantPlan) => void;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  const updateStep = (stepId: string, patch: Partial<PlannedStep>) => {
    onChange({
      ...plan,
      steps: plan.steps.map((step) =>
        step.id === stepId ? { ...step, ...patch, status: "edited" } : step,
      ),
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-200">Plan review</p>
          <p className="mt-1 text-xs text-slate-500">
            Nothing executes until you explicitly approve this exact plan.
          </p>
        </div>
        <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-300">
          {plan.approvalState.replace("_", " ")}
        </Badge>
      </div>
      <div className="mt-4 space-y-3">
        {plan.steps.map((step) => (
          <div
            key={step.id}
            className="rounded-lg border border-white/10 bg-[#0d1528] p-3"
          >
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-300/10 text-cyan-300">
                {step.order}
              </span>
              <Pencil className="h-3 w-3" /> Editable proposal
            </div>
            <Input
              value={step.title}
              onChange={(event) =>
                updateStep(step.id, { title: event.target.value })
              }
              className="mt-2 border-white/10 bg-transparent font-medium text-slate-200"
              aria-label={`Step ${step.order} title`}
            />
            <Textarea
              value={step.description}
              onChange={(event) =>
                updateStep(step.id, { description: event.target.value })
              }
              className="mt-2 min-h-16 border-white/10 bg-transparent text-xs leading-5 text-slate-400"
              aria-label={`Step ${step.order} description`}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-[11px] text-slate-500">
                Timing
                <select
                  value={step.timing}
                  onChange={(event) =>
                    updateStep(step.id, {
                      timing: event.target.value as TimingHint,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#121b31] px-2 py-1.5 text-xs text-slate-300"
                >
                  {timingOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] text-slate-500">
                Confidence ({Math.round(step.confidence * 100)}%)
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={step.confidence}
                  onChange={(event) =>
                    updateStep(step.id, {
                      confidence: Number(event.target.value),
                    })
                  }
                  className="mt-3 w-full accent-cyan-300"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-5 text-amber-200">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {plan.risks[0]?.description ??
            "Review scope and prerequisites before approval."}
        </span>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          onClick={onApprove}
          disabled={busy}
          className="flex-1 bg-emerald-400 text-slate-950 hover:bg-emerald-300"
        >
          <Check className="h-4 w-4" /> Approve plan
        </Button>
        <Button
          onClick={onReject}
          disabled={busy}
          variant="outline"
          className="border-white/10 text-slate-300 hover:bg-white/10"
        >
          <X className="h-4 w-4" /> Reject
        </Button>
      </div>
    </div>
  );
}

export function InstructionPlanningPanel() {
  const [instruction, setInstruction] = useState("");
  const [plan, setPlan] = useState<AssistantPlan>();
  const [sessionId, setSessionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ensureSession = async () => {
    if (sessionId) return sessionId;
    const response = await request<{ session: { id: string } }>(
      "/api/assistant/sessions",
      {
        method: "POST",
        body: JSON.stringify({
          project: {
            name: "Research sprint",
            description: "Instruction planning workspace",
          },
          goals: [],
          savedStateIds: [],
        }),
      },
    );
    setSessionId(response.session.id);
    return response.session.id;
  };

  const prepare = async () => {
    setBusy(true);
    setError("");
    try {
      const id = await ensureSession();
      const response = await request<{ plan: AssistantPlan }>(
        "/api/assistant/plans",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: id, instructionText: instruction }),
        },
      );
      setPlan(response.plan);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not prepare plan",
      );
    } finally {
      setBusy(false);
    }
  };

  const savePlan = async (
    nextPlan: AssistantPlan,
    action?: "approve" | "reject",
  ) => {
    setBusy(true);
    setError("");
    try {
      const query = `?sessionId=${encodeURIComponent(nextPlan.sessionId)}`;
      const edited = await request<{ plan: AssistantPlan }>(
        `/api/assistant/plans/${nextPlan.id}${query}`,
        {
          method: "PUT",
          body: JSON.stringify({
            steps: nextPlan.steps,
            timing: nextPlan.timing,
            confidence: nextPlan.confidence,
          }),
        },
      );
      let current = edited.plan;
      if (action) {
        const response = await request<{ plan: AssistantPlan }>(
          `/api/assistant/plans/${current.id}/${action}${query}`,
          {
            method: "POST",
          },
        );
        current = response.plan;
      }
      setPlan(current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save plan");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5">
      <InstructionComposer
        instruction={instruction}
        onInstructionChange={setInstruction}
        onSubmit={prepare}
        busy={busy}
      />
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      {plan && (
        <>
          <PlanReview
            plan={plan}
            onChange={setPlan}
            onApprove={() => void savePlan(plan, "approve")}
            onReject={() => void savePlan(plan, "reject")}
            busy={busy}
          />
          {plan.approvalState === "approved" && (
            <ExecutionControlPanel plan={plan} />
          )}
        </>
      )}
    </div>
  );
}
