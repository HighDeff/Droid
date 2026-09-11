import { Request, Response, Router } from "express";
import { z } from "zod";
import { schedulingWorker } from "../scheduling-worker";
import { assistantStateRepository } from "../assistant-state";

const router = Router();

const scheduleBody = z.object({
  workflowId: z.string().min(1),
  sessionId: z.string().min(1),
  scheduledTime: z.string(), // ISO timestamp
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  estimatedDuration: z.number().int().positive().default(60000),
});

const scheduleWithDepsBody = z.object({
  workflowId: z.string().min(1),
  sessionId: z.string().min(1),
  scheduledTime: z.string(),
  dependencies: z.array(z.string()).default([]),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

// Schedule a workflow for future execution
router.post("/schedule", async (req: Request, res: Response) => {
  try {
    const body = scheduleBody.parse(req.body);
    
    // Verify workflow exists
    const workflow = assistantStateRepository.getWorkflow(body.workflowId, body.sessionId);
    if (!workflow) {
      return res.status(404).json({ 
        success: false, 
        error: "Workflow not found" 
      });
    }
    
    const taskId = schedulingWorker.scheduleWorkflow(
      body.workflowId,
      body.sessionId,
      body.scheduledTime,
      body.priority,
      body.estimatedDuration
    );
    
    res.json({ 
      success: true, 
      taskId,
      scheduledTime: body.scheduledTime,
      priority: body.priority,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to schedule workflow" 
    });
  }
});

// Schedule workflow with dependencies
router.post("/schedule-with-dependencies", async (req: Request, res: Response) => {
  try {
    const body = scheduleWithDepsBody.parse(req.body);
    
    const workflow = assistantStateRepository.getWorkflow(body.workflowId, body.sessionId);
    if (!workflow) {
      return res.status(404).json({ 
        success: false, 
        error: "Workflow not found" 
      });
    }
    
    const taskId = schedulingWorker.scheduleWithDependencies(
      body.workflowId,
      body.sessionId,
      body.scheduledTime,
      body.dependencies,
      body.priority
    );
    
    res.json({ 
      success: true, 
      taskId,
      dependencies: body.dependencies,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to schedule workflow" 
    });
  }
});

// Schedule workflow in specific time slot
router.post("/schedule-in-slot", async (req: Request, res: Response) => {
  try {
    const body = z.object({
      workflowId: z.string().min(1),
      sessionId: z.string().min(1),
      startTime: z.string(),
      endTime: z.string(),
      priority: z.enum(["high", "medium", "low"]).default("high"),
    }).parse(req.body);
    
    const taskId = schedulingWorker.scheduleInTimeSlot(
      body.workflowId,
      body.sessionId,
      body.startTime,
      body.endTime,
      body.priority
    );
    
    res.json({ 
      success: true, 
      taskId,
      timeSlot: { start: body.startTime, end: body.endTime },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to schedule in time slot" 
    });
  }
});

// Batch schedule multiple workflows
router.post("/schedule-batch", async (req: Request, res: Response) => {
  try {
    const body = z.object({
      tasks: z.array(z.object({
        workflowId: z.string().min(1),
        sessionId: z.string().min(1),
        scheduledTime: z.string(),
        priority: z.enum(["high", "medium", "low"]).optional(),
        dependencies: z.array(z.string()).optional(),
      })),
    }).parse(req.body);
    
    const taskIds = schedulingWorker.scheduleBatch(body.tasks.map(task => ({
      workflowId: task.workflowId,
      sessionId: task.sessionId,
      scheduledTime: task.scheduledTime,
      priority: task.priority,
      dependencies: task.dependencies,
    })));
    
    res.json({ 
      success: true, 
      taskIds,
      count: taskIds.length,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to schedule batch" 
    });
  }
});

// Get task status
router.get("/task/:taskId", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = schedulingWorker.getTaskStatus(taskId);
    
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        error: "Task not found" 
      });
    }
    
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get task status" 
    });
  }
});

// Get all scheduled tasks for a session
router.get("/tasks/:sessionId", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const tasks = schedulingWorker.getScheduledTasks(sessionId);
    
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get scheduled tasks" 
    });
  }
});

// Cancel a scheduled task
router.delete("/task/:taskId", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const cancelled = schedulingWorker.cancelTask(taskId);
    
    if (!cancelled) {
      return res.status(400).json({ 
        success: false, 
        error: "Task cannot be cancelled (may be running or not found)" 
      });
    }
    
    res.json({ success: true, cancelled: true });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to cancel task" 
    });
  }
});

export { router as schedulingRouter };