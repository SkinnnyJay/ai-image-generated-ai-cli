import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { promptEntrySchema, type PromptEntry } from "@simpill/image-ai-core";

const promptBankSchema = z.array(promptEntrySchema);

const levelEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  assetIds: z.array(z.string()).optional().default([]),
});

const assetTypeSchema = z.enum(["sprite", "texture", "model", "audio", "other"]);
const assetEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: assetTypeSchema,
  tags: z.array(z.string()).optional().default([]),
});

export type LevelEntry = z.infer<typeof levelEntrySchema>;
export type AssetEntry = z.infer<typeof assetEntrySchema>;

const DATA_ROOT = join(process.cwd(), "data");

async function readJsonFile(fileName: string): Promise<unknown> {
  const fullPath = join(DATA_ROOT, fileName);
  const raw = await readFile(fullPath, "utf-8");
  const parsed: unknown = JSON.parse(raw);
  return parsed;
}

export async function loadPromptBank(): Promise<PromptEntry[]> {
  const data = await readJsonFile("prompt-bank.json");
  return promptBankSchema.parse(data);
}

export async function loadLevels(): Promise<LevelEntry[]> {
  const data = await readJsonFile("levels.json");
  return z.array(levelEntrySchema).parse(data);
}

export async function loadAssets(): Promise<AssetEntry[]> {
  const data = await readJsonFile("assets.json");
  return z.array(assetEntrySchema).parse(data);
}
