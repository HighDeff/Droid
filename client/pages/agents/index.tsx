import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Plus,
  ListChecks,
} from "lucide-react";

type AgentType =
  | "scheduler"
  | "receptor"
  | "processor"
  | "executor"
  | "validator";
type AgentStatus = "idle" | "processing" | "waiting" | "error";

interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  status: AgentStatus;
  lastActive: Date;
  metrics: {
    tasksCompleted: number;
    successRate: number;
    avgProcessingTime: number;
  };
  config: Record<string, any>;
}

interface Task {
  id: string;
  type: "analysis" | "execution" | "validation" | "scheduling";
  status: "pending" | "in_progress" | "completed" | "failed";
  priority: number;
  assignedTo: AgentType | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
  result?: any;
  error?: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [newTask, setNewTask] = useState("");

  // Initialize agents
  useEffect(() => {
    if (isInitialized) return;

    const initialAgents: Agent[] = [
      {
        id: "scheduler-1",
        type: "scheduler",
        name: "Task Scheduler",
        description: "Manages task prioritization and assignment",
        status: "idle",
        lastActive: new Date(),
        metrics: { tasksCompleted: 0, successRate: 100, avgProcessingTime: 0 },
        config: { maxConcurrentTasks: 5 },
      },
      {
        id: "receptor-1",
        type: "receptor",
        name: "Game Log Processor",
        description: "Processes game logs and extracts events",
        status: "idle",
        lastActive: new Date(),
        metrics: { tasksCompleted: 0, successRate: 100, avgProcessingTime: 0 },
        config: { logSources: ["game_logs.txt", "console_output.txt"] },
      },
      {
        id: "processor-1",
        type: "processor",
        name: "Vision Processor",
        description: "Analyzes screenshots and detects game elements",
        status: "idle",
        lastActive: new Date(),
        metrics: { tasksCompleted: 0, successRate: 100, avgProcessingTime: 0 },
        config: { model: "yolov5", confidenceThreshold: 0.7 },
      },
      {
        id: "executor-1",
        type: "executor",
        name: "Action Executor",
        description: "Executes game actions",
        status: "idle",
        lastActive: new Date(),
        metrics: { tasksCompleted: 0, successRate: 100, avgProcessingTime: 0 },
        config: { inputMethod: "virtual_input", delayBetweenActions: 100 },
      },
      {
        id: "validator-1",
        type: "validator",
        name: "Result Validator",
        description: "Validates task results and updates strategies",
        status: "idle",
        lastActive: new Date(),
        metrics: { tasksCompleted: 0, successRate: 100, avgProcessingTime: 0 },
        config: { validationMethods: ["screenshot_analysis", "log_parsing"] },
      },
    ];

    setAgents(initialAgents);
    setIsInitialized(true);
  }, [isInitialized]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 100));
  };

  const createTask = () => {
    if (!newTask.trim()) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      type: "analysis",
      status: "pending",
      priority: 1,
      assignedTo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { description: newTask },
    };

    setTasks((prev) => [task, ...prev]);
    setNewTask("");
    addLog(`Created new task: ${newTask}`);

    // Auto-assign to scheduler if available
    setTimeout(() => assignTask(task.id, "scheduler"), 100);
  };

  const assignTask = (taskId: string, agentType: AgentType) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "in_progress",
              assignedTo: agentType,
              updatedAt: new Date(),
            }
          : task,
      ),
    );

    setAgents((prev) =>
      prev.map((agent) =>
        agent.type === agentType
          ? { ...agent, status: "processing", lastActive: new Date() }
          : agent,
      ),
    );

    addLog(`Assigned task ${taskId} to ${agentType}`);

    // Simulate task processing
    setTimeout(() => completeTask(taskId), 2000);
  };

  const completeTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isSuccess = Math.random() > 0.2; // 80% success rate for demo

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: isSuccess ? "completed" : "failed",
              updatedAt: new Date(),
              result: isSuccess ? "Task completed successfully" : undefined,
              error: isSuccess ? undefined : "Task failed due to unknown error",
            }
          : t,
      ),
    );

    if (task.assignedTo) {
      setAgents((prev) =>
        prev.map((agent) =>
          agent.type === task.assignedTo
            ? {
                ...agent,
                status: "idle",
                lastActive: new Date(),
                metrics: {
                  tasksCompleted: agent.metrics.tasksCompleted + 1,
                  successRate: isSuccess
                    ? (agent.metrics.successRate *
                        agent.metrics.tasksCompleted +
                        100) /
                      (agent.metrics.tasksCompleted + 1)
                    : (agent.metrics.successRate *
                        agent.metrics.tasksCompleted) /
                      (agent.metrics.tasksCompleted + 1),
                  avgProcessingTime: 0, // Simplified for demo
                },
              }
            : agent,
        ),
      );
    }

    addLog(`Task ${taskId} ${isSuccess ? "completed" : "failed"}`);

    // If this was a scheduling task, create new tasks
    if (task.type === "scheduling" && isSuccess) {
      createChildTasks(taskId);
    }
  };

  const createChildTasks = (parentTaskId: string) => {
    const childTasks: Task[] = [
      {
        id: `task-${Date.now()}-1`,
        type: "analysis",
        status: "pending",
        priority: 2,
        assignedTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          parentTaskId,
          description: "Analyze game state",
          dependencies: [],
        },
      },
      {
        id: `task-${Date.now()}-2`,
        type: "execution",
        status: "pending",
        priority: 1,
        assignedTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          parentTaskId,
          description: "Execute game actions",
          dependencies: [`task-${Date.now()}-1`],
        },
      },
    ];

    setTasks((prev) => [...childTasks, ...prev]);
    childTasks.forEach((task) =>
      addLog(`Created child task: ${task.metadata.description}`),
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "in_progress":
        return "bg-blue-500/20 text-blue-400";
      case "failed":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getAgentStatusColor = (status: AgentStatus) => {
    switch (status) {
      case "processing":
        return "bg-yellow-500/20 text-yellow-400";
      case "error":
        return "bg-red-500/20 text-red-400";
      case "waiting":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-green-500/20 text-green-400";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agent System</h1>
          <p className="text-muted-foreground">
            Manage and monitor AI agents for game automation
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card
                key={agent.id}
                className="hover:border-primary/50 transition-colors"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {agent.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {agent.description}
                    </p>
                  </div>
                  <div
                    className={`rounded-full p-2 ${getAgentStatusColor(agent.status)}`}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {agent.metrics.tasksCompleted}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {agent.status === "idle" ? "Ready" : agent.status}
                  </p>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-muted-foreground">Success:</span>
                    <span className="ml-2 font-medium">
                      {Math.round(agent.metrics.successRate)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Task</CardTitle>
              <CardDescription>Create a new automation task</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="Describe what you want to automate..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createTask()}
                />
                <Button onClick={createTask} disabled={!newTask.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Management</CardTitle>
              <CardDescription>Configure and monitor AI agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {agent.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getAgentStatusColor(agent.status)}`}
                        >
                          {agent.status}
                        </span>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">
                          Tasks Completed
                        </div>
                        <div className="font-medium">
                          {agent.metrics.tasksCompleted}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Success Rate
                        </div>
                        <div className="font-medium">
                          {Math.round(agent.metrics.successRate)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Last Active</div>
                        <div className="font-medium">
                          {new Date(agent.lastActive).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Queue</CardTitle>
              <CardDescription>
                View and manage automation tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks in the queue
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {task.metadata.description || "Task"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {task.type} • {task.assignedTo || "unassigned"}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}
                            >
                              {task.status.replace("_", " ")}
                            </span>
                            {task.status === "pending" && !task.assignedTo && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => assignTask(task.id, "scheduler")}
                              >
                                Assign
                              </Button>
                            )}
                          </div>
                        </div>
                        {task.error && (
                          <div className="mt-2 text-sm text-red-500">
                            Error: {task.error}
                          </div>
                        )}
                        {task.result && (
                          <div className="mt-2 text-sm text-green-500">
                            {task.result}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                Real-time system and agent activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-md border bg-black p-4 font-mono text-sm overflow-auto">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground">No logs available</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="border-b border-gray-800 py-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
