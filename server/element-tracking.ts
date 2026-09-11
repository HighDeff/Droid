import type { RegionOfInterest, DetectedUIElement, FrameAnalysis } from "@shared/assistant";

type TrackedElement = {
  id: string;
  elementId: string;
  lastSeenAt: string;
  confidence: number;
  region: RegionOfInterest;
  history: Array<{
    timestamp: string;
    region: RegionOfInterest;
    confidence: number;
    screenshot?: string;
  }>;
  stability: number; // How stable the element position has been
  movementPattern: "static" | "drifting" | "dynamic" | "lost";
};

type ElementSnapshot = {
  timestamp: string;
  elements: TrackedElement[];
  screenshot?: string;
  analysis?: FrameAnalysis;
};

class RealTimeElementTracker {
  private trackedElements: Map<string, TrackedElement> = new Map();
  private snapshots: ElementSnapshot[] = [];
  private maxSnapshots = 30;
  private trackingSessionId: string;
  
  constructor(sessionId: string) {
    this.trackingSessionId = sessionId;
  }
  
  updateFromAnalysis(analysis: FrameAnalysis, screenshot?: string) {
    const snapshot: ElementSnapshot = {
      timestamp: new Date().toISOString(),
      elements: [],
      screenshot,
      analysis,
    };
    
    // Process detected elements
    analysis.detectedElements.forEach(detected => {
      const elementId = this.generateElementId(detected);
      const existing = this.trackedElements.get(elementId);
      
      const historyItem = {
        timestamp: new Date().toISOString(),
        region: detected.region,
        confidence: detected.confidence,
        screenshot,
      };
      
      if (existing) {
        // Update existing element
        existing.lastSeenAt = new Date().toISOString();
        existing.confidence = detected.confidence;
        existing.region = detected.region;
        existing.history.push(historyItem);
        existing.history = existing.history.slice(-20); // Keep last 20 positions
        existing.stability = this.calculateStability(existing.history);
        existing.movementPattern = this.detectMovementPattern(existing.history);
        
        this.trackedElements.set(elementId, existing);
        snapshot.elements.push(existing);
      } else {
        // New element
        const newElement: TrackedElement = {
          id: `${this.trackingSessionId}_${elementId}`,
          elementId,
          lastSeenAt: new Date().toISOString(),
          confidence: detected.confidence,
          region: detected.region,
          history: [historyItem],
          stability: 1.0,
          movementPattern: "static",
        };
        
        this.trackedElements.set(elementId, newElement);
        snapshot.elements.push(newElement);
      }
    });
    
    // Remove elements not seen in this analysis (mark as lost)
    const currentElementIds = new Set(analysis.detectedElements.map(e => this.generateElementId(e)));
    this.trackedElements.forEach((element, id) => {
      if (!currentElementIds.has(id)) {
        element.movementPattern = "lost";
        element.stability = Math.max(0, element.stability - 0.1);
      }
    });
    
    this.snapshots.push(snapshot);
    this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    
    return snapshot;
  }
  
  findElementById(elementId: string): TrackedElement | undefined {
    return this.trackedElements.get(elementId);
  }
  
  findElementsByType(type: string): TrackedElement[] {
    return Array.from(this.trackedElements.values()).filter(element => {
      const analysis = this.snapshots[this.snapshots.length - 1]?.analysis;
      const detected = analysis?.detectedElements.find(d => 
        this.generateElementId(d) === element.elementId
      );
      return detected?.type === type;
    });
  }
  
  findElementsByLabel(label: string): TrackedElement[] {
    return Array.from(this.trackedElements.values()).filter(element => {
      const analysis = this.snapshots[this.snapshots.length - 1]?.analysis;
      const detected = analysis?.detectedElements.find(d => 
        this.generateElementId(d) === element.elementId
      );
      return detected?.label?.toLowerCase().includes(label.toLowerCase());
    });
  }
  
  findElementNearRegion(region: RegionOfInterest, tolerance: number = 50): TrackedElement | undefined {
    return Array.from(this.trackedElements.values()).find(element => {
      const dx = Math.abs(element.region.x - region.x);
      const dy = Math.abs(element.region.y - region.y);
      return dx < tolerance && dy < tolerance;
    });
  }
  
