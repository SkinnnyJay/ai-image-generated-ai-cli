import type { ImageEngine } from "../engine.js";
import type { GenerateRequest, GenerateResponse } from "../schemas.js";
import { applyTransparentHint } from "../schemas.js";
import { DEFAULT_MODELS, ENV_KEYS } from "../constants.js";

const DEFAULT_MODEL = DEFAULT_MODELS.GEMINI;

export function createGeminiEngine(apiKey?: string): ImageEngine {
  const key = apiKey ?? process.env[ENV_KEYS.GEMINI_API_KEY] ?? "";
  const modelId =
    process.env[ENV_KEYS.GEMINI_API_MODEL] ?? DEFAULT_MODEL;

  return {
    engineId: "gemini",
    name: "Google Gemini",

    async listModels(): Promise<string[]> {
      return [modelId, DEFAULT_MODEL, "gemini-2.5-flash-image", "gemini-3.1-flash-image-preview"];
    },

    async generate(request: GenerateRequest): Promise<GenerateResponse> {
      const effectiveModel = request.modelConfig?.engineId === "gemini"
        ? request.modelConfig.modelId
        : modelId;
      const effectiveKey = request.modelConfig?.apiKey ?? key;
      if (!effectiveKey) {
        throw new Error("GEMINI_API_KEY is not set");
      }

      const prompt = applyTransparentHint(request.prompt, request.transparentHint ?? false);
      const contentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: prompt },
      ];
      if (request.inputImageBase64) {
        contentParts.push({
          inlineData: {
            mimeType: request.inputImageMime ?? "image/png",
            data: request.inputImageBase64,
          },
        });
      }
      if (request.maskBase64) {
        contentParts.push({
          inlineData: {
            mimeType: request.maskMime ?? "image/png",
            data: request.maskBase64,
          },
        });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: effectiveKey });

      const response = await ai.models.generateContent({
        model: effectiveModel,
        contents: contentParts,
        config: { responseModalities: ["TEXT", "IMAGE"] },
      });

      const images: Uint8Array[] = [];
      const candidates = response.candidates ?? [];
      for (const candidate of candidates) {
        const parts = candidate.content?.parts ?? [];
        for (const part of parts) {
          const partObj = part as { inlineData?: { data?: string } };
          if (partObj.inlineData?.data) {
            images.push(Uint8Array.from(Buffer.from(partObj.inlineData.data, "base64")));
          }
        }
      }

      if (images.length === 0) {
        throw new Error("Gemini did not return any images.");
      }

      return {
        images: images as GenerateResponse["images"],
        modelUsed: effectiveModel,
        engineId: "gemini",
      };
    },

    getHelp() {
      return [
        {
          command: "generate",
          description: "Generate image(s) with Gemini",
          options: "--prompt, --seed, --aspect-ratio, --count",
        },
        {
          command: "list-models",
          description: "List available Gemini image models",
        },
      ];
    },
  };
}
