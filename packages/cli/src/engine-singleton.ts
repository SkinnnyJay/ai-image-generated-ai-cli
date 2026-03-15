import {
  getEngine as coreGetEngine,
  resetEngine as coreResetEngine,
  type EngineId,
} from "@simpill/image-ai-core";

let currentEngineId: EngineId | null = null;

/**
 * CLI singleton: get the engine for the given id, reusing instance when id matches.
 */
export function getCLIEngine(engineId: EngineId, apiKey?: string) {
  if (currentEngineId !== engineId) {
    coreResetEngine();
  }
  const engine = coreGetEngine({ engineId, apiKey });
  currentEngineId = engineId;
  return engine;
}

export function resetCLIEngine(): void {
  coreResetEngine();
  currentEngineId = null;
}
