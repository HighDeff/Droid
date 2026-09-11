import { assistantStateRepository } from "./assistant-state";
import { executionStateRepository } from "./execution-state";
import { liveEvents } from "./live-events";
import type { AssistantWorkflow, AssistantPlan } from "@shared/assistant";

type ScheduledTask = {
  id: string;
  workflowId: string;
  sessionId: string;
  scheduledTime: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "running" | "completed" | "failed";
  retryCount: number;
  maxRetries: number;
  estimatedDuration: number;
  dependencies: string[];
};

class SchedulingWorker {
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private workerInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.start();
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.workerInterval = setInterval(() => {
      this.processScheduledTasks();
    }, 1000); // Check every second
    
    console.log("Scheduling worker started");
  }

  stop() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }
    this.isRunning = false;
    console.log("Scheduling worker stopped");
  }

  scheduleWorkflow(
    workflowId: string,
    sessionId: string,
    scheduledTime: string,
    priority: "high" | "medium" | "low" = "medium",
    estimatedDuration: number = 60000
  ): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    const task: ScheduledTask = {
      id: taskId,
      workflowId,
      sessionId,
      scheduledTime,
      priority,
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      estimatedDuration,
      dependencies: [],
    };
    
    this.scheduledTasks.set(taskId, task);
    
    liveEvents.publish(sessionId, "workflow.scheduled", {
      taskId,
      workflowId,
      scheduledTime,
      priority,
    });
    
    return taskId;
  }

  private async processScheduledTasks() {
    const now = Date.now();
    const readyTasks = Array.from(this.scheduledTasks.values()).filter(
      task => 
        task.status === "pending" && 
        Date.parse(task.scheduledTime) <= now &&
        this.areDependenciesMet(task.dependencies)
    );

    // Sort by priority
    readyTasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const task of readyTasks) {
      await this.executeTask(task);
    }
  }

  private areDependenciesMet(dependencies: string[]): boolean {
    return dependencies.every(depId => {
      const depTask = this.scheduledTasks.get(depId);
      return depTask?.status === "completed";
    });
  }

  private async executeTask(task: ScheduledTask) {
    task.status = "running";
    this.scheduledTasks.set(task.id, task);
    
    liveEvents.publish(task.sessionId, "workflow.started", {
      taskId: task.id,
      workflowId: task.workflowId,
      estimatedDuration: task.estimatedDuration,
    });

    try {
      const workflow = assistantStateRepository.getWorkflow(task.workflowId, task.sessionId);
      if (!workflow) {
        throw new Error("Workflow not found");
      }

      // Get the execution plan
      const plans = assistantStateRepository.listPlans(task.sessionId);
      const plan = plans[0];
      if (!plan) {
        throw new Error("No execution plan found");
      }

      // Execute the workflow
      const execution = executionStateRepository.create(plan);
      const result = await executionStateRepository.start(execution, plan);

      if (result.status === "completed") {
        task.status = "completed";
        liveEvents.publish(task.sessionId, "workflow.completed", {
          taskId: task.id,
          workflowId: task.workflowId,
          success: true,
          duration: task.estimatedDuration,
        });
      } else {
        throw new Error(result.error || "Execution failed");
      }
    } catch (error) {
      task.retryCount++;
      
      if (task.retryCount < task.maxRetries) {
        task.status = "pending";
        // Reschedule with exponential backoff
        const backoffMs = Math.pow(2, task.retryCount) * 60000; // 1min, 2min, 4min
        task.scheduledTime = new Date(Date.now() + backoffMs).toISOString();
        
        liveEvents.publish(task.sessionId, "workflow.retry_scheduled", {
          taskId: task.id,
          workflowId: task.workflowId,
          retryCount: task.retryCount,
          nextAttempt: task.scheduledTime,
        });
      } else {
        task.status = "failed";
        liveEvents.publish(task.sessionId, "workflow.failed", {
          taskId: task.id,
          workflowId: task.workflowId,
          error: error instanceof Error ? error.message : "Unknown error",
          retryCount: task.retryCount,
        });
      }
    } finally {
      this.scheduledTasks.set(task.id, task);
    }
  }

  cancelTask(taskId: string): boolean {
    const task = this.scheduledTasks.get(taskId);
    if (!task) return false;
    
    if (task.status === "running") {
      // Can't cancel running tasks immediately, but mark for cancellation
      liveEvents.publish(task.sessionId, "workflow.cancel_requested", {
        taskId,
        workflowId: task.workflowId,
      });
      return false;
    }
    
    this.scheduledTasks.delete(taskId);
    liveEvents.publish(task.sessionId, "workflow.cancelled", {
      taskId,
      workflowId: task.workflowId,
    });
    return true;
  }

  getTaskStatus(taskId: string): ScheduledTask | undefined {
    return this.scheduledTasks.get(taskId);
  }

  getScheduledTasks(sessionId?: string): ScheduledTask[] {
    const allTasks = Array.from(this.scheduledTasks.values());
    if (sessionId) {
      return allTasks.filter(task => task.sessionId === sessionId);
    }
    return allTasks;
  }

  // Complex scheduling with dependencies
  scheduleWithDependencies(
    workflowId: string,
    sessionId: string,
    scheduledTime: string,
    dependencies: string[],
    priority: "high" | "medium" | "low" = "medium"
  ): string {
    const taskId = this.scheduleWorkflow(workflowId, sessionId, scheduledTime, priority);
    const task = this.scheduledTasks.get(taskId);
    if (task) {
      task.dependencies = dependencies;
      this.scheduledTasks.set(taskId, task);
    }
    return taskId;
  }

  // Batch scheduling for complex workflows
  scheduleBatch(tasks: Array<{
    workflowId: string;
    sessionId: string;
    scheduledTime: string;
    priority?: "high" | "medium" | "low";
    dependencies?: string[];
  }>): string[] {
    return tasks.map(task => 
      this.scheduleWithDependencies(
        task.workflowId,
        task.sessionId,
        task.scheduledTime,
        task.dependencies || [],
        task.priority
      )
    );
  }

  // Time-slot based scheduling for completing goals within time constraints
  scheduleInTimeSlot(
    workflowId: string,
    sessionId: string,
    startTime: string,
    endTime: string,
    priority: "high" | "medium" | "low" = "high"
  ): string {
    const estimatedDuration = 60000; // Default 1 minute estimation
    const availableTime = Date.parse(endTime) - Date.parse(startTime);
    
    if (availableTime < estimatedDuration) {
      throw new Error("Insufficient time slot for workflow execution");
    }
    
    return this.scheduleWorkflow(workflowId, sessionId, startTime, priority, estimatedDuration);
  }
}

export const schedulingWorker = new SchedulingWorker();