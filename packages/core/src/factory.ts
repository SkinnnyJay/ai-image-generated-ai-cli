import type { EngineId } from "./constants.js";
import type { ImageEngine } from "./engine.js";
import { createGeminiEngine } from "./adapters/gemini.js";
import { createOpenAIEngine } from "./adapters/openai.js";
import { createXAIEngine } from "./adapters/xai.js";

let singleton: ImageEngine | null = null;
let singletonId: EngineId | null = null;

export type EngineFactoryOptions = {
  engineId: EngineId;
  apiKey?: string;
};

/**
 * Get or create the singleton engine for the given id. Same id returns same instance.
 */
export function getEngine(options: EngineFactoryOptions): ImageEngine {
  const { engineId, apiKey } = options;
  if (singleton && singletonId === engineId) {
    return singleton;
  }

  switch (engineId) {
    case "gemini":
      singleton = createGeminiEngine(apiKey);
      break;
    case "openai":
      singleton = createOpenAIEngine(apiKey);
      break;
    case "xai":
      singleton = createXAIEngine(apiKey);
      break;
    default: {
      // Exhaustiveness: ensures switch is updated when EngineId gains a new value
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentional for exhaustiveness
      const _: never = engineId;
      throw new Error(`Unknown engine: ${String(engineId)}`);
    }
  }
  singletonId = engineId;
  return singleton;
}

/**
 * Reset the singleton (e.g. for tests or engine switch).
 */
export function resetEngine(): void {
  singleton = null;
  singletonId = null;
}
