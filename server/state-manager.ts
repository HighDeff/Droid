/**
 * Game State Manager
 * Centralized state management for game automation
 */

interface GameEntity {
  type: "player" | "enemy" | "objective" | "item" | "npc" | "partner";
  name: string;
  position: { x: number; y: number };
  health?: number;
  maxHealth?: number;
  confidence: number;
  timestamp: number;
}

interface GameGoal {
  id: string;
  description: string;
  priority: number;
  status: "pending" | "in_progress" | "completed";
  createdAt: number;
}

interface GameState {
  gamePhase: string;
  playerPosition: { x: number; y: number } | null;
  health: number;
  entities: Map<string, GameEntity>;
  goals: Map<string, GameGoal>;
  patterns: string[];
  imageHash: string;
  lastUpdated: number;
}

class GameStateManager {
  private state: GameState;
  private stateHistory: GameState[] = [];
  private maxHistorySize = 50;

  constructor() {
    this.state = {
      gamePhase: "unknown",
      playerPosition: null,
      health: 100,
      entities: new Map(),
      goals: new Map(),
      patterns: [],
      imageHash: "",
      lastUpdated: Date.now(),
    };
  }

  updateState(updates: Partial<GameState>): void {
    // Save current state to history
    this.stateHistory.push({ ...this.state });
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }

    // Update state
    Object.assign(this.state, updates);
    this.state.lastUpdated = Date.now();

    // Update entities if provided
    if (updates.entities) {
      this.state.entities.clear();
      updates.entities.forEach((entity: GameEntity) => {
        this.state.entities.set(`${entity.type}_${entity.name}`, entity);
      });
    }

    // Extract player position from entities
    const player = Array.from(this.state.entities.values()).find(
      (e) => e.type === "player",
    );
    if (player) {
      this.state.playerPosition = player.position;
      this.state.health = player.health || this.state.health;
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  getStateHistory(): GameState[] {
    return [...this.stateHistory];
  }

  addGoal(goal: Omit<GameGoal, "id" | "createdAt">): string {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newGoal: GameGoal = {
      ...goal,
      id,
      createdAt: Date.now(),
    };
    this.state.goals.set(id, newGoal);
    return id;
  }

  updateGoal(id: string, updates: Partial<GameGoal>): boolean {
    const goal = this.state.goals.get(id);
    if (goal) {
      Object.assign(goal, updates);
      return true;
    }
    return false;
  }

  removeGoal(id: string): boolean {
    return this.state.goals.delete(id);
  }

  getEntitiesByType(type: GameEntity["type"]): GameEntity[] {
    return Array.from(this.state.entities.values()).filter(
      (e) => e.type === type,
    );
  }

  getNearbyEntities(
    position: { x: number; y: number },
    radius: number,
  ): GameEntity[] {
    return Array.from(this.state.entities.values()).filter((entity) => {
      const dx = entity.position.x - position.x;
      const dy = entity.position.y - position.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
  }

  hasStateChanged(threshold: number = 0.1): boolean {
    if (this.stateHistory.length === 0) return true;

    const previous = this.stateHistory[this.stateHistory.length - 1];
    const current = this.state;

    // Simple change detection based on entity count and positions
    if (previous.entities.size !== current.entities.size) return true;
    if (previous.gamePhase !== current.gamePhase) return true;
    if (previous.patterns.length !== current.patterns.length) return true;

    return false;
  }

  reset(): void {
    this.state = {
      gamePhase: "unknown",
      playerPosition: null,
      health: 100,
      entities: new Map(),
      goals: new Map(),
      patterns: [],
      imageHash: "",
      lastUpdated: Date.now(),
    };
    this.stateHistory = [];
  }
}

export const gameStateManager = new GameStateManager();
