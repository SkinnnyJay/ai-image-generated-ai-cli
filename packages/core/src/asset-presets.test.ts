import { describe, it, expect } from "vitest";
import {
  assetPresetSchema,
  buildPromptFromPreset,
  type AssetPreset,
} from "./asset-presets.js";

describe("assetPresetSchema", () => {
  it("accepts valid preset", () => {
    const preset = {
      id: "front-01",
      name: "Front sprite",
      assetType: "sprite",
      style: "gb-pixel",
      angle: "front",
      width: 56,
      height: 56,
      promptTemplate: "Front {{subject}}, {{width}}x{{height}}",
    };
    const result = assetPresetSchema.safeParse(preset);
    expect(result.success).toBe(true);
  });

  it("rejects invalid assetType", () => {
    const result = assetPresetSchema.safeParse({
      id: "x",
      name: "x",
      assetType: "invalid",
      style: "gb-pixel",
      angle: "front",
      promptTemplate: "x",
    });
    expect(result.success).toBe(false);
  });
});

describe("buildPromptFromPreset", () => {
  const preset: AssetPreset = {
    id: "test",
    name: "Test",
    assetType: "sprite",
    style: "gb-pixel",
    angle: "front",
    width: 56,
    height: 56,
    promptTemplate: "Front {{subject}}, {{width}}x{{height}} pixels, transparent background",
  };

  it("replaces subject, width, height", () => {
    const out = buildPromptFromPreset(preset, {
      subject: "fire lizard",
      width: 64,
      height: 64,
    });
    expect(out).toContain("fire lizard");
    expect(out).toContain("64x64");
    expect(out).toContain("transparent background");
  });

  it("uses preset dimensions when vars omitted", () => {
    const out = buildPromptFromPreset(preset, { subject: "creature" });
    expect(out).toContain("56x56");
    expect(out).toContain("creature");
  });

  it("uses fallback subject when subject omitted", () => {
    const out = buildPromptFromPreset(preset, {});
    expect(out).toContain("creature or character in the chosen style");
  });
});
