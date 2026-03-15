import fs from "node:fs";
import path from "node:path";
import { buildPromptFromPreset, type EngineId } from "@simpill/image-ai-core";
import { loadPresetsFromFile, getPresetById } from "./load-presets.js";
import { runGenerate } from "./run-generate.js";

const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".webp"];

export interface GenerateBatchOptions {
  inputDir: string;
  outputDir: string;
  prompt?: string;
  presetId?: string;
  presetFile?: string;
  subject?: string;
  metaPath: string;
  engineId: EngineId;
}

function isImageFile(name: string): boolean {
  const ext = path.extname(name).toLowerCase();
  return IMAGE_EXT.includes(ext);
}

export function listImageFiles(dir: string): string[] {
  const resolved = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Input directory not found: ${resolved}`);
  }
  const entries = fs.readdirSync(resolved, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && isImageFile(e.name))
    .map((e) => path.join(resolved, e.name))
    .sort();
  return files;
}

export async function runGenerateBatch(options: GenerateBatchOptions): Promise<string[]> {
  const {
    inputDir,
    outputDir,
    metaPath,
    engineId,
    presetId,
    presetFile,
    subject,
    prompt: promptOption,
  } = options;

  let prompt: string;
  if (presetId != null && presetFile != null) {
    const presets = loadPresetsFromFile(presetFile);
    const preset = getPresetById(presets, presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }
    prompt = buildPromptFromPreset(preset, { subject });
  } else if (typeof promptOption === "string" && promptOption.trim()) {
    prompt = promptOption;
  } else {
    throw new Error("Either --prompt or both --preset and --preset-file are required");
  }

  const metaResolved = path.resolve(process.cwd(), metaPath);
  if (!fs.existsSync(metaResolved)) {
    throw new Error(`Meta file not found: ${metaResolved}`);
  }

  const inputFiles = listImageFiles(inputDir);
  if (inputFiles.length === 0) {
    throw new Error(`No image files found in ${inputDir}`);
  }

  const outResolved = path.resolve(process.cwd(), outputDir);
  fs.mkdirSync(outResolved, { recursive: true });

  const written: string[] = [];
  for (const inputPath of inputFiles) {
    const base = path.basename(inputPath);
    const ext = path.extname(base);
    const outName = ext.toLowerCase() === ".png" ? base : base.replace(ext, ".png");
    const outputPath = path.join(outResolved, outName);
    process.stdout.write(`Generating ${base}... `);
    await runGenerate({
      prompt,
      engineId,
      inputImagePath: inputPath,
      inputMetaPath: metaResolved,
      outputImagePath: outputPath,
      outputMetaPath: undefined,
    });
    written.push(outputPath);
    console.log("ok");
  }
  return written;
}
