import React, { useState, useEffect } from "react";
import {
  Brain,
  Shield,
  Eye,
  Crosshair,
  Sparkles,
  Zap,
  Activity,
  Cpu,
  CheckCircle2,
  MessageSquare,
  Bot,
  Sliders,
  Target,
  Clock,
  RotateCcw,
  Play,
  ShieldAlert,
  ShieldX,
  Layers,
  ArrowRight,
  GitFork,
  Radio,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";

export interface DefaultAgentInfo {
  id: string;
  name: string;
  role: string;
  status: "idle" | "active" | "verifying" | "recovering";
  progress: number;
  assignedGoal: string;
  milestonesCompleted: number;
  totalMilestones: number;
  throughput: string;
  memoryLoad: string;
  accuracy: string;
  activeTool: string;
  color: string;
}

export const AgentsTelemetryPanel: React.FC = () => {
  const [agents, setAgents] = useState<DefaultAgentInfo[]>([
    {
      id: "agent_perception",
      name: "Qwen Vision Perception Specialist",
      role: "60Hz visual grounding, OCR bounding box detection, and differential radar",
      status: "active",
      progress: 92,
      assignedGoal: "G-1: Locate App Icons & Ground Interactive Form Fields",
      milestonesCompleted: 4,
      totalMilestones: 4,
      throughput: "58.4 fps",
      memoryLoad: "1.2 GB / 4.0 GB",
      accuracy: "98.4%",
      activeTool: "Dual-Model OCR & Difference Mesh",
      color: "border-cyan-500 text-cyan-400 bg-cyan-950/20",
    },
    {
      id: "agent_planner",
      name: "Cognitive Reasoning & Hierarchy Planner",
      role: "Goal decomposition, DAG hierarchy branch routing & turn precog forecasting",
      status: "active",
      progress: 85,
      assignedGoal: "G-2: Plan Multi-Step Autonomous Navigation Cycle",
      milestonesCompleted: 6,
      totalMilestones: 7,
      throughput: "2.4 plan/s",
      memoryLoad: "2.1 GB / 8.0 GB",
      accuracy: "96.8%",
      activeTool: "Hierarchical Chain-of-Thought",
      color: "border-purple-500 text-purple-400 bg-purple-950/20",
    },
    {
      id: "agent_actor",
      name: "Human Motor & Touch Action Dispatcher",
      role: "Cubic spline mouse movement, proximity typing, sliding drag & drop physics",
      status: "active",
      progress: 78,
      assignedGoal: "G-3: Execute Realistic Keystrokes & Drag Solvers",
      milestonesCompleted: 8,
      totalMilestones: 10,
      throughput: "24 act/s",
      memoryLoad: "480 MB / 2.0 GB",
      accuracy: "99.2%",
      activeTool: "PyAutoGUI Cubic Splines with Micro-Jitter",
      color: "border-amber-500 text-amber-400 bg-amber-950/20",
    },
    {
      id: "agent_verifier",
      name: "Visual State Verification & Diff Agent",
      role: "Post-execution visual confirmation, OCR gate checks, and pass/fail auditing",
      status: "verifying",
      progress: 95,
      assignedGoal: "G-4: Validate Screen State Transitions & Output Success",
      milestonesCompleted: 12,
      totalMilestones: 12,
      throughput: "4.8 ver/s",
      memoryLoad: "850 MB / 2.0 GB",
      accuracy: "97.5%",
      activeTool: "Pixel-Diff & OCR Text Matching",
      color: "border-emerald-500 text-emerald-400 bg-emerald-950/20",
    },
    {
      id: "agent_ad_buster",
      name: "Ad & Popover Destroyer Specialist",
      role: "Countdown timer tracking, delayed 'X' close button hunting, and escape fallback",
      status: "active",
      progress: 100,
      assignedGoal: "G-5: Destroy Intrusive Ads & Interstitial Dialogs",
      milestonesCompleted: 5,
      totalMilestones: 5,
      throughput: "12 scan/s",
      memoryLoad: "320 MB / 1.0 GB",
      accuracy: "99.8%",
      activeTool: "Multi-Stage Ad Chain Resolver",
      color: "border-red-500 text-red-400 bg-red-950/20",
    },
    {
      id: "agent_watchdog",
      name: "Progress Watchdog & Auto-Rebound Agent",
      role: "60Hz stall auditor (>2.5s detection), state preservation, and failover remedy",
      status: "active",
      progress: 90,
      assignedGoal:
        "G-6: Continuous Progress Auditing & Zero-Blank State Preservation",
      milestonesCompleted: 18,
      totalMilestones: 20,
      throughput: "60 Hz",
      memoryLoad: "210 MB / 1.0 GB",
      accuracy: "99.9%",
      activeTool: "Dynamic DAG Branch Fallback Engine",
      color: "border-teal-500 text-teal-400 bg-teal-950/20",
    },
    {
      id: "agent_gap",
      name: "GapAgent & Incomplete Step Re-formulator",
      role: "Planned vs executed step auditor, discrepancy tracking, and auto-retry prompts",
      status: "active",
      progress: 88,
      assignedGoal:
        "G-7: Audit Discrepancies & Formulate Automated Retry Payloads",
      milestonesCompleted: 7,
      totalMilestones: 8,
      throughput: "1.2 audit/s",
      memoryLoad: "640 MB / 2.0 GB",
      accuracy: "96.2%",
      activeTool: "Structured Opcode Retry Generator",
      color: "border-blue-500 text-blue-400 bg-blue-950/20",
    },
  ]);

  const [agentLogs, setAgentLogs] = useState([
    {
      timestamp: "Just now",
      agent: "Perception",
      message:
        "Grounded 3 interactive UI targets on desktop viewport with 98.4% OCR match.",
    },
    {
      timestamp: "3s ago",
      agent: "Planner",
      message: "Formulated DAG route to Passcode Input Field #1.",
    },
    {
      timestamp: "5s ago",
      agent: "Actor",
      message:
        "Dispatched spline mouse move to (420, 380) with 750px/s flowrate.",
    },
    {
      timestamp: "7s ago",
      agent: "Verifier",
      message: "Confirmed visual state transition: Input focused.",
    },
    {
      timestamp: "10s ago",
      agent: "Ad Buster",
      message: "Monitored popover overlay. No active blockers detected.",
    },
    {
      timestamp: "12s ago",
      agent: "Watchdog",
      message:
        "60Hz progress check healthy. Zero stalls reported across all threads.",
    },
  ]);

  const handleSynchronizeSwarm = () => {
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        progress: Math.min(100, a.progress + 5),
        status: "active",
      })),
    );
    setAgentLogs((prev) => [
      {
        timestamp: "Just now",
        agent: "Swarm Bus",
        message:
          "⚡ Swarm Synchronized: Memory scratchpad aligned across all 7 default agents. Quorum 98.6% reached.",
      },
      ...prev,
    ]);
  };

  const handleRecalibrateModels = () => {
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status: "active",
        accuracy: "99.4%",
      })),
    );
    setAgentLogs((prev) => [
      {
        timestamp: "Just now",
        agent: "Model Manager",
        message:
          "✓ Qwen Vision & Cognitive Reasoning weights recalibrated for 60Hz real-time inference.",
      },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="agents"
        title="Swarm Agents Telemetry, Progress Tracking & Goal Execution Matrix"
        badge="7 Default Agents Active"
        settings={[
          {
            id: "consensus_threshold",
            label: "Swarm Consensus Quorum",
            type: "slider",
            value: 85,
            min: 50,
            max: 99,
            step: 1,
            unit: "%",
            description: "Agreement required to act",
          },
          {
            id: "autonomy_level",
            label: "Autonomous Authority Level",
            type: "slider",
            value: 4,
            min: 1,
            max: 5,
            step: 1,
            unit: "lvl",
            description: "Level 4: Supervised Autonomous",
          },
          {
            id: "memory_sync_interval",
            label: "Memory Sync Frequency",
            type: "slider",
            value: 500,
            min: 100,
            max: 2000,
            step: 100,
            unit: "ms",
            description: "Shared scratchpad heartbeat",
          },
          {
            id: "failsafe_abort",
            label: "Corner-Snap Emergency Abort",
            type: "switch",
            value: true,
            description: "Top-left mouse slam terminates all agents",
          },
        ]}
        quickActions={[
          {
            label: "Synchronize Swarm",
            action: handleSynchronizeSwarm,
            variant: "default",
          },
          {
            label: "Recalibrate Models",
            action: handleRecalibrateModels,
            variant: "secondary",
          },
        ]}
      />

      {/* Agents Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className={`bg-slate-900 border ${agent.color} shadow-xl flex flex-col justify-between`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold font-mono flex items-center gap-1.5 truncate">
                  <Bot className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{agent.name}</span>
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono uppercase bg-slate-950"
                >
                  {agent.status}
                </Badge>
              </div>
              <CardDescription className="text-[10px] text-slate-300 font-mono line-clamp-2">
                {agent.role}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-1 text-xs font-mono">
              {/* Assigned Goal & Progress */}
              <div className="space-y-1 p-2 rounded bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 font-bold truncate">
                    Goal:
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {agent.progress}% Complete
                  </span>
                </div>
                <p className="text-[10px] text-slate-200 truncate">
                  {agent.assignedGoal}
                </p>
                <Progress
                  value={agent.progress}
                  className="h-1.5 bg-slate-800"
                />
                <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                  <span>
                    Milestones: {agent.milestonesCompleted} /{" "}
                    {agent.totalMilestones}
                  </span>
                  <span>Accuracy: {agent.accuracy}</span>
                </div>
              </div>

              {/* Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                <div>
                  Throughput:{" "}
                  <strong className="text-slate-200">{agent.throughput}</strong>
                </div>
                <div>
                  Memory:{" "}
                  <strong className="text-slate-200">{agent.memoryLoad}</strong>
                </div>
                <div className="col-span-2 truncate">
                  Active Tool:{" "}
                  <span className="text-cyan-300">{agent.activeTool}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Swarm Communication & Live Inter-Agent Event Log */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl">
        <CardHeader className="pb-2 border-b border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold font-mono text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Inter-Agent Communication & Progress Event Bus</span>
          </CardTitle>
          <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800 text-[10px] font-mono">
            {agentLogs.length} Events Synced
          </Badge>
        </CardHeader>
        <CardContent className="p-4">
          <ScrollArea className="h-44">
            <div className="space-y-2 font-mono text-xs">
              {agentLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-slate-950 border border-slate-800 flex items-start gap-2.5"
                >
                  <Badge
                    variant="outline"
                    className="text-[9px] py-0 px-1.5 text-cyan-400 border-cyan-800 bg-cyan-950/40 mt-0.5"
                  >
                    {log.agent}
                  </Badge>
                  <div className="flex-1 text-slate-300 text-[11px]">
                    {log.message}
                  </div>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
