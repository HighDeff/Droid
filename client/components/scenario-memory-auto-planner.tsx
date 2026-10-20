import React, { useEffect, useState } from "react";
import {
  Brain,
  Sparkles,
  BookOpen,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";

interface LearnedMethod {
  id: string;
  name: string;
  description: string;
  successRate: number;
  totalExecutions: number;
  lastUsedAt: string;
  averageDuration: number;
  adaptationNotes: string[];
  similarMethods: string[];
  learnedFrom: string[];
  contexts: string[];
  efficiency: number;
  reliability: number;
}

/**
 * Method memory: shows the REAL methods the system has learned from actual
 * runs via the method-learning API. Previously this panel displayed
 * hardcoded fake scenarios ("42 executions, 97.6% success"); now every
 * number comes from the backend, and the empty state is honest.
 */
export const ScenarioMemoryAutoPlanner: React.FC = () => {
  const [methods, setMethods] = useState<LearnedMethod[]>([]);
  const [activeMethodId, setActiveMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [intent, setIntent] = useState("");
  const [bestMethodNote, setBestMethodNote] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  const loadMethods = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<{
        success: boolean;
        methods: LearnedMethod[];
      }>(`/api/assistant/method-learning/methods`);
      setMethods(data.methods ?? []);
      setActiveMethodId((prev) =>
        prev && data.methods?.some((m) => m.id === prev)
          ? prev
          : (data.methods?.[0]?.id ?? null),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load methods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMethods();
  }, []);

  const activeMethod = methods.find((m) => m.id === activeMethodId) ?? null;

  const handleFindBest = async () => {
    if (!intent.trim()) {
      setBestMethodNote("Describe what you want to do first.");
      return;
    }
    setLookingUp(true);
    setBestMethodNote("");
    try {
      const sessionId =
        localStorage.getItem("assistant_session_id") || "default";
      const data = await apiRequest<{
        success: boolean;
        bestMethod: LearnedMethod | null;
        hasMethod: boolean;
      }>(`/api/assistant/method-learning/best-method`, {
        method: "POST",
        body: JSON.stringify({
          context: {
            sessionId,
            userIntent: intent.trim(),
            deviceType: "desktop",
          },
        }),
      });
      if (data.hasMethod && data.bestMethod) {
        setBestMethodNote(
          `Best match: "${data.bestMethod.name}" — ${(data.bestMethod.successRate * 100).toFixed(0)}% success over ${data.bestMethod.totalExecutions} runs.`,
        );
        setActiveMethodId(data.bestMethod.id);
      } else {
        setBestMethodNote(
          "No learned method matches yet — run a workflow a few times to teach the system.",
        );
      }
    } catch (e) {
      setBestMethodNote(
        e instanceof Error ? e.message : "Best-method lookup failed",
      );
    } finally {
      setLookingUp(false);
    }
  };

  const totalRuns = methods.reduce((n, m) => n + m.totalExecutions, 0);
  const avgSuccess = methods.length
    ? methods.reduce((n, m) => n + m.successRate, 0) / methods.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Learned Methods
              </p>
              <h4 className="text-xl font-bold text-cyan-400 font-mono">
                {methods.length}
              </h4>
            </div>
            <Brain className="w-8 h-8 text-cyan-500/40" />
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">Total Runs</p>
              <h4 className="text-xl font-bold text-purple-400 font-mono">
                {totalRuns}
              </h4>
            </div>
            <History className="w-8 h-8 text-purple-500/40" />
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Avg Success
              </p>
              <h4 className="text-xl font-bold text-amber-400 font-mono">
                {(avgSuccess * 100).toFixed(0)}%
              </h4>
            </div>
            <CheckCircle2 className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">Source</p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                Live
              </h4>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void loadMethods()}
              disabled={loading}
              className="h-8 text-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              Reload
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Learned Method Ledger</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Real methods learned from your runs — no demo data
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <ScrollArea className="h-80 pr-1 space-y-2">
              <div className="space-y-2">
                {methods.length === 0 && !loading && (
                  <p className="text-xs text-slate-400 p-3">
                    No learned methods yet. Run a workflow a few times and the
                    system will start building its memory here.
                  </p>
                )}
                {methods.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setActiveMethodId(m.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      activeMethodId === m.id
                        ? "bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/40"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        {m.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono py-0 text-cyan-300 border-cyan-800 bg-cyan-950"
                      >
                        {(m.successRate * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-300">
                      <span>Runs: {m.totalExecutions}x</span>
                      <span>
                        Last:{" "}
                        {m.lastUsedAt
                          ? new Date(m.lastUsedAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {activeMethod ? activeMethod.name : "No method selected"}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-300 font-mono">
                    {activeMethod
                      ? activeMethod.description || "Learned from executions"
                      : "Select a method from the ledger"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {activeMethod ? (
                <>
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-200 block">
                      Adaptation Notes ({activeMethod.adaptationNotes.length}):
                    </span>
                    <div className="space-y-1.5">
                      {activeMethod.adaptationNotes.length === 0 && (
                        <p className="text-xs text-slate-500">
                          No adaptation notes recorded yet.
                        </p>
                      )}
                      {activeMethod.adaptationNotes.map((note, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300"
                        >
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                      Avg duration: {activeMethod.averageDuration.toFixed(1)}s
                    </div>
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                      Efficiency: {activeMethod.efficiency.toFixed(1)}/min
                    </div>
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                      Reliability:{" "}
                      {(activeMethod.reliability * 100).toFixed(0)}%
                    </div>
                  </div>
                  {activeMethod.contexts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activeMethod.contexts.map((c) => (
                        <Badge
                          key={c}
                          variant="outline"
                          className="text-[10px] font-mono text-purple-300 border-purple-800 bg-purple-950"
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  {loading
                    ? "Loading learned methods…"
                    : "Nothing to show yet."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Find Best Method For a Task</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Ask the learning system which method fits your current intent
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. log in and export the report…"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="h-8 text-xs bg-slate-950 border-slate-700"
                />
                <Button
                  size="sm"
                  onClick={() => void handleFindBest()}
                  disabled={lookingUp}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  {lookingUp ? "Searching…" : "Find best"}
                </Button>
              </div>
              {bestMethodNote && (
                <p className="text-xs text-slate-300 font-mono p-2 rounded bg-slate-950/60 border border-slate-800">
                  {bestMethodNote}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScenarioMemoryAutoPlanner;
