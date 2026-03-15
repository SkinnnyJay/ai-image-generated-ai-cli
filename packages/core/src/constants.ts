/**
 * Centralized constants and env keys. No magic strings at call sites.
 */

export const ENV_KEYS = {
  GEMINI_API_KEY: "GEMINI_API_KEY",
  OPENAI_API_KEY: "OPENAI_API_KEY",
  XAI_API_KEY: "XAI_API_KEY",
  GEMINI_API_MODEL: "GEMINI_API_MODEL",
  OPENAI_API_MODEL: "OPENAI_API_MODEL",
  XAI_API_MODEL: "XAI_API_MODEL",
} as const;

export const DEFAULT_MODELS = {
  GEMINI: "gemini-2.5-flash-image",
  OPENAI: "gpt-image-1",
  XAI: "grok-2-vision-1212",
} as const;

export const ENGINE_IDS = ["gemini", "openai", "xai"] as const;
export type EngineId = (typeof ENGINE_IDS)[number];

export const CLI_BINARY_NAME = "ai-image-gen";

/** Patterns checked by prompt injection guard (basic denylist). */
export const PROMPT_GUARD_DENYLIST = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|above|prior)/i,
  /you\s+are\s+now\s+/i,
  /new\s+instructions\s*:/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /<\|end\|>/i,
] as const;
