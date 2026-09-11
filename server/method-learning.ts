import { assistantStateRepository } from "./assistant-state";
import type { AssistantPlan, AssistantExecution, ScreenshotCapture } from "@shared/assistant";

type MethodSignature = {
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
  efficiency: number; // Steps completed per minute
  reliability: number; // Consistency of success
};

type MethodComparison = {
  methodId: string;
  similarity: number;
  successRateDiff: number;
  efficiencyDiff: number;
  recommendation: string;
};

type LearningContext = {
  sessionId: string;
  applicationName?: string;
  screenLayout: string;
  userIntent: string;
  environmentalFactors: string[];
  timeOfDay: string;
  deviceType: string;
};

class MethodLearningSystem {
  private methods: Map<string, MethodSignature> = new Map();
  private executionHistory: Map<string, Array<{ executionId: string; timestamp: string; success: boolean; duration: number }>> = new Map();
  private crossReferences: Map<string, Set<string>> = new Map(); // Similar methods

  learnFromExecution(execution: AssistantExecution, plan: AssistantPlan, context: LearningContext) {
    const methodId = this.generateMethodId(plan, context);
    const existingMethod = this.methods.get(methodId);
    
    const success = execution.status === "completed";
    const duration = execution.completedAt && execution.startedAt 
      ? Date.parse(execution.completedAt) - Date.parse(execution.startedAt) 
      : 0;
    
    // Update execution history
    const history = this.executionHistory.get(methodId) || [];
    history.push({
      executionId: execution.id,
      timestamp: new Date().toISOString(),
      success,
      duration,
    });
    this.executionHistory.set(methodId, history.slice(-50)); // Keep last 50 executions
    
    // Calculate metrics
    const totalExecutions = history.length;
    const successCount = history.filter(h => h.success).length;
    const successRate = successCount / totalExecutions;
    const averageDuration = history.reduce((sum, h) => sum + h.duration, 0) / totalExecutions;
    const efficiency = (execution.currentStep / execution.totalSteps) / (averageDuration / 60000); // Steps per minute
    const reliability = this.calculateReliability(history);
    
    // Find similar methods
    const similarMethods = this.findSimilarMethods(plan, context);
    
    const method: MethodSignature = {
      id: methodId,
      name: this.generateMethodName(plan, context),
      description: this.generateMethodDescription(plan, context),
      successRate,
      totalExecutions,
      lastUsedAt: new Date().toISOString(),
      averageDuration,
      adaptationNotes: this.extractAdaptationNotes(execution, plan),
      similarMethods: similarMethods.map(m => m.methodId),
      learnedFrom: existingMethod ? [...existingMethod.learnedFrom, methodId] : [methodId],
      contexts: [context.userIntent, context.applicationName || "unknown", context.screenLayout].filter(Boolean),
      efficiency,
      reliability,
    };
    
    this.methods.set(methodId, method);
    
    // Update cross-references
    similarMethods.forEach(similar => {
      const refs = this.crossReferences.get(similar.methodId) || new Set();
      refs.add(methodId);
      this.crossReferences.set(similar.methodId, refs);
      
      const reverseRefs = this.crossReferences.get(methodId) || new Set();
      reverseRefs.add(similar.methodId);
      this.crossReferences.set(methodId, reverseRefs);
    });
    
    // Auto-improve method if better than similar ones
    this.autoImproveMethod(methodId, similarMethods);
    
    return method;
  }
  
  getBestMethodForContext(context: LearningContext): MethodSignature | null {
    const candidates = Array.from(this.methods.values()).filter(method => {
      // Match by context similarity
      return method.contexts.some(ctx => 
        ctx.toLowerCase().includes(context.userIntent.toLowerCase()) ||
        (context.applicationName && ctx.toLowerCase().includes(context.applicationName.toLowerCase()))
      );
    });
    
    if (candidates.length === 0) return null;
    
    // Sort by success rate, efficiency, and reliability
    candidates.sort((a, b) => {
      const scoreA = (a.successRate * 0.4) + (a.efficiency * 0.3) + (a.reliability * 0.3);
      const scoreB = (b.successRate * 0.4) + (b.efficiency * 0.3) + (b.reliability * 0.3);
      return scoreB - scoreA;
    });
    
    return candidates[0];
  }
  
