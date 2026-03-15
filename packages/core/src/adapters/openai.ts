import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ImageEngine } from "../engine.js";
import type { GenerateRequest, GenerateResponse } from "../schemas.js";
import { applyTransparentHint } from "../schemas.js";
import { DEFAULT_MODELS, ENV_KEYS } from "../constants.js";

const DEFAULT_MODEL = DEFAULT_MODELS.OPENAI;

export function createOpenAIEngine(apiKey?: string): ImageEngine {
  const key = apiKey ?? process.env[ENV_KEYS.OPENAI_API_KEY] ?? "";
  const modelId =
    process.env[ENV_KEYS.OPENAI_API_MODEL] ?? DEFAULT_MODEL;

  return {
    engineId: "openai",
    name: "OpenAI",

    async listModels(): Promise<string[]> {
      return [modelId, DEFAULT_MODEL, "gpt-image-1"];
    },

    async generate(request: GenerateRequest): Promise<GenerateResponse> {
      const effectiveModel = request.modelConfig?.engineId === "openai"
        ? request.modelConfig.modelId
        : modelId;
      const effectiveKey = request.modelConfig?.apiKey ?? key;
      if (!effectiveKey) {
        throw new Error("OPENAI_API_KEY is not set");
      }

      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey: effectiveKey });
      const prompt = applyTransparentHint(request.prompt, request.transparentHint ?? false);
      const size = mapAspectToSize(request.aspectRatio ?? "1:1");

      if (request.inputImageBase64) {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "image-ai-"));
        const tmpPath = path.join(tmpDir, "input.png");
        try {
          fs.writeFileSync(tmpPath, Buffer.from(request.inputImageBase64, "base64"));
          const response = await client.images.edit({
            model: effectiveModel,
            prompt,
            image: fs.createReadStream(tmpPath) as unknown as Blob,
            size: "1024x1024",
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
            engineId: "openai",
          };
        } finally {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      }

      const response = await client.images.generate({
        model: effectiveModel,
        prompt,
        n: request.numberOfImages ?? 1,
        size,
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
        engineId: "openai",
      };
    },

    getHelp() {
      return [
        {
          command: "generate",
          description: "Generate image(s) with OpenAI",
          options: "--prompt, --seed, --aspect-ratio, --count",
        },
        {
          command: "list-models",
          description: "List available OpenAI image models",
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
