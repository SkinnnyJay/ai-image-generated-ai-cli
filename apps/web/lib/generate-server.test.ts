import { describe, expect, it } from "vitest";
import {
  buildServerGeneratePlan,
  encodeImagesBase64,
  getServerModelConfig,
} from "./generate-server";

describe("generate-server", () => {
  it("selects default model ids when env overrides are missing", () => {
    const env: Record<string, string | undefined> = {
      GEMINI_API_KEY: "test-gemini",
      OPENAI_API_KEY: "test-openai",
      XAI_API_KEY: "test-xai",
    };

    const gemini = getServerModelConfig("gemini", env);
    expect(gemini.apiKey).toBe("test-gemini");
    expect(gemini.modelConfig.engineId).toBe("gemini");
    expect(gemini.modelConfig.modelId.length).toBeGreaterThan(0);

    const openai = getServerModelConfig("openai", env);
    expect(openai.apiKey).toBe("test-openai");
    expect(openai.modelConfig.engineId).toBe("openai");
    expect(openai.modelConfig.modelId.length).toBeGreaterThan(0);

    const xai = getServerModelConfig("xai", env);
    expect(xai.apiKey).toBe("test-xai");
    expect(xai.modelConfig.engineId).toBe("xai");
    expect(xai.modelConfig.modelId.length).toBeGreaterThan(0);
  });

  it("uses env model id override when set", () => {
    const env: Record<string, string | undefined> = {
      GEMINI_API_KEY: "test-gemini",
      GEMINI_API_MODEL: "gemini-custom-model",
    };
    const cfg = getServerModelConfig("gemini", env);
    expect(cfg.modelConfig.modelId).toBe("gemini-custom-model");
  });

  it("builds a validated request and applies transparent hint", () => {
    const env: Record<string, string | undefined> = {
      GEMINI_API_KEY: "test-gemini",
    };

    const plan = buildServerGeneratePlan(
      {
        engineId: "gemini",
        prompt: "Test asset render",
        transparentHint: true,
        numberOfImages: 1,
      },
      env
    );

    expect(plan.engineId).toBe("gemini");
    expect(plan.apiKey).toBe("test-gemini");
    expect(plan.request.numberOfImages).toBe(1);
    expect(plan.request.prompt.toLowerCase()).toContain("transparent");
  });

  it("encodes images as base64 strings", () => {
    const b64 = encodeImagesBase64([new Uint8Array([0, 1, 2, 3])]);
    expect(b64).toHaveLength(1);
    expect(b64[0]).toBe(Buffer.from([0, 1, 2, 3]).toString("base64"));
  });
});

