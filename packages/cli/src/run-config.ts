import { ENV_KEYS, ENGINE_IDS, type EngineId } from "@simpill/image-ai-core";

const ENGINE_ENV_KEY: Record<EngineId, string> = {
  gemini: ENV_KEYS.GEMINI_API_KEY,
  openai: ENV_KEYS.OPENAI_API_KEY,
  xai: ENV_KEYS.XAI_API_KEY,
};

export function runConfig(): void {
  console.log("Config check:");
  for (const id of ENGINE_IDS) {
    const set = Boolean(process.env[ENGINE_ENV_KEY[id]]);
    console.log(`  ${id}: ${set ? "API key set" : "API key not set"}`);
  }
}
