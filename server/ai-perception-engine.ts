/**
 * AI #1: Qwen Vision Perception & Feedback Positioning Engine
 * Inspects live screenshots to generate structured screen auto-descriptions,
 * detects UI elements with precise (X,Y,W,H) bounding boxes, and provides focus positioning.
 */

export interface DetectedUIElement {
  id: string;
  name: string;
  type:
    | "button"
    | "input"
    | "icon"
    | "text"
    | "toggle"
    | "captcha"
    | "target"
    | "dialog"
    | "checkbox"
    | "other";
  boundingBox: { x: number; y: number; width: number; height: number };
  center: { x: number; y: number };
  confidence: number;
  interactive: boolean;
  textValue?: string;
}

export interface ScreenPerceptionReport {
  timestamp: number;
  screenDescription: string;
  activeWindow: string;
  visualStateChange: string;
  elements: DetectedUIElement[];
  feedbackPosition: { x: number; y: number };
  primarySuggestion: string;
  confidence: number;
  rawAnalysis?: string;
  /**
   * True when perception failed and this report is a degraded placeholder.
   * Callers must NOT treat elements/feedbackPosition as real targets —
   * refuse to act and ask for a re-scan instead.
   */
  degraded?: boolean;
  /**
   * Pixel dimensions of the frame the coordinates refer to.
   * Execution layers must rescale from this space to device pixels.
   */
  frameSize?: { width: number; height: number };
}

export class QwenVisionPerceptionEngine {
  private lastDescription = "";
  private lastImageHash = "";

