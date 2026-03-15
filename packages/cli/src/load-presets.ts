import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assetPresetListSchema, type AssetPreset } from "@simpill/image-ai-core";

/**
 * Load and parse an asset presets JSON file.
 * Path is resolved relative to cwd if not absolute.
 */
export function loadPresetsFromFile(filePath: string): AssetPreset[] {
  const absolute = resolve(process.cwd(), filePath);
  let raw: string;
  try {
    raw = readFileSync(absolute, "utf-8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Cannot read preset file ${filePath}: ${msg}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON in ${filePath}: ${msg}`);
  }
  return assetPresetListSchema.parse(parsed);
}

export function getPresetById(presets: AssetPreset[], id: string): AssetPreset | undefined {
  return presets.find((p) => p.id === id);
}
