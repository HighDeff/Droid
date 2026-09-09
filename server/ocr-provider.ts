import { spawn } from "child_process";
import type { OCRTextBlock, RegionOfInterest } from "@shared/assistant";

export interface OcrInput {
  imageData?: string;
  imageRef?: string;
}

export interface OcrResult {
  provider: "tesseract" | "remote-ocr";
  text: OCRTextBlock[];
  confidence: number;
  regions: RegionOfInterest[];
}

export interface OcrProvider {
  readonly name: OcrResult["provider"];
  recognize(input: OcrInput): Promise<OcrResult>;
}

export class OcrProviderError extends Error {
  constructor(
    message: string,
    readonly provider: OcrResult["provider"],
  ) {
    super(message);
    this.name = "OcrProviderError";
  }
}

const DEFAULT_TIMEOUT_MS = 8_000;

function decodeImageData(imageData: string): Buffer {
  const encoded = imageData.includes(",")
    ? imageData.slice(imageData.indexOf(",") + 1)
    : imageData;
  if (!/^[a-z0-9+/=\s]+$/i.test(encoded)) {
    throw new Error("imageData is not valid base64");
  }
  return Buffer.from(encoded, "base64");
}

function imageDimensions(image: Buffer): { width: number; height: number } {
  if (
    image.length >= 24 &&
    image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
  }
  if (image.length >= 4 && image[0] === 0xff && image[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < image.length) {
      if (image[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = image[offset + 1];
      const length = image.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          width: image.readUInt16BE(offset + 7),
          height: image.readUInt16BE(offset + 5),
        };
      }
      offset += 2 + length;
    }
  }
  return { width: 1, height: 1 };
}

function normalizeRegion(
  left: number,
  top: number,
  width: number,
  height: number,
  dimensions: { width: number; height: number },
  id: string,
): RegionOfInterest {
  return {
    id,
    label: "OCR text",
    x: Math.max(0, Math.min(1, left / dimensions.width)),
    y: Math.max(0, Math.min(1, top / dimensions.height)),
    width: Math.max(0, Math.min(1, width / dimensions.width)),
    height: Math.max(0, Math.min(1, height / dimensions.height)),
  };
}

function parseTsv(
  tsv: string,
  dimensions: { width: number; height: number },
): Pick<OcrResult, "text" | "confidence" | "regions"> {
  const lines = tsv.trim().split(/\r?\n/);
  const text: OCRTextBlock[] = [];
  const regions: RegionOfInterest[] = [];
  for (const [index, line] of lines.entries()) {
    if (index === 0 || !line.trim()) continue;
    const columns = line.split("\t");
    if (columns.length < 12) continue;
    const value = columns[11].trim();
    const confidence = Number(columns[10]);
    if (!value || !Number.isFinite(confidence) || confidence < 0) continue;
    const region = normalizeRegion(
      Number(columns[6]),
      Number(columns[7]),
      Number(columns[8]),
      Number(columns[9]),
      dimensions,
      `roi_ocr_${text.length + 1}`,
    );
    text.push({
      id: `ocr_${text.length + 1}`,
      text: value,
      confidence: Math.min(1, confidence / 100),
      region,
    });
    regions.push(region);
  }
  const confidence = text.length
    ? text.reduce((sum, block) => sum + block.confidence, 0) / text.length
    : 0;
  return { text, confidence, regions };
}

export class TesseractOcrProvider implements OcrProvider {
  readonly name = "tesseract" as const;

  constructor(
    private readonly timeoutMs = Number(process.env.OCR_TIMEOUT_MS) ||
      DEFAULT_TIMEOUT_MS,
  ) {}

  recognize(input: OcrInput): Promise<OcrResult> {
    if (!input.imageData) {
      return Promise.reject(
        new OcrProviderError("Image data is required for local OCR", this.name),
      );
    }
    const image = decodeImageData(input.imageData);
    const dimensions = imageDimensions(image);
    return new Promise((resolve, reject) => {
      const process = spawn(
        "tesseract",
        ["stdin", "stdout", "--psm", "6", "tsv"],
        {
          stdio: ["pipe", "pipe", "pipe"],
        },
      );
      let output = "";
      let errorOutput = "";
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (error) reject(new OcrProviderError(error.message, this.name));
        else {
          const parsed = parseTsv(output, dimensions);
          resolve({ provider: this.name, ...parsed });
        }
      };
      const timeout = setTimeout(() => {
        process.kill();
        finish(new Error(`Tesseract timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
      process.stdout.on("data", (chunk) => (output += chunk.toString()));
      process.stderr.on("data", (chunk) => (errorOutput += chunk.toString()));
      process.on("error", (error) => finish(error));
      process.on("close", (code) => {
        if (code === 0) finish();
        else
          finish(
            new Error(
              errorOutput.trim() || `Tesseract exited with code ${code}`,
            ),
          );
      });
      process.stdin.end(image);
    });
  }
}

export class RemoteOcrProvider implements OcrProvider {
  readonly name = "remote-ocr" as const;

  constructor(
    private readonly endpoint: string,
    private readonly apiKey = process.env.OCR_REMOTE_API_KEY,
    private readonly timeoutMs = Number(process.env.OCR_TIMEOUT_MS) ||
      DEFAULT_TIMEOUT_MS,
  ) {}

  async recognize(input: OcrInput): Promise<OcrResult> {
    if (!input.imageData) {
      throw new OcrProviderError(
        "Image data is required for remote OCR",
        this.name,
      );
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ imageData: input.imageData }),
      signal: AbortSignal.timeout(this.timeoutMs),
    }).catch((error) => {
      throw new OcrProviderError(
        error instanceof Error ? error.message : "Remote OCR request failed",
        this.name,
      );
    });
    if (!response.ok) {
      throw new OcrProviderError(
        `Remote OCR returned HTTP ${response.status}`,
        this.name,
      );
    }
    const payload = (await response.json()) as {
      text?: OCRTextBlock[];
      ocrText?: OCRTextBlock[];
      confidence?: number;
      regions?: RegionOfInterest[];
    };
    const text = payload.text ?? payload.ocrText ?? [];
    if (
      !Array.isArray(text) ||
      text.some((block) => !block || typeof block.text !== "string")
    ) {
      throw new OcrProviderError(
        "Remote OCR returned an invalid text payload",
        this.name,
      );
    }
    const regions =
      payload.regions ??
      text.flatMap((block) => (block.region ? [block.region] : []));
    return {
      provider: this.name,
      text,
      confidence: Number.isFinite(payload.confidence)
        ? Math.max(0, Math.min(1, payload.confidence!))
        : text.length
          ? text.reduce((sum, block) => sum + block.confidence, 0) / text.length
          : 0,
      regions,
    };
  }
}

export function configuredOcrProviders(): OcrProvider[] {
  const providers: OcrProvider[] = [];
  if (process.env.OCR_REMOTE_URL)
    providers.push(new RemoteOcrProvider(process.env.OCR_REMOTE_URL));
  providers.push(new TesseractOcrProvider());
  return providers;
}

export async function recognizeWithProviders(
  input: OcrInput,
  providers: OcrProvider[] = configuredOcrProviders(),
): Promise<{ result?: OcrResult; errors: string[] }> {
  const errors: string[] = [];
  for (const provider of providers) {
    try {
      return { result: await provider.recognize(input), errors };
    } catch (error) {
      errors.push(
        `${provider.name}: ${error instanceof Error ? error.message : "provider failed"}`,
      );
    }
  }
  return { errors };
}
