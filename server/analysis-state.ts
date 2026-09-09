import type { FrameAnalysis } from "@shared/assistant";

const createId = () =>
  `analysis_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export class AnalysisRepository {
  private readonly analyses = new Map<string, FrameAnalysis>();

  create(input: Omit<FrameAnalysis, "id">): FrameAnalysis {
    const analysis = { ...input, id: createId() };
    this.analyses.set(analysis.id, analysis);
    return analysis;
  }

  get(id: string): FrameAnalysis | undefined {
    return this.analyses.get(id);
  }

  list(captureId?: string, sessionId?: string): FrameAnalysis[] {
    return [...this.analyses.values()]
      .filter(
        (analysis) =>
          (!captureId || analysis.captureId === captureId) &&
          (!sessionId || analysis.sessionId === sessionId),
      )
      .sort((a, b) => b.analyzedAt.localeCompare(a.analyzedAt));
  }
}

export const analysisRepository = new AnalysisRepository();
