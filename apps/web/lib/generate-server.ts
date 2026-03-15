import {
  DEFAULT_MODELS,
  ENV_KEYS,
  applyTransparentHint,
  checkPromptGuard,
  generateRequestSchema,
  type EngineId,
  type GenerateRequest,
  type ModelConfig,
} from "@simpill/image-ai-core";
import { z } from "zod";

const ENGINE_ID_SCHEMA = z.enum(["gemini", "openai", "xai"]);

export const generateApiRequestSchema = z.object({
  engineId: ENGINE_ID_SCHEMA,
  prompt: z.string().min(1).max(32_000),
  seed: z.number().int().nonnegative().optional(),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional(),
  outputFormat: z.enum(["png", "jpeg", "webp"]).optional(),
  numberOfImages: z.number().int().min(1).max(4).optional(),
  transparentHint: z.boolean().optional(),
  inputImageBase64: z.string().optional(),
  inputImageMime: z.string().optional(),
});

export type GenerateApiRequest = z.infer<typeof generateApiRequestSchema>;

export type GenerateApiResponse = {
  engineId: EngineId;
  modelUsed: string;
  outputFormat: "png" | "jpeg" | "webp";
  imagesBase64: string[];
};

type EnvKey = (typeof ENV_KEYS)[keyof typeof ENV_KEYS];

const ENGINE_API_KEY_ENV: Record<EngineId, EnvKey> = {
  gemini: ENV_KEYS.GEMINI_API_KEY,
  openai: ENV_KEYS.OPENAI_API_KEY,
  xai: ENV_KEYS.XAI_API_KEY,
};

const ENGINE_MODEL_ENV: Record<EngineId, EnvKey> = {
  gemini: ENV_KEYS.GEMINI_API_MODEL,
  openai: ENV_KEYS.OPENAI_API_MODEL,
  xai: ENV_KEYS.XAI_API_MODEL,
};

const ENGINE_DEFAULT_MODEL: Record<EngineId, string> = {
  gemini: DEFAULT_MODELS.GEMINI,
  openai: DEFAULT_MODELS.OPENAI,
  xai: DEFAULT_MODELS.XAI,
};

export type ServerGeneratePlan = {
  engineId: EngineId;
  apiKey: string;
  request: GenerateRequest;
};

export function getServerModelConfig(
  engineId: EngineId,
  env: Record<string, string | undefined>
): { apiKey: string; modelConfig: ModelConfig } {
  const apiKeyEnvKey = ENGINE_API_KEY_ENV[engineId];
  const modelEnvKey = ENGINE_MODEL_ENV[engineId];

  const apiKey = env[apiKeyEnvKey];
  if (apiKey == null || apiKey.trim() === "") {
    throw new Error(`Missing ${apiKeyEnvKey} for engine ${engineId}`);
  }

  const modelFromEnv = env[modelEnvKey];
  const modelId =
    modelFromEnv != null && modelFromEnv.trim() !== ""
      ? modelFromEnv.trim()
      : ENGINE_DEFAULT_MODEL[engineId];

  return {
    apiKey,
    modelConfig: {
      engineId,
      modelId,
    },
  };
}

export function buildServerGeneratePlan(
  input: GenerateApiRequest,
  env: Record<string, string | undefined>
): ServerGeneratePlan {
  const guard = checkPromptGuard(input.prompt);
  if (!guard.ok) {
    throw new Error(guard.reason ?? "Prompt rejected by guard");
  }

  const { apiKey, modelConfig } = getServerModelConfig(input.engineId, env);
  const prompt = applyTransparentHint(input.prompt, input.transparentHint ?? false);

  const parsed = generateRequestSchema.parse({
    prompt,
    seed: input.seed,
    aspectRatio: input.aspectRatio,
    outputFormat: input.outputFormat,
    numberOfImages: input.numberOfImages,
    transparentHint: input.transparentHint,
    inputImageBase64: input.inputImageBase64,
    inputImageMime: input.inputImageMime,
    modelConfig,
  });

  return {
    engineId: input.engineId,
    apiKey,
    request: parsed,
  };
}

export function encodeImagesBase64(images: Uint8Array[]): string[] {
  const out: string[] = [];
  for (const img of images) {
    out.push(Buffer.from(img).toString("base64"));
  }
  return out;
}

