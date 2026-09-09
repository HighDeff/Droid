import fs from "node:fs";
import path from "node:path";

export type StorageMode = "durable" | "memory";

export interface StorageOptions {
  mode?: StorageMode;
  filePath?: string;
}

interface StorageDocument {
  version: number;
  collections: Record<string, unknown[]>;
}

const CURRENT_VERSION = 1;
const defaultPath = () =>
  process.env.ASSISTANT_STORAGE_PATH ??
  path.resolve(process.cwd(), "data", "assistant-state.json");

const emptyDocument = (): StorageDocument => ({
  version: CURRENT_VERSION,
  collections: {},
});

export class DurableStore {
  private readonly mode: StorageMode;
  private readonly filePath: string;
  private memoryDocument = emptyDocument();

  constructor(options: StorageOptions = {}) {
    this.mode =
      options.mode ??
      (process.env.ASSISTANT_STORAGE_MODE as StorageMode) ??
      "durable";
    if (this.mode !== "durable" && this.mode !== "memory") {
      throw new Error(
        `Invalid ASSISTANT_STORAGE_MODE "${this.mode}". Use "durable" or "memory".`,
      );
    }
    this.filePath = options.filePath ?? defaultPath();
    if (this.mode === "durable") this.readDocument();
  }

  readCollection<T>(name: string): T[] {
    const document = this.readDocument();
    return [...((document.collections[name] as T[] | undefined) ?? [])];
  }

  writeCollection<T>(name: string, values: T[]): void {
    const document = this.readDocument();
    document.collections[name] = values;
    this.writeDocument(document);
  }

  get configuredMode(): StorageMode {
    return this.mode;
  }

  private readDocument(): StorageDocument {
    if (this.mode === "memory") return this.memoryDocument;
    if (!fs.existsSync(this.filePath)) {
      const document = emptyDocument();
      this.writeDocument(document);
      return document;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
    } catch (error) {
      throw new Error(
        `Unable to read assistant storage at ${this.filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("version" in parsed) ||
      !("collections" in parsed)
    ) {
      throw new Error(`Invalid assistant storage document at ${this.filePath}`);
    }
    const document = parsed as StorageDocument;
    if (document.version > CURRENT_VERSION) {
      throw new Error(
        `Assistant storage version ${document.version} is newer than supported version ${CURRENT_VERSION}`,
      );
    }
    if (document.version < CURRENT_VERSION) {
      document.version = CURRENT_VERSION;
      this.writeDocument(document);
    }
    return document;
  }

  private writeDocument(document: StorageDocument): void {
    if (this.mode === "memory") {
      this.memoryDocument = document;
      return;
    }
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    try {
      fs.writeFileSync(
        temporaryPath,
        `${JSON.stringify(document, null, 2)}\n`,
        {
          encoding: "utf8",
        },
      );
      fs.renameSync(temporaryPath, this.filePath);
    } catch (error) {
      if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
      throw new Error(
        `Unable to write assistant storage at ${this.filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
