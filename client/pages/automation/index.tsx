import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Play,
  Pause,
  RefreshCw,
  Check,
  X,
  Bot,
  Settings,
  ListChecks,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  steps: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function AutomationPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tasks");
  const [objective, setObjective] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [agentNotes, setAgentNotes] = useState("");

  const generateTasks = async () => {
    if (!objective.trim()) return;

    setIsGenerating(true);
    setLogs((prev) => [...prev, "Analyzing objective and generating tasks..."]);

    try {
      // Simulate API call to generate tasks
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const generatedTasks: Task[] = [
        {
          id: "1",
          title: "Initial Setup",
          description: "Configure initial game settings and environment",
          status: "pending",
          steps: [
            "Check game resolution",
            "Set graphics settings to optimal",
            "Verify controller/keyboard mapping",
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          title: "Complete Tutorial",
          description: "Finish the in-game tutorial",
          status: "pending",
          steps: [
            "Follow tutorial prompts",
            "Learn basic controls",
            "Complete tutorial quests",
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      setTasks(generatedTasks);
      setActiveTask(generatedTasks[0]);
      setLogs((prev) => [...prev, "Tasks generated successfully!"]);
    } catch (error) {
      console.error("Error generating tasks:", error);
      setLogs((prev) => [...prev, "Error generating tasks. Please try again."]);
    } finally {
      setIsGenerating(false);
    }
  };

  const startAutomation = () => {
    if (!activeTask) return;

    setIsRunning(true);
    setLogs((prev) => [...prev, `Starting task: ${activeTask.title}`]);

    // Simulate task execution
    const interval = setInterval(() => {
      setLogs((prev) => [...prev, `Executing step: ${activeTask.steps[0]}`]);
      // Simulate step completion
      setTimeout(() => {
        setLogs((prev) => [...prev, `Completed step: ${activeTask.steps[0]}`]);

        // Move to next task if all steps are done
        if (activeTask.steps.length > 1) {
          setActiveTask((prev) => ({
            ...prev!,
            steps: prev!.steps.slice(1),
            status: "in-progress",
          }));
        } else {
          // Task completed
          setTasks((prev) =>
            prev.map((task) =>
              task.id === activeTask.id
                ? { ...task, status: "completed", updatedAt: new Date() }
                : task,
            ),
          );

          // Move to next task
          const currentIndex = tasks.findIndex((t) => t.id === activeTask.id);
          if (currentIndex < tasks.length - 1) {
            setActiveTask(tasks[currentIndex + 1]);
          } else {
            setLogs((prev) => [...prev, "All tasks completed!"]);
            setIsRunning(false);
          }
        }
      }, 2000);

      clearInterval(interval);
    }, 5000);
  };

  const stopAutomation = () => {
    setIsRunning(false);
    setLogs((prev) => [...prev, "Automation stopped by user"]);
  };

  const addNote = () => {
    if (!agentNotes.trim()) return;

    setLogs((prev) => [...prev, `Note: ${agentNotes}`]);
    setAgentNotes("");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">AI Automation</h1>
        <Button onClick={() => navigate("/")} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      <Tabs
        defaultValue="tasks"
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="tasks">
            <ListChecks className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Objective</CardTitle>
              <CardDescription>
                Describe what you want to automate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter your automation objective..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  disabled={isGenerating || tasks.length > 0}
                />
                <Button
                  onClick={generateTasks}
                  disabled={
                    !objective.trim() || isGenerating || tasks.length > 0
                  }
                >
                  {isGenerating ? "Generating..." : "Generate Tasks"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Task List */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>Generated automation tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {tasks.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No tasks generated yet. Enter an objective and click
                        'Generate Tasks'.
                      </p>
                    ) : (
                      tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            activeTask?.id === task.id
                              ? "bg-muted"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => setActiveTask(task)}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge
                              variant={
                                task.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {task.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Task Details */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {activeTask ? activeTask.title : "No Task Selected"}
                    </CardTitle>
                    <CardDescription>
                      {activeTask
                        ? activeTask.description
                        : "Select a task to view details"}
                    </CardDescription>
                  </div>
                  <div className="space-x-2">
                    {isRunning ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={stopAutomation}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={startAutomation}
                        disabled={!activeTask || isRunning}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Steps</h4>
                    <div className="space-y-2">
                      {activeTask?.steps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <p className="text-sm">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Agent Notes</h4>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add a note for the agent..."
                        value={agentNotes}
                        onChange={(e) => setAgentNotes(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addNote()}
                      />
                      <Button onClick={addNote}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Execution Logs</h4>
                    <div className="bg-black/5 p-3 rounded-md h-[200px] overflow-y-auto">
                      {logs.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                          No logs yet. Start the automation to see logs.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {logs.map((log, index) => (
                            <div key={index} className="text-sm font-mono">
                              <span className="text-muted-foreground">
                                [{new Date().toLocaleTimeString()}]
                              </span>{" "}
                              {log}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>
                Configure automation behavior and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Agent Behavior</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="autoRetry"
                        className="w-4 h-4"
                        defaultChecked
                      />
                      <label htmlFor="autoRetry" className="text-sm">
                        Automatically retry failed tasks
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notifications"
                        className="w-4 h-4"
                        defaultChecked
                      />
                      <label htmlFor="notifications" className="text-sm">
                        Enable desktop notifications
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">AI Model</h4>
                  <select className="w-full p-2 border rounded-md">
                    <option value="qwen2.5vl:7b">Qwen 7B (Default)</option>
                    <option value="llama2:7b">Llama 2 7B</option>
                    <option value="gpt-4">GPT-4</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
