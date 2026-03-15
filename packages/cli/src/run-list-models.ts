import type { EngineId } from "@simpill/image-ai-core";
import { getCLIEngine } from "./engine-singleton.js";

export async function runListModels(engineId: EngineId): Promise<void> {
  const engine = getCLIEngine(engineId);
  const models = await engine.listModels();
  console.log(`${engine.name} models:`);
  for (const m of models) {
    console.log("  ", m);
  }
}