  compareMethods(methodId1: string, methodId2: string): MethodComparison {
    const method1 = this.methods.get(methodId1);
    const method2 = this.methods.get(methodId2);
    
    if (!method1 || !method2) {
      throw new Error("One or both methods not found");
    }
    
    const similarity = this.calculateMethodSimilarity(method1, method2);
    const successRateDiff = method1.successRate - method2.successRate;
    const efficiencyDiff = method1.efficiency - method2.efficiency;
    
    let recommendation = "Methods are comparable";
    if (successRateDiff > 0.2) {
      recommendation = `Method 1 has significantly higher success rate (${(successRateDiff * 100).toFixed(1)}%)`;
    } else if (successRateDiff < -0.2) {
      recommendation = `Method 2 has significantly higher success rate (${(Math.abs(successRateDiff) * 100).toFixed(1)}%)`;
    } else if (efficiencyDiff > 0.5) {
      recommendation = `Method 1 is more efficient (${efficiencyDiff.toFixed(1)} steps/min difference)`;
    } else if (efficiencyDiff < -0.5) {
      recommendation = `Method 2 is more efficient (${Math.abs(efficiencyDiff).toFixed(1)} steps/min difference)`;
    }
    
    return {
      methodId: methodId2,
      similarity,
      successRateDiff,
      efficiencyDiff,
      recommendation,
    };
  }
  
  suggestOptimizations(methodId: string): string[] {
    const method = this.methods.get(methodId);
    if (!method) return [];
    
    const suggestions: string[] = [];
    const history = this.executionHistory.get(methodId) || [];
    
    // Analyze execution patterns
    const failedExecutions = history.filter(h => !h.success);
    if (failedExecutions.length > 0) {
      suggestions.push("Consider adding adaptive wait conditions for dynamic elements");
      suggestions.push("Review failure patterns to identify common obstacles");
    }
    
    // Duration analysis
    const slowExecutions = history.filter(h => h.duration > method.averageDuration * 1.5);
    if (slowExecutions.length > history.length * 0.3) {
      suggestions.push("Some executions are significantly slower - consider optimizing timing");
    }
    
    // Success rate analysis
    if (method.successRate < 0.8) {
      suggestions.push("Success rate below 80% - consider improving element detection strategies");
      suggestions.push("Add more robust error handling and retry logic");
    }
    
    // Cross-reference with similar methods
    const similarMethods = method.similarMethods
      .map(id => this.methods.get(id))
      .filter((m): m is MethodSignature => m !== undefined);
    
    similarMethods.forEach(similar => {
      if (similar.successRate > method.successRate + 0.1) {
        suggestions.push(`Consider adopting techniques from "${similar.name}" which has higher success rate`);
      }
      if (similar.efficiency > method.efficiency + 0.5) {
        suggestions.push(`Consider efficiency improvements from "${similar.name}" which is faster`);
      }
    });
    
    return suggestions;
  }
  
  getMethodInsights(methodId: string) {
    const method = this.methods.get(methodId);
    if (!method) return null;
    
    const history = this.executionHistory.get(methodId) || [];
    const similarMethods = method.similarMethods
      .map(id => this.methods.get(id))
      .filter((m): m is MethodSignature => m !== undefined);
    
    return {
      method,
      executionHistory: history,
      similarMethods,
      trends: this.analyzeTrends(history),
      crossReferences: Array.from(this.crossReferences.get(methodId) || []),
      optimizationSuggestions: this.suggestOptimizations(methodId),
    };
  }
  
  private generateMethodId(plan: AssistantPlan, context: LearningContext): string {
    const planSignature = plan.steps.map(s => `${s.action}_${s.title}`).join("_");
    const contextSignature = `${context.applicationName || "unknown"}_${context.userIntent}`;
    return `method_${this.hashString(planSignature + contextSignature)}`;
  }
  
  private generateMethodName(plan: AssistantPlan, context: LearningContext): string {
    const action = plan.steps[0]?.action || "automated";
    const target = context.applicationName || "application";
    const intent = context.userIntent.split(" ").slice(0, 3).join("_");
    return `${action}_${target}_${intent}`;
  }
  
  private generateMethodDescription(plan: AssistantPlan, context: LearningContext): string {
    const stepCount = plan.steps.length;
    const primaryAction = plan.steps[0]?.action || "automation";
    return `${stepCount}-step ${primaryAction} workflow for ${context.userIntent}`;
  }
  
