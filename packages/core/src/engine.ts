import type { GenerateRequest, GenerateResponse } from "./schemas.js";

/**
 * Contract for an image-generation engine. Implementations (Gemini, OpenAI, xAI)
 * are swappable without changing caller logic.
 */
export interface ImageEngine {
  readonly engineId: "gemini" | "openai" | "xai";

  /** Human-readable name for help and UI. */
  readonly name: string;

  /** List model IDs this engine supports (for CLI help and discovery). */
  listModels(): Promise<string[]>;

  /** Generate images from a validated request. */
  generate(request: GenerateRequest): Promise<GenerateResponse>;

  /** Help text for CLI, derived from command specs. */
  getHelp?(): { command: string; description: string; options?: string }[];
}
