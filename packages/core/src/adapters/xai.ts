import type { ImageEngine } from "../engine.js";
import type { GenerateRequest, GenerateResponse } from "../schemas.js";
import { DEFAULT_MODELS, ENV_KEYS } from "../constants.js";

const DEFAULT_MODEL = DEFAULT_MODELS.XAI;
const XAI_BASE_URL = "https://api.x.ai/v1";

/**
 * xAI image API is OpenAI-compatible; we use the OpenAI client with baseURL.
 */
export function createXAIEngine(apiKey?: string): ImageEngine {
  const key = apiKey ?? process.env[ENV_KEYS.XAI_API_KEY] ?? "";
  const modelId =
    process.env[ENV_KEYS.XAI_API_MODEL] ?? DEFAULT_MODEL;

  return {
    engineId: "xai",
    name: "xAI (Grok)",

    async listModels(): Promise<string[]> {
      return [modelId, DEFAULT_MODEL, "grok-2-vision-1212"];
    },

    async generate(request: GenerateRequest): Promise<GenerateResponse> {
      const effectiveModel = request.modelConfig?.engineId === "xai"
        ? request.modelConfig.modelId
        : modelId;
      const effectiveKey = request.modelConfig?.apiKey ?? key;
      if (!effectiveKey) {
        throw new Error("XAI_API_KEY is not set");
      }

      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({
        apiKey: effectiveKey,
        baseURL: XAI_BASE_URL,
      });

      const response = await client.images.generate({
        model: effectiveModel,
        prompt: request.prompt,
        n: request.numberOfImages ?? 1,
        size: mapAspectToSize(request.aspectRatio ?? "1:1"),
        response_format: "b64_json",
      });

      const images: Uint8Array[] = [];
      for (const obj of response.data ?? []) {
        const b64 = "b64_json" in obj ? obj.b64_json : undefined;
        if (b64) {
          images.push(Uint8Array.from(Buffer.from(b64, "base64")));
        }
      }

      return {
        images: images as GenerateResponse["images"],
        modelUsed: effectiveModel,
        engineId: "xai",
      };
    },

    getHelp() {
      return [
        {
          command: "generate",
          description: "Generate image(s) with xAI",
          options: "--prompt, --seed, --aspect-ratio, --count",
        },
        {
          command: "list-models",
          description: "List available xAI image models",
        },
      ];
    },
  };
}

function mapAspectToSize(
  ratio: string
): "1024x1024" | "1792x1024" | "1024x1792" {
  switch (ratio) {
    case "16:9":
      return "1792x1024";
    case "9:16":
      return "1024x1792";
    default:
      return "1024x1024";
  }
}
