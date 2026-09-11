import { Request, Response, Router } from "express";
import { z } from "zod";
import { executionStateRepository } from "../execution-state";
import { assistantStateRepository } from "../assistant-state";
import type { ExecutionEvidence, AssistantExecution } from "@shared/assistant";

const router = Router();

const createReportBody = z.object({
  executionId: z.string().min(1),
  sessionId: z.string().min(1),
  includeEvidence: z.boolean().default(true),
  includeAnalysis: z.boolean().default(true),
});

type VerificationReport = {
  id: string;
  executionId: string;
  sessionId: string;
  timestamp: string;
  status: "passed" | "failed" | "partial";
  summary: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  duration: number;
  beforeScreenshots: string[];
  afterScreenshots: string[];
  evidence: Array<{
    stepId: string;
    stepName: string;
    beforeImage?: string;
    afterImage?: string;
    verificationStatus: "passed" | "failed" | "uncertain";
    confidence: number;
    notes: string[];
    annotations: Array<{
      type: "rectangle" | "marker" | "text";
      x: number;
      y: number;
      width?: number;
      height?: number;
      label: string;
    }>;
  }>;
  accomplishments: string[];
  errors: string[];
  obstacles: string[];
  suggestions: string[];
  bestMethod?: {
    successRate: number;
    adaptationNotes: string;
    recommendedApproach: string;
  };
  autoAnalysis: {
    detectedPatterns: string[];
    optimizationOpportunities: string[];
    riskFactors: string[];
  };
};

// Generate comprehensive verification report
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const body = createReportBody.parse(req.body);
    const execution = executionStateRepository.get(body.executionId);
    
    if (!execution) {
      return res.status(404).json({ 
        success: false, 
        error: "Execution not found" 
      });
    }

    const plans = assistantStateRepository.listPlans(body.sessionId);
    const plan = plans[0];
    const report: VerificationReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      executionId: body.executionId,
      sessionId: body.sessionId,
      timestamp: new Date().toISOString(),
      status: execution.status === "completed" ? "passed" : 
             execution.status === "failed" ? "failed" : "partial",
      summary: generateExecutionSummary(execution, plan),
      totalSteps: execution.totalSteps,
      completedSteps: execution.currentStep,
      failedSteps: execution.timeline.filter(t => t.status === "failed").length,
      duration: execution.completedAt && execution.startedAt 
        ? Date.parse(execution.completedAt) - Date.parse(execution.startedAt) 
        : 0,
      beforeScreenshots: extractBeforeScreenshots(execution),
      afterScreenshots: extractAfterScreenshots(execution),
      evidence: processEvidence(execution, plan),
      accomplishments: extractAccomplishments(execution),
      errors: extractErrors(execution),
      obstacles: extractObstacles(execution),
      suggestions: generateSuggestions(execution, plan),
      bestMethod: extractBestMethod(execution),
      autoAnalysis: performAutoAnalysis(execution, plan),
    };

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate report" 
    });
  }
});

// Get report for specific execution
router.get("/:executionId", async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const { sessionId } = req.query;
    
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ 
        success: false, 
        error: "Session ID required" 
      });
    }

    const execution = executionStateRepository.get(executionId);
    if (!execution) {
      return res.status(404).json({ 
        success: false, 
        error: "Execution not found" 
      });
    }

    const plans = assistantStateRepository.listPlans(sessionId);
    const plan = plans[0];
    const report: VerificationReport = {
      id: `report_${executionId}`,
      executionId,
      sessionId,
      timestamp: execution.completedAt || new Date().toISOString(),
      status: execution.status === "completed" ? "passed" : 
             execution.status === "failed" ? "failed" : "partial",
      summary: generateExecutionSummary(execution, plan),
      totalSteps: execution.totalSteps,
      completedSteps: execution.currentStep,
      failedSteps: execution.timeline.filter(t => t.status === "failed").length,
      duration: execution.completedAt && execution.startedAt 
        ? Date.parse(execution.completedAt) - Date.parse(execution.startedAt) 
        : 0,
      beforeScreenshots: extractBeforeScreenshots(execution),
      afterScreenshots: extractAfterScreenshots(execution),
      evidence: processEvidence(execution, plan),
      accomplishments: extractAccomplishments(execution),
      errors: extractErrors(execution),
      obstacles: extractObstacles(execution),
      suggestions: generateSuggestions(execution, plan),
      bestMethod: extractBestMethod(execution),
      autoAnalysis: performAutoAnalysis(execution, plan),
    };

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get report" 
    });
  }
});

// Helper functions
function generateExecutionSummary(execution: AssistantExecution, plan?: any): string {
  const successRate = execution.currentStep / execution.totalSteps;
  const status = execution.status;
  
  if (status === "completed") {
    return `Successfully completed ${execution.currentStep}/${execution.totalSteps} steps in ${formatDuration(execution)}`;
  } else if (status === "failed") {
    return `Failed at step ${execution.currentStep}/${execution.totalSteps}: ${execution.error || "Unknown error"}`;
  } else {
    return `Execution ${status} at step ${execution.currentStep}/${execution.totalSteps}`;
  }
}

