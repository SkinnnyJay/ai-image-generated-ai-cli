/**
 * Generic asset presets: styles, angles, and variables for reproducible asset generation.
 * Engine-agnostic; no game-specific or proprietary references.
 */

import { z } from "zod";

export const ASSET_TYPES = ["sprite", "portrait", "icon", "texture", "tile"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const STYLES = [
  "gb-pixel",
  "16bit-pixel",
  "flat-vector",
  "high-res-clean",
  "minimal-silhouette",
  "cel-shaded",
  "soft-painterly",
  "ghibli-style",
  "modern-anime",
] as const;
export type AssetStyle = (typeof STYLES)[number];

export const ANGLES = ["front", "back", "side", "top-down", "isometric"] as const;
export type AssetAngle = (typeof ANGLES)[number];

export const assetPresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  assetType: z.enum(ASSET_TYPES),
  style: z.enum(STYLES),
  angle: z.enum(ANGLES),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  /** Prompt template. Placeholders: {{subject}}, {{width}}, {{height}} */
  promptTemplate: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
});

export type AssetPreset = z.infer<typeof assetPresetSchema>;

export interface PresetVariables {
  subject?: string;
  width?: number;
  height?: number;
}

const PLACEHOLDER_SUBJECT = "{{subject}}";
const PLACEHOLDER_WIDTH = "{{width}}";
const PLACEHOLDER_HEIGHT = "{{height}}";

/**
 * Build a prompt string from a preset and optional variables.
 * Replaces {{subject}}, {{width}}, {{height}} in the template.
 * If subject is missing and template has {{subject}}, uses a neutral fallback.
 */
export function buildPromptFromPreset(
  preset: AssetPreset,
  vars: PresetVariables = {}
): string {
  const width = vars.width ?? preset.width ?? 64;
  const height = vars.height ?? preset.height ?? 64;
  const subject =
    vars.subject?.trim() ?? "creature or character in the chosen style";

  const out = preset.promptTemplate
    .replace(PLACEHOLDER_SUBJECT, subject)
    .replace(PLACEHOLDER_WIDTH, String(width))
    .replace(PLACEHOLDER_HEIGHT, String(height));

  return out.trim();
}

export const assetPresetListSchema = z.array(assetPresetSchema);
export type AssetPresetList = z.infer<typeof assetPresetListSchema>;
