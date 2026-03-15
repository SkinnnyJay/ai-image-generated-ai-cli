import { z } from "zod";

export const promptEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  template: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  modelHint: z.enum(["gemini", "openai", "xai"]).optional(),
});

export type PromptEntry = z.infer<typeof promptEntrySchema>;
export type PromptEntryInput = z.input<typeof promptEntrySchema>;

export const modelConfigSchema = z.object({
  engineId: z.enum(["gemini", "openai", "xai"]),
  modelId: z.string().min(1),
  apiKey: z.string().min(1).optional(),
});

export type ModelConfig = z.infer<typeof modelConfigSchema>;

const TRANSPARENT_HINT = " Transparent background, no background.";

export const generateRequestSchema = z.object({
  prompt: z.string().min(1).max(32_000),
  modelConfig: modelConfigSchema.optional(),
  seed: z.number().int().nonnegative().optional(),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional().default("1:1"),
  outputFormat: z.enum(["png", "jpeg", "webp"]).optional().default("png"),
  numberOfImages: z.number().int().min(1).max(4).optional().default(1),
  transparentHint: z.boolean().optional().default(false),
  inputImageBase64: z.string().optional(),
  inputImageMime: z.string().optional(),
  maskBase64: z.string().optional(),
  maskMime: z.string().optional(),
});

export function applyTransparentHint(prompt: string, enabled: boolean): string {
  if (!enabled || prompt.toLowerCase().includes("transparent")) return prompt;
  return prompt + TRANSPARENT_HINT;
}

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export const generateResponseSchema = z.object({
  images: z.array(z.instanceof(Uint8Array)),
  modelUsed: z.string(),
  engineId: z.enum(["gemini", "openai", "xai"]),
});

export type GenerateResponse = z.infer<typeof generateResponseSchema>;

export const configFileSchema = z.object({
  defaultEngine: z.enum(["gemini", "openai", "xai"]).optional(),
  models: z.record(z.enum(["gemini", "openai", "xai"]), modelConfigSchema).optional(),
});

export type ConfigFile = z.infer<typeof configFileSchema>;

/**
 * Spritesheet meta for asset pipelines (reference image + frame layout).
 * Describes frame layout so output can preserve or replicate it.
 */
export const spritesheetMetaSchema = z.object({
  frameWidth: z.number().int().positive(),
  frameHeight: z.number().int().positive(),
  frameCount: z.number().int().positive(),
  sourceFile: z.string().optional(),
  gridColumns: z.number().int().positive().optional(),
  gridRows: z.number().int().positive().optional(),
  paletteId: z.string().optional(),
});

export type SpritesheetMeta = z.infer<typeof spritesheetMetaSchema>;
