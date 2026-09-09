import { describe, expect, it } from "vitest";
import { recognizeWithProviders, type OcrProvider } from "./ocr-provider";

const input = { imageData: "data:image/png;base64,iVBORw0KGgo=" };

describe("OCR provider orchestration", () => {
  it("returns real OCR output and preserves its regions", async () => {
    const provider: OcrProvider = {
      name: "remote-ocr",
      recognize: async () => ({
        provider: "remote-ocr",
        confidence: 0.91,
        regions: [
          {
            id: "roi_1",
            label: "OCR text",
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.1,
          },
        ],
        text: [
          {
            id: "text_1",
            text: "Start",
            confidence: 0.91,
            region: {
              id: "roi_1",
              x: 0.1,
              y: 0.2,
              width: 0.3,
              height: 0.1,
            },
          },
        ],
      }),
    };

    const result = await recognizeWithProviders(input, [provider]);

    expect(result.errors).toEqual([]);
    expect(result.result?.provider).toBe("remote-ocr");
    expect(result.result?.text[0].text).toBe("Start");
    expect(result.result?.regions[0].x).toBe(0.1);
  });

  it("tries the next provider and reports the failed provider", async () => {
    const failed: OcrProvider = {
      name: "tesseract",
      recognize: async () => {
        throw new Error("not installed");
      },
    };
    const working: OcrProvider = {
      name: "remote-ocr",
      recognize: async () => ({
        provider: "remote-ocr",
        confidence: 0.8,
        regions: [],
        text: [],
      }),
    };

    const result = await recognizeWithProviders(input, [failed, working]);

    expect(result.result?.provider).toBe("remote-ocr");
    expect(result.errors).toEqual(["tesseract: not installed"]);
  });

  it("returns no result when every provider fails so callers can mark fallback", async () => {
    const provider: OcrProvider = {
      name: "tesseract",
      recognize: async () => {
        throw new Error("unavailable");
      },
    };

    const result = await recognizeWithProviders(input, [provider]);

    expect(result.result).toBeUndefined();
    expect(result.errors).toEqual(["tesseract: unavailable"]);
  });
});
