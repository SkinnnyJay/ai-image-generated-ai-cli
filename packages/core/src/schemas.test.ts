import { describe, it, expect } from "vitest";
import {
  promptEntrySchema,
  generateRequestSchema,
  modelConfigSchema,
} from "./schemas.js";

describe("promptEntrySchema", () => {
  it("accepts valid entry", () => {
    const result = promptEntrySchema.safeParse({
      id: "test",
      template: "a prompt",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it("rejects empty id", () => {
    const result = promptEntrySchema.safeParse({
      id: "",
      template: "a prompt",
    });
    expect(result.success).toBe(false);
  });

  it("accepts tags and modelHint", () => {
    const result = promptEntrySchema.safeParse({
      id: "x",
      template: "t",
      tags: ["a", "b"],
      modelHint: "gemini",
    });
    expect(result.success).toBe(true);
  });
});

describe("generateRequestSchema", () => {
  it("accepts minimal request", () => {
    const result = generateRequestSchema.safeParse({ prompt: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aspectRatio).toBe("1:1");
      expect(result.data.numberOfImages).toBe(1);
    }
  });

  it("rejects empty prompt", () => {
    const result = generateRequestSchema.safeParse({ prompt: "" });
    expect(result.success).toBe(false);
  });

  it("accepts valid aspect ratios", () => {
    for (const ratio of ["1:1", "16:9", "9:16", "4:3", "3:4"]) {
      const result = generateRequestSchema.safeParse({
        prompt: "x",
        aspectRatio: ratio,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("modelConfigSchema", () => {
  it("accepts valid config", () => {
    const result = modelConfigSchema.safeParse({
      engineId: "openai",
      modelId: "gpt-image-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid engineId", () => {
    const result = modelConfigSchema.safeParse({
      engineId: "other",
      modelId: "x",
    });
    expect(result.success).toBe(false);
  });
});
