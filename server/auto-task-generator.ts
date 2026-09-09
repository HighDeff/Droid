/**
 * Auto Task Generator
 * Generates automation tasks based on game state and AI analysis
 */

import { gameStateManager } from "./state-manager";

interface GameEntity {
  type: "player" | "enemy" | "objective" | "item" | "npc" | "partner";
  name: string;
  position: { x: number; y: number };
  health?: number;
  maxHealth?: number;
  confidence: number;
  timestamp: number;
}

export interface AutoTask {
  id: string;
  name: string;
  description: string;
  priority: number;
  confidence: number;
  type: "click" | "move" | "attack" | "collect" | "navigate" | "interact";
  target?: { x: number; y: number };
  targetEntity?: string;
  conditions: string[];
  createdAt: number;
}

export type GeneratedTask = AutoTask;

interface GameState {
  gamePhase: string;
  entities: Map<string, GameEntity>;
  health?: number;
  [key: string]: any;
}

class AutoTaskGenerator {
  private taskHistory: AutoTask[] = [];
  private maxHistorySize = 100;
  private taskIdCounter = 0;

  private generateRandomPosition(): { x: number; y: number } {
    return {
      x: Math.floor(Math.random() * 1920), // Assuming 1920x1080 screen resolution
      y: Math.floor(Math.random() * 1080),
    };
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${++this.taskIdCounter}`;
  }

  generateTasks(): AutoTask[] {
    const gameState = gameStateManager.getState();
    const tasks: AutoTask[] = [];

    // Generate tasks based on current game phase
    switch (gameState.gamePhase) {
      case "menu":
        tasks.push(...this.generateMenuTasks());
        break;
      case "playing":
        tasks.push(...this.generateGameplayTasks(gameState));
        break;
      case "game_over":
        tasks.push(...this.generateGameOverTasks());
        break;
      default:
        tasks.push(...this.generateExplorationTasks(gameState));
    }

    // Store tasks in history
    tasks.forEach((task) => {
      this.taskHistory.push(task);
    });

    // Trim history
    if (this.taskHistory.length > this.maxHistorySize) {
      this.taskHistory = this.taskHistory.slice(-this.maxHistorySize);
    }

    return tasks.sort((a, b) => b.priority - a.priority);
  }

  private generateMenuTasks(): AutoTask[] {
    return [
      {
        id: this.generateTaskId(),
        name: "Start Game",
        description: "Click the start or play button to begin",
        priority: 3,
        confidence: 0.9,
        type: "click",
        target: { x: 960, y: 540 }, // Center of screen
        conditions: ["menu_visible"],
        createdAt: Date.now(),
      },
    ];
  }

  private generateGameplayTasks(gameState: GameState): AutoTask[] {
    const tasks: AutoTask[] = [];
    const entities = Array.from(gameState.entities.values()) as GameEntity[];

    // Attack nearby enemies
    const enemies = entities.filter((e) => e.type === "enemy");
    enemies.forEach((enemy, index) => {
      if (index < 2) {
        // Limit to 2 enemies
        tasks.push({
          id: this.generateTaskId(),
          name: `Attack ${enemy.name}`,
          description: `Attack enemy at position (${enemy.position.x}, ${enemy.position.y})`,
          priority: 3,
          confidence: enemy.confidence,
          type: "attack",
          target: enemy.position,
          targetEntity: enemy.name,
          conditions: ["enemy_visible", "player_alive"],
          createdAt: Date.now(),
        });
      }
    });

    // Collect nearby items
    const items = entities.filter((e) => e.type === "item");
    items.forEach((item, index) => {
      if (index < 3) {
        // Limit to 3 items
        tasks.push({
          id: this.generateTaskId(),
          name: `Collect ${item.name}`,
          description: `Collect item at position (${item.position.x}, ${item.position.y})`,
          priority: 2,
          confidence: item.confidence,
          type: "collect",
          target: item.position,
          targetEntity: item.name,
          conditions: ["item_visible", "inventory_not_full"],
          createdAt: Date.now(),
        });
      }
    });

    // Navigate to objectives
    const objectives = entities.filter((e) => e.type === "objective");
    objectives.forEach((objective, index) => {
      if (index < 1) {
        // Focus on primary objective
        tasks.push({
          id: this.generateTaskId(),
          name: `Navigate to ${objective.name}`,
          description: `Move towards objective at (${objective.position.x}, ${objective.position.y})`,
          priority: 3,
          confidence: objective.confidence,
          type: "navigate",
          target: objective.position,
          targetEntity: objective.name,
          conditions: ["objective_visible", "path_clear"],
          createdAt: Date.now(),
        });
      }
    });

    // Interact with NPCs
    const npcs = entities.filter((e) => e.type === "npc");
    npcs.forEach((npc, index) => {
      if (index < 1) {
        // Interact with one NPC at a time
        tasks.push({
          id: this.generateTaskId(),
          name: `Talk to ${npc.name}`,
          description: `Interact with NPC at (${npc.position.x}, ${npc.position.y})`,
          priority: 1,
          confidence: npc.confidence,
          type: "interact",
          target: npc.position,
          targetEntity: npc.name,
          conditions: ["npc_visible", "not_in_combat"],
          createdAt: Date.now(),
        });
      }
    });

    // Health management
    if (gameState.health < 50) {
      tasks.push({
        id: this.generateTaskId(),
        name: "Use Health Potion",
        description: "Use healing item to restore health",
        priority: 4,
        confidence: 0.8,
        type: "interact",
        conditions: ["health_low", "healing_item_available"],
        createdAt: Date.now(),
      });
    }

    return tasks;
  }

  private generateGameOverTasks(): AutoTask[] {
    return [
      {
        id: this.generateTaskId(),
        name: "Restart Game",
        description: "Click restart or try again button",
        priority: 3,
        confidence: 0.8,
        type: "click",
        target: { x: 960, y: 600 },
        conditions: ["game_over_screen"],
        createdAt: Date.now(),
      },
    ];
  }

  private generateExplorationTasks(gameState: GameState): AutoTask[] {
    const tasks: AutoTask[] = [];

    // If no specific entities detected, generate exploration tasks
    if (gameState.entities.size === 0) {
      tasks.push({
        id: this.generateTaskId(),
        name: "Explore Area",
        description: "Move around to discover new areas and entities",
        priority: 1,
        confidence: 0.6,
        type: "move",
        target: this.generateRandomPosition(),
        conditions: ["no_immediate_threats"],
        createdAt: Date.now(),
      });
    }

    return tasks;
  }

  getTaskHistory(): AutoTask[] {
    return [...this.taskHistory];
  }

  getTasksByType(type: AutoTask["type"]): AutoTask[] {
    return this.taskHistory.filter((task) => task.type === type);
  }

  getHighPriorityTasks(minPriority: number = 3): AutoTask[] {
    return this.taskHistory
      .filter((task) => task.priority >= minPriority)
      .sort((a, b) => b.priority - a.priority);
  }

  getTasks(): AutoTask[] {
    return this.generateTasks();
  }

  getTaskActions(task: AutoTask): string[] {
    switch (task.type) {
      case "attack":
        return task.targetEntity
          ? [`move_to ${task.targetEntity}`, "attack"]
          : ["attack"];
      case "collect":
      case "interact":
        return task.targetEntity
          ? [`move_to ${task.targetEntity}`, "interact"]
          : ["interact"];
      case "move":
      case "navigate":
        return task.targetEntity ? [`move_to ${task.targetEntity}`] : ["move"];
      case "click":
      default:
        return ["click"];
    }
  }

  clearHistory(): void {
    this.taskHistory = [];
    this.taskIdCounter = 0;
  }
}

export const autoTaskGenerator = new AutoTaskGenerator();