  async analyzeScreen(
    imageData: string,
    endpoint = "https://remote.quantumpass.io/ollama/api/chat",
    model = "qwen2.5vl:7b",
    frameSize?: { width: number; height: number },
  ): Promise<ScreenPerceptionReport> {
    const base64Image = imageData.includes(",")
      ? imageData.split(",")[1]
      : imageData;
    // Coordinate space: the model must return pixel coordinates in the
    // ACTUAL frame dimensions, not a normalized space. The executor rescales
    // from this space to device pixels at action time.
    const fw =
      frameSize && frameSize.width > 0 ? Math.round(frameSize.width) : 1920;
    const fh =
      frameSize && frameSize.height > 0 ? Math.round(frameSize.height) : 1080;
    const cx = Math.round(fw / 2);
    const cy = Math.round(fh / 2);

    const systemPromptTemplate = `You are an expert Computer Vision Perception AI specialized in GUI and Game Automation.
Analyze the provided screenshot with high precision.
Return a STRICT valid JSON object matching this schema:
{
  "screenDescription": "Concise summary of what is currently displayed on the screen, active dialogs, and current view",
  "activeWindow": "Name or title of the main application/window in focus",
  "visualStateChange": "Notable state changes observed (e.g., modal opened, button active, input focused, page loaded, captcha prompt)",
  "feedbackPosition": { "x": __CX__, "y": __CY__ },
  "primarySuggestion": "Immediate recommended visual focus or next action candidate",
  "confidence": 0.95,
  "elements": [
    {
      "id": "elem_1",
      "name": "Submit Button",
      "type": "button",
      "boundingBox": { "x": __BX__, "y": __BY__, "width": 120, "height": 40 },
      "center": { "x": __BCX__, "y": __BCY__ },
      "confidence": 0.92,
      "interactive": true,
      "textValue": "Submit"
    }
  ]
}
IMPORTANT: Output ONLY the raw JSON without markdown formatting or code blocks. The screenshot is exactly __FW__x__FH__ pixels: report ALL coordinates (bounding boxes, centers, feedbackPosition) as integer pixel positions in THAT space, x in [0, __FW__], y in [0, __FH__]. Do not normalize, scale, or guess — the executor rescales from this exact space to device pixels at action time.`;
    const systemPrompt = systemPromptTemplate
      .replace(/__FW__/g, String(fw))
      .replace(/__FH__/g, String(fh))
      .replace(/__CX__/g, String(cx))
      .replace(/__CY__/g, String(cy))
      .replace(/__BX__/g, String(Math.max(0, cx - 160)))
      .replace(/__BY__/g, String(Math.max(0, cy - 60)))
      .replace(/__BCX__/g, String(Math.max(0, cx - 100)))
      .replace(/__BCY__/g, String(Math.max(0, cy - 40)));

    try {
      const payload = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Perform complete visual breakdown of this screen, identify all interactive UI elements with bounding boxes and coordinates, and suggest the key visual focus point.",
            images: [base64Image],
          },
        ],
        stream: false,
        format: "json",
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Ollama Vision API returned ${response.statusText}`);
      }

      const data = await response.json();
      const rawContent = data.message?.content || "{}";

      let parsed: any;
      try {
        const cleaned = rawContent
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        console.warn(
          "Failed to parse pure JSON from vision response, using fallback heuristic",
          parseErr,
        );
        parsed = this.fallbackExtraction(rawContent, fw, fh);
      }

      const elementsRaw = Array.isArray(parsed.elements) ? parsed.elements : [];
      const report: ScreenPerceptionReport = {
        timestamp: Date.now(),
        screenDescription:
          parsed.screenDescription ||
          "Active workspace display with interactive elements.",
        activeWindow: parsed.activeWindow || "Main Application",
        visualStateChange:
          parsed.visualStateChange ||
          (this.lastDescription ? "State updated" : "Initial frame"),
        elements: elementsRaw.map((el: any, idx: number) => ({
          id: el.id || `elem_${idx + 1}`,
          name: el.name || `Element ${idx + 1}`,
          // Never invent a type: unknown stays "other" so filters/heuristics
          // don't treat it as an actionable button/input.
          type: el.type || "other",
          boundingBox: el.boundingBox || {
            x: (el.center?.x ?? cx) - 40,
            y: (el.center?.y ?? cy) - 17,
            width: 80,
            height: 35,
          },
          center: el.center || { x: cx, y: cy },
          confidence:
            typeof el.confidence === "number" ? el.confidence : 0.5,
          interactive: el.interactive === true,
          textValue: el.textValue || "",
        })),
        feedbackPosition: parsed.feedbackPosition || { x: cx, y: cy },
        primarySuggestion:
          parsed.primarySuggestion ||
          "Inspect interactive targets and execute planned sequence.",
        confidence:
          typeof parsed.confidence === "number" ? parsed.confidence : 0.88,
        rawAnalysis: rawContent,
        degraded: parsed.degraded === true || elementsRaw.length === 0,
        frameSize: { width: fw, height: fh },
      };

      this.lastDescription = report.screenDescription;
      return report;
    } catch (err) {
      console.error(
        "Qwen Vision perception failed, providing structured fallback:",
        err,
      );
      return this.generateFallbackReport(
        err instanceof Error ? err.message : String(err),
        fw,
        fh,
      );
    }
  }

  private fallbackExtraction(raw: string, fw = 1920, fh = 1080): any {
    const cx = Math.round(fw / 2);
    const cy = Math.round(fh / 2);
    return {
      screenDescription: raw.slice(0, 200) || "Active interface detected.",
      activeWindow: "Desktop Window",
      visualStateChange: "Screen refreshed",
      feedbackPosition: { x: cx, y: cy },
      primarySuggestion: "Re-scan: perception output was not valid JSON.",
      confidence: 0,
      elements: [],
      degraded: true,
    };
  }

  /**
   * No fabricated elements: on failure we return an empty element list
   * flagged as degraded so the UI refuses to act on fake targets.
   */
  private generateDefaultElements(): DetectedUIElement[] {
    return [];
  }

  private generateFallbackReport(
    errorMsg: string,
    fw = 1920,
    fh = 1080,
  ): ScreenPerceptionReport {
    const cx = Math.round(fw / 2);
    const cy = Math.round(fh / 2);
    return {
      timestamp: Date.now(),
      screenDescription: `Perception degraded: ${errorMsg}. Re-scan to continue.`,
      activeWindow: "Unknown",
      visualStateChange: "Perception unavailable",
      elements: [],
      feedbackPosition: { x: cx, y: cy },
      primarySuggestion: "Perception failed — re-scan before acting.",
      confidence: 0,
      degraded: true,
      frameSize: { width: fw, height: fh },
    };
  }
}

export const qwenVisionEngine = new QwenVisionPerceptionEngine();