function formatDuration(execution: AssistantExecution): string {
  if (!execution.startedAt || !execution.completedAt) return "Unknown duration";
  const duration = Date.parse(execution.completedAt) - Date.parse(execution.startedAt);
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

function extractBeforeScreenshots(execution: AssistantExecution): string[] {
  return execution.evidence
    .filter(e => e.capture?.imageData)
    .map(e => e.capture!.imageData!);
}

function extractAfterScreenshots(execution: AssistantExecution): string[] {
  return execution.evidence
    .filter(e => e.capture?.imageData)
    .map(e => e.capture!.imageData!);
}

function processEvidence(execution: AssistantExecution, plan?: any): VerificationReport["evidence"] {
  return execution.evidence.map(evidence => {
    const step = plan?.steps.find(s => s.id === evidence.stepId);
    return {
      stepId: evidence.stepId,
      stepName: step?.title || `Step ${evidence.stepId}`,
      beforeImage: evidence.capture?.imageData,
      afterImage: evidence.capture?.imageData,
      verificationStatus: evidence.verification.status,
      confidence: evidence.verification.confidence || 0,
      notes: evidence.analysis?.notes || [],
      annotations: extractAnnotations(evidence),
    };
  });
}

function extractAnnotations(evidence: ExecutionEvidence): VerificationReport["evidence"][0]["annotations"] {
  const annotations: VerificationReport["evidence"][0]["annotations"] = [];
  
  // Extract regions of interest from analysis
  if (evidence.analysis?.regionsOfInterest) {
    evidence.analysis.regionsOfInterest.forEach(region => {
      annotations.push({
        type: "rectangle",
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
        label: region.label || `Region ${region.id}`,
      });
    });
  }
  
  // Extract detected elements
  if (evidence.analysis?.detectedElements) {
    evidence.analysis.detectedElements.forEach(element => {
      annotations.push({
        type: "marker",
        x: element.region.x + element.region.width / 2,
        y: element.region.y + element.region.height / 2,
        label: `${element.type}: ${element.label || "Unknown"}`,
      });
    });
  }
  
  return annotations;
}

function extractAccomplishments(execution: AssistantExecution): string[] {
  const accomplishments: string[] = [];
  
  execution.timeline.forEach(event => {
    if (event.status === "completed") {
      accomplishments.push(event.message);
    }
  });
  
  return accomplishments;
}

function extractErrors(execution: AssistantExecution): string[] {
  const errors: string[] = [];
  
  execution.timeline.forEach(event => {
    if (event.status === "failed") {
      errors.push(event.message);
    }
  });
  
  if (execution.error) {
    errors.push(execution.error);
  }
  
  return errors;
}

function extractObstacles(execution: AssistantExecution): string[] {
  const obstacles: string[] = [];
  
  execution.timeline.forEach(event => {
    if (event.status === "retry") {
      obstacles.push(`Retry required: ${event.message}`);
    }
  });
  
  if (execution.pendingApproval) {
    obstacles.push(`Approval required: ${execution.pendingApproval.reason}`);
  }
  
  return obstacles;
}

function generateSuggestions(execution: AssistantExecution, plan?: any): string[] {
  const suggestions: string[] = [];
  
  if (execution.status === "failed") {
    suggestions.push("Review the error details and adjust the execution plan");
    suggestions.push("Consider adding wait conditions for dynamic elements");
  }
  
  if (execution.pendingApproval) {
    suggestions.push("Review the pending approval requirements");
  }
  
  const retryCount = execution.timeline.filter(t => t.status === "retry").length;
  if (retryCount > 2) {
    suggestions.push("High retry count detected - consider adding adaptive delays");
  }
  
  return suggestions;
}

function extractBestMethod(execution: AssistantExecution): VerificationReport["bestMethod"] | undefined {
  const successfulSteps = execution.timeline.filter(t => t.status === "completed").length;
  const totalSteps = execution.totalSteps;
  const successRate = successfulSteps / totalSteps;
  
  if (successRate > 0.8) {
    return {
      successRate,
      adaptationNotes: "High success rate - current method is effective",
      recommendedApproach: "Continue with current approach and parameters",
    };
  }
  
  return undefined;
}

function performAutoAnalysis(execution: AssistantExecution, plan?: any): VerificationReport["autoAnalysis"] {
  const detectedPatterns: string[] = [];
  const optimizationOpportunities: string[] = [];
  const riskFactors: string[] = [];
  
  // Analyze timing patterns
  const stepDurations = analyzeStepDurations(execution);
  if (stepDurations.some(d => d > 5000)) {
    detectedPatterns.push("Some steps take longer than 5 seconds");
    optimizationOpportunities.push("Consider adding explicit wait conditions for slow steps");
  }
  
  // Analyze retry patterns
  const retrySteps = execution.timeline.filter(t => t.status === "retry");
  if (retrySteps.length > 0) {
    detectedPatterns.push("Retries occurred during execution");
    riskFactors.push("Dynamic elements detected - may need adaptive timing");
  }
  
  // Analyze verification patterns
  const failedVerifications = execution.evidence.filter(e => e.verification.status === "failed");
  if (failedVerifications.length > 0) {
    detectedPatterns.push("Verification failures detected");
    optimizationOpportunities.push("Improve element detection strategies");
  }
  
  return {
    detectedPatterns,
    optimizationOpportunities,
    riskFactors,
  };
}

function analyzeStepDurations(execution: AssistantExecution): number[] {
  const durations: number[] = [];
  let lastTimestamp = execution.startedAt ? Date.parse(execution.startedAt) : Date.now();
  
  execution.timeline.forEach(event => {
    const eventTime = Date.parse(event.timestamp);
    durations.push(eventTime - lastTimestamp);
    lastTimestamp = eventTime;
  });
  
  return durations;
}

export { router as verificationReportsRouter };