  private extractAdaptationNotes(execution: AssistantExecution, plan: AssistantPlan): string[] {
    const notes: string[] = [];
    
    execution.timeline.forEach(event => {
      if (event.status === "retry") {
        notes.push(`Retry required: ${event.message}`);
      }
      if (event.status === "verification") {
        notes.push(`Verification check: ${event.message}`);
      }
    });
    
    execution.evidence.forEach(evidence => {
      if (evidence.verification.status === "uncertain") {
        notes.push(`Uncertain verification: ${evidence.verification.reason}`);
      }
    });
    
    return notes;
  }
  
  private findSimilarMethods(plan: AssistantPlan, context: LearningContext): Array<{ methodId: string; similarity: number }> {
    const planSignature = this.generateMethodSignature(plan);
    
    return Array.from(this.methods.entries())
      .map(([id, method]) => ({
        methodId: id,
        similarity: this.calculateSignatureSimilarity(planSignature, method),
      }))
      .filter(result => result.similarity > 0.5)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  }
  
  private generateMethodSignature(plan: AssistantPlan): string {
    return plan.steps.map(s => `${s.action}_${s.timing}`).join("_");
  }
  
  private calculateSignatureSimilarity(signature: string, method: MethodSignature): number {
    // Simple similarity calculation based on context overlap
    const methodContexts = method.contexts.join(" ").toLowerCase();
    const signatureLower = signature.toLowerCase();
    
    let matches = 0;
    method.contexts.forEach(ctx => {
      if (signatureLower.includes(ctx.toLowerCase())) matches++;
    });
    
    return Math.min(matches / method.contexts.length, 1);
  }
  
  private calculateMethodSimilarity(method1: MethodSignature, method2: MethodSignature): number {
    const contextOverlap = method1.contexts.filter(c => method2.contexts.includes(c)).length;
    const maxContexts = Math.max(method1.contexts.length, method2.contexts.length);
    return contextOverlap / maxContexts;
  }
  
  private calculateReliability(history: Array<{ success: boolean; duration: number }>): number {
    if (history.length < 3) return 1; // Not enough data, assume reliable
    
    const recentHistory = history.slice(-10);
    const successRate = recentHistory.filter(h => h.success).length / recentHistory.length;
    const durationVariance = this.calculateVariance(recentHistory.map(h => h.duration));
    const normalizedVariance = Math.min(durationVariance / 10000, 1); // Normalize against 10s variance
    
    // Higher success rate and lower duration variance = higher reliability
    return (successRate * 0.7) + ((1 - normalizedVariance) * 0.3);
  }
  
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
  
  private autoImproveMethod(methodId: string, similarMethods: Array<{ methodId: string; similarity: number }>) {
    const currentMethod = this.methods.get(methodId);
    if (!currentMethod) return;
    
    similarMethods.forEach(similar => {
      const similarMethod = this.methods.get(similar.methodId);
      if (!similarMethod) return;
      
      // If similar method is significantly better, note it for future improvements
      if (similarMethod.successRate > currentMethod.successRate + 0.15) {
        currentMethod.adaptationNotes.push(
          `Consider adopting techniques from ${similarMethod.name} for better success rate`
        );
      }
      
      if (similarMethod.efficiency > currentMethod.efficiency + 0.5) {
        currentMethod.adaptationNotes.push(
          `Consider efficiency improvements from ${similarMethod.name}`
        );
      }
    });
    
    this.methods.set(methodId, currentMethod);
  }
  
  private analyzeTrends(history: Array<{ timestamp: string; success: boolean; duration: number }>) {
    if (history.length < 5) return { improving: false, stable: true };
    
    const recentSuccessRate = history.slice(-5).filter(h => h.success).length / 5;
    const olderSuccessRate = history.slice(0, -5).filter(h => h.success).length / Math.max(history.length - 5, 1);
    
    const recentAvgDuration = history.slice(-5).reduce((sum, h) => sum + h.duration, 0) / 5;
    const olderAvgDuration = history.slice(0, -5).reduce((sum, h) => sum + h.duration, 0) / Math.max(history.length - 5, 1);
    
    return {
      improving: recentSuccessRate > olderSuccessRate + 0.1,
      gettingFaster: recentAvgDuration < olderAvgDuration * 0.9,
      stable: Math.abs(recentSuccessRate - olderSuccessRate) < 0.1,
    };
  }
  
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  getAllMethods(): MethodSignature[] {
    return Array.from(this.methods.values());
  }
  
  getMethod(methodId: string): MethodSignature | undefined {
    return this.methods.get(methodId);
  }
}

export const methodLearningSystem = new MethodLearningSystem();
export type { MethodSignature, MethodComparison, LearningContext };