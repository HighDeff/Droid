import React, { useState } from "react";
import {
  Target,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";

export interface PipelineTask {
  id: string;
  name: string;
  description: string;
  priority: number;
  confidence: number;
  status: "pending" | "running" | "completed" | "failed";
  createdAt?: Date;
}

interface AutoTasksPipelinePanelProps {
  tasks: PipelineTask[];
  onExecuteTask: (taskId: string) => void;
  onAddTask: (name: string, desc: string) => void;
  onClearTasks: () => void;
  onRunBatch: () => void;
}

export const AutoTasksPipelinePanel: React.FC<AutoTasksPipelinePanelProps> = ({
  tasks,
  onExecuteTask,
  onAddTask,
  onClearTasks,
  onRunBatch,
}) => {
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  const handleCreate = () => {
    if (!taskName.trim()) return;
    onAddTask(taskName, taskDesc);
    setTaskName("");
    setTaskDesc("");
  };

  return (
    <div className="space-y-4">
      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="tasks"
        title="Auto Tasks Dispatch Pipeline & Verification Gates"
        badge="Queue Active"
        settings={[
          {
            id: "auto_pacing",
            label: "Adaptive Execution Pacing",
            type: "slider",
            value: 350,
            min: 50,
            max: 2000,
            step: 50,
            unit: "ms",
            description: "Delay between task steps",
          },
          {
            id: "strict_gates",
            label: "Strict OCR Gate Check",
            type: "switch",
            value: true,
            description: "Require visual confirmation before advancing",
          },
          {
            id: "task_reordering",
            label: "Dynamic Priority Reordering",
            type: "switch",
            value: true,
            description: "Promote urgent tasks automatically",
          },
          {
            id: "batch_failover",
            label: "Batch Failover Fallback",
            type: "switch",
            value: true,
            description: "Switch to alternative method on fail",
          },
        ]}
        quickActions={[
          { label: "Run Batch Queue", action: onRunBatch, variant: "default" },
          { label: "Clear Queue", action: onClearTasks, variant: "secondary" },
        ]}
      />
      {/* Pipeline Header */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>Auto-Task Generation & Execution Pipeline</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Real-time task synthesis from Qwen vision perception &
                multi-agent scheduler
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onRunBatch}
                className="gap-1.5 text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg"
              >
                <Play className="w-3.5 h-3.5" /> Execute Next Batch
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearTasks}
                className="text-xs text-red-400 hover:bg-red-950/30"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Pipeline
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Quick Manual Task Insertion Bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <Input
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Task name (e.g. Click Submit Button)"
              className="h-8 text-xs bg-slate-900 border-slate-700 flex-1"
            />
            <Input
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Description (e.g. click at 860, 600)"
              className="h-8 text-xs bg-slate-900 border-slate-700 flex-1"
            />
            <Button
              size="sm"
              onClick={handleCreate}
              className="h-8 text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add to Pipeline
            </Button>
          </div>

          {/* Task Queue Grid */}
          <ScrollArea className="h-[480px] pr-2">
            {tasks.length === 0 ? (
              <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-800 rounded-xl">
                <Target className="w-10 h-10 mx-auto mb-2 text-slate-400 animate-pulse" />
                <p className="text-sm font-medium text-slate-300">
                  Task Pipeline Idle
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Tasks will automatically populate as Qwen Vision discovers
                  interactive objectives on screen.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 bg-slate-900/90 hover:bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        {task.status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : task.status === "running" ? (
                          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-100">
                            {task.name}
                          </h4>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            P{task.priority || 1}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.confidence && (
                        <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                          {(task.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      <Button
                        size="sm"
                        onClick={() => onExecuteTask(task.id)}
                        disabled={task.status === "running"}
                        className="h-7 text-xs bg-slate-800 hover:bg-cyan-600 hover:text-white border border-slate-700 gap-1"
                      >
                        <Play className="w-3 h-3" /> Run
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