  getMostStableElements(threshold: number = 0.8): TrackedElement[] {
    return Array.from(this.trackedElements.values())
      .filter(element => element.stability >= threshold)
      .sort((a, b) => b.stability - a.stability);
  }
  
  getDynamicElements(): TrackedElement[] {
    return Array.from(this.trackedElements.values())
      .filter(element => element.movementPattern === "dynamic" || element.movementPattern === "drifting");
  }
  
  getElementHistory(elementId: string): TrackedElement["history"] | undefined {
    return this.trackedElements.get(elementId)?.history;
  }
  
  predictNextPosition(elementId: string): RegionOfInterest | null {
    const element = this.trackedElements.get(elementId);
    if (!element || element.history.length < 3) return null;
    
    const recentHistory = element.history.slice(-5);
    if (recentHistory.length < 2) return null;
    
    // Simple linear prediction based on recent movement
    const latest = recentHistory[recentHistory.length - 1];
    const previous = recentHistory[recentHistory.length - 2];
    
    const dx = latest.region.x - previous.region.x;
    const dy = latest.region.y - previous.region.y;
    
    return {
      id: "predicted",
      x: latest.region.x + dx,
      y: latest.region.y + dy,
      width: latest.region.width,
      height: latest.region.height,
      confidence: Math.max(0.5, element.stability - 0.2),
    };
  }
  
  suggestAdaptiveRegion(elementId: string, currentScreenshot: string): RegionOfInterest | null {
    const element = this.trackedElements.get(elementId);
    if (!element) return null;
    
    // If element is lost or unstable, suggest expanding search area
    if (element.movementPattern === "lost" || element.stability < 0.5) {
      const lastKnown = element.history[element.history.length - 1];
      if (lastKnown) {
        const expansionFactor = 2; // Expand search area by 2x
        return {
          id: "adaptive_search",
          x: Math.max(0, lastKnown.region.x - lastKnown.region.width * (expansionFactor - 1) / 2),
          y: Math.max(0, lastKnown.region.y - lastKnown.region.height * (expansionFactor - 1) / 2),
          width: lastKnown.region.width * expansionFactor,
          height: lastKnown.region.height * expansionFactor,
          confidence: 0.3,
        };
      }
    }
    
    return null;
  }
  
  getTrackingSummary() {
    return {
      totalTracked: this.trackedElements.size,
      stable: this.getMostStableElements(0.8).length,
      dynamic: this.getDynamicElements().length,
      lost: Array.from(this.trackedElements.values()).filter(e => e.movementPattern === "lost").length,
      snapshotCount: this.snapshots.length,
      averageStability: this.calculateAverageStability(),
    };
  }
  
  reset() {
    this.trackedElements.clear();
    this.snapshots = [];
  }
  
  private generateElementId(detected: DetectedUIElement): string {
    return `${detected.type}_${detected.label || "unnamed"}_${detected.region.x}_${detected.region.y}`;
  }
  
  private calculateStability(history: TrackedElement["history"]): number {
    if (history.length < 2) return 1.0;
    
    let totalMovement = 0;
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      const dx = Math.abs(curr.region.x - prev.region.x);
      const dy = Math.abs(curr.region.y - prev.region.y);
      totalMovement += Math.sqrt(dx * dx + dy * dy);
    }
    
    const averageMovement = totalMovement / (history.length - 1);
    const stability = Math.max(0, 1 - (averageMovement / 100)); // Normalize against 100px movement
    return stability;
  }
  
  private detectMovementPattern(history: TrackedElement["history"]): TrackedElement["movementPattern"] {
    if (history.length < 3) return "static";
    
    const recent = history.slice(-5);
    let totalMovement = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];
      const dx = Math.abs(curr.region.x - prev.region.x);
      const dy = Math.abs(curr.region.y - prev.region.y);
      totalMovement += Math.sqrt(dx * dx + dy * dy);
    }
    
    const averageMovement = totalMovement / (recent.length - 1);
    
    if (averageMovement === 0) return "static";
    if (averageMovement < 10) return "drifting";
    if (averageMovement < 50) return "dynamic";
    return "lost";
  }
  
  private calculateAverageStability(): number {
    const stabilities = Array.from(this.trackedElements.values()).map(e => e.stability);
    if (stabilities.length === 0) return 0;
    return stabilities.reduce((sum, s) => sum + s, 0) / stabilities.length;
  }
}

export { RealTimeElementTracker };