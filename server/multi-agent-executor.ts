/**
 * Multi-Agent Executor
 * Manages parallel execution of automation tasks with timing optimization
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { autoTaskGenerator, GeneratedTask } from "./auto-task-generator";
import { gameStateManager } from "./state-manager";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface Agent {
  id: string;
  status: "idle" | "executing" | "waiting" | "paused";
  currentTask?: GeneratedTask;
  executedTaskCount: number;
  successRate: number;
  lastActivity: number;
}

export interface ExecutionResult {
  taskId: string;
  success: boolean;
  result?: string;
  error?: string;
  executionTime: number;
  agentId: string;
}

export class MultiAgentExecutor {
  private agents: Map<string, Agent> = new Map();
  private executionQueue: GeneratedTask[] = [];
  private executionResults: ExecutionResult[] = [];
  private maxAgents = 4;
  private executionIntervalMs = 140; // ~0.14s as requested
  private lastExecutionTime = 0;
  private agentIdCounter = 0;

  constructor(maxAgents = 4) {
    this.maxAgents = maxAgents;
    this.initializeAgents();
  }

  /**
   * Initialize agents
   */
  private initializeAgents(): void {
    for (let i = 0; i < this.maxAgents; i++) {
      const agentId = `agent_${++this.agentIdCounter}`;
      this.agents.set(agentId, {
        id: agentId,
        status: "idle",
        executedTaskCount: 0,
        successRate: 1.0,
        lastActivity: Date.now(),
      });
    }
  }

  /**
   * Process pending tasks and assign to agents
   */
  public processAndExecuteTasks(): ExecutionResult[] {
    const now = Date.now();

    // Throttle execution to ~0.14s interval
    if (now - this.lastExecutionTime < this.executionIntervalMs) {
      return [];
    }

    this.lastExecutionTime = now;
    const results: ExecutionResult[] = [];

    // Get available agents
    const availableAgents = Array.from(this.agents.values()).filter(
      (a) => a.status === "idle",
    );

    // Get pending tasks sorted by priority
    const pendingTasks = autoTaskGenerator
      .getTasks()
      .sort((a, b) => b.priority - a.priority)
      .slice(0, availableAgents.length);

    // Assign tasks to agents
    for (
      let i = 0;
      i < pendingTasks.length && i < availableAgents.length;
      i++
    ) {
      const task = pendingTasks[i];
      const agent = availableAgents[i];

      const result = this.executeTask(agent, task);
      results.push(result);
    }

    // Add results to history
    this.executionResults.push(...results);
    if (this.executionResults.length > 100) {
      this.executionResults.shift();
    }

    return results;
  }

  /**
   * Execute a single task on an agent
   */
  private executeTask(agent: Agent, task: GeneratedTask): ExecutionResult {
    const startTime = Date.now();
    agent.status = "executing";
    agent.currentTask = task;

    try {
      // Get action sequence for the task
      const actions = autoTaskGenerator.getTaskActions(task);

      // Execute actions
      this.executeActions(actions, task);

      // Update agent
      agent.status = "idle";
      agent.executedTaskCount++;
      agent.lastActivity = Date.now();

      // Update goal status
      const state = gameStateManager.getState();
      for (const [goalId, goal] of state.goals) {
        if (goal.description.includes(task.name)) {
          gameStateManager.updateGoal(goalId, {
            status: "in_progress",
          });
        }
      }

      const executionTime = Date.now() - startTime;

      return {
        taskId: task.id,
        success: true,
        result: `Task "${task.name}" executed successfully`,
        executionTime,
        agentId: agent.id,
      };
    } catch (error) {
      agent.status = "idle";
      agent.lastActivity = Date.now();

      const executionTime = Date.now() - startTime;

      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime,
        agentId: agent.id,
      };
    }
  }

  /**
   * Execute action sequence
   */
  private executeActions(actions: string[], task: GeneratedTask): void {
    const state = gameStateManager.getState();

    for (const action of actions) {
      if (action.startsWith("move_to")) {
        const entityId = action.split(" ")[1];
        const entity = state.entities.get(entityId);

        if (entity) {
          // Calculate path to entity and move
          this.simulateMovement(entity.position);
        }
      } else if (action === "attack") {
        // Simulate attack animation/cooldown
        this.simulateAttack();
      } else if (action === "interact") {
        // Simulate interaction
        this.simulateInteraction();
      } else if (action === "evade") {
        // Simulate evasion
        this.simulateEvade();
      }
    }
  }

  /**
   * Simulate movement to position
   */
  private simulateMovement(position: { x: number; y: number }): void {
    // In a real implementation, this would:
    // 1. Calculate path
    // 2. Move cursor to position
    // 3. Execute keyboard inputs for movement
    // For now, we simulate the timing
    const distance =
      Math.sqrt(
        Math.pow(
          position.x - (gameStateManager.getState().playerPosition?.x || 0),
          2,
        ) +
          Math.pow(
            position.y - (gameStateManager.getState().playerPosition?.y || 0),
            2,
          ),
      ) || 100;

    const estimatedTime = (distance / 100) * 500; // 500ms per 100 pixels
    const startTime = Date.now();

    // Simulate movement with multiple steps
    while (Date.now() - startTime < Math.min(estimatedTime, 2000)) {
      // Movement logic
    }
  }

  /**
   * Simulate attack action
   */
  private simulateAttack(): void {
    // Simulate attack animation and cooldown
    const attackTime = Math.random() * 500 + 300; // 300-800ms
    const startTime = Date.now();

    while (Date.now() - startTime < attackTime) {
      // Attack simulation
    }
  }

  /**
   * Simulate interaction
   */
  private simulateInteraction(): void {
    // Simulate interaction delay
    const interactionTime = Math.random() * 300 + 200; // 200-500ms
    const startTime = Date.now();

    while (Date.now() - startTime < interactionTime) {
      // Interaction simulation
    }
  }

  /**
   * Simulate evasion
   */
  private simulateEvade(): void {
    // Simulate evasion maneuver
    const evadeTime = Math.random() * 400 + 300; // 300-700ms
    const startTime = Date.now();

    while (Date.now() - startTime < evadeTime) {
      // Evasion simulation
    }
  }

  /**
   * Get agent status
   */
  public getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get specific agent
   */
  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get execution statistics
   */
  public getStatistics() {
    const agents = Array.from(this.agents.values());

    return {
      totalAgents: agents.length,
      busyAgents: agents.filter((a) => a.status !== "idle").length,
      idleAgents: agents.filter((a) => a.status === "idle").length,
      totalExecuted: agents.reduce((sum, a) => sum + a.executedTaskCount, 0),
      averageSuccessRate:
        agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length,
      recentResults: this.executionResults.slice(-10),
    };
  }

  /**
   * Get execution history
   */
  public getExecutionHistory(limit = 50): ExecutionResult[] {
    return this.executionResults.slice(-limit);
  }

  /**
   * Pause all agents
   */
  public pauseAll(): void {
    for (const [, agent] of this.agents) {
      if (agent.status === "executing") {
        agent.status = "paused";
      }
    }
  }

  /**
   * Resume all agents
   */
  public resumeAll(): void {
    for (const [, agent] of this.agents) {
      if (agent.status === "paused") {
        agent.status = "idle";
      }
    }
  }

  /**
   * Clear execution history
   */
  public clearHistory(): void {
    this.executionResults = [];
  }

  /**
   * Get average execution time
   */
  public getAverageExecutionTime(): number {
    if (this.executionResults.length === 0) return 0;

    const total = this.executionResults.reduce(
      (sum, r) => sum + r.executionTime,
      0,
    );
    return total / this.executionResults.length;
  }

  /**
   * Get success rate
   */
  public getSuccessRate(): number {
    if (this.executionResults.length === 0) return 1;

    const successful = this.executionResults.filter((r) => r.success).length;
    return successful / this.executionResults.length;
  }
}

// Global multi-agent executor instance
export const multiAgentExecutor = new MultiAgentExecutor(4);
