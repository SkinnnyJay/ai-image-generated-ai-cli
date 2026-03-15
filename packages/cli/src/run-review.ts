import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { buildPromptFromPreset, type EngineId } from "@simpill/image-ai-core";
import { loadPresetsFromFile, getPresetById } from "./load-presets.js";
import { runGenerate } from "./run-generate.js";
import { listImageFiles } from "./run-generate-batch.js";

function openImage(filePath: string): void {
  try {
    const platform = process.platform;
    const cmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
    spawn(cmd, [filePath], { stdio: "ignore", detached: true }).unref();
  } catch {
    console.warn("Could not open image viewer; check the file at:", filePath);
  }
}

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

export interface ReviewOptions {
  inputDir: string;
  outputDir: string;
  metaPath: string;
  prompt?: string;
  presetId?: string;
  presetFile?: string;
  subject?: string;
  engineId: EngineId;
  /** If true, only review existing output files (no generation). */
  existingOnly?: boolean;
}

export async function runReview(options: ReviewOptions): Promise<void> {
  const {
    inputDir,
    outputDir,
    metaPath,
    engineId,
    prompt: promptOption,
    presetId,
    presetFile,
    subject,
    existingOnly = false,
  } = options;

  const metaResolved = path.resolve(process.cwd(), metaPath);
  if (!fs.existsSync(metaResolved)) {
    throw new Error(`Meta file not found: ${metaResolved}`);
  }

  const outResolved = path.resolve(process.cwd(), outputDir);
  const rejectedDir = path.join(outResolved, "rejected");
  fs.mkdirSync(outResolved, { recursive: true });
  fs.mkdirSync(rejectedDir, { recursive: true });

  const getPrompt = (): string => {
    if (presetId != null && presetFile != null) {
      const presets = loadPresetsFromFile(presetFile);
      const preset = getPresetById(presets, presetId);
      if (!preset) throw new Error(`Preset not found: ${presetId}`);
      return buildPromptFromPreset(preset, { subject });
    }
    if (typeof promptOption === "string" && promptOption.trim()) return promptOption;
    throw new Error("Either --prompt or --preset with --preset-file required");
  };

  const inputFiles = existingOnly ? [] : listImageFiles(inputDir);
  if (inputFiles.length === 0 && !existingOnly) {
    throw new Error(`No image files in ${inputDir}`);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const existingOut = listImageFiles(outputDir).filter((p) => !path.basename(p).includes("rejected"));
  const filesToReview = existingOnly
    ? existingOut
    : inputFiles.map((p) => path.join(outResolved, path.basename(p).replace(/\.[^.]+$/i, ".png")));

  const inputByOutput = new Map<string, string>();
  for (const inp of inputFiles) {
    const base = path.basename(inp);
    const outName = path.extname(base).toLowerCase() === ".png" ? base : base.replace(path.extname(base), ".png");
    inputByOutput.set(path.join(outResolved, outName), inp);
  }

  type Item = { outputPath: string; inputPath: string | undefined };
  const items: Item[] = existingOnly
    ? filesToReview.map((outPath) => ({ outputPath: outPath, inputPath: inputByOutput.get(outPath) }))
    : inputFiles.map((inp) => ({
        outputPath: path.join(outResolved, path.basename(inp).replace(/\.[^.]+$/i, ".png")),
        inputPath: inp,
      }));

  for (const { outputPath, inputPath } of items) {
    const baseName = path.basename(outputPath);

    if (!existingOnly && inputPath) {
      process.stdout.write(`Generating ${path.basename(inputPath)}... `);
      await runGenerate({
        prompt: getPrompt(),
        engineId,
        inputImagePath: inputPath,
        inputMetaPath: metaResolved,
        outputImagePath: outputPath,
      });
      console.log("ok");
    }

    if (!fs.existsSync(outputPath)) {
      console.log(`Skip (no file): ${baseName}`);
      continue;
    }

    let resolved = false;
    while (!resolved) {
      openImage(outputPath);
      const action = await ask(rl, `[${baseName}] Accept (a) / Deny (d) / Regenerate with new prompt (r): `).then((s) => s.toLowerCase().slice(0, 1));
      if (action === "a") {
        console.log("Accepted:", outputPath);
        resolved = true;
      } else if (action === "d") {
        const dest = path.join(rejectedDir, baseName);
        fs.renameSync(outputPath, dest);
        console.log("Rejected, moved to:", dest);
        resolved = true;
      } else if (action === "r") {
        const inp = inputPath ?? inputByOutput.get(outputPath);
        if (!inp) {
          console.log("Cannot regenerate: no input file for this output (use without --existing-only to enable regenerate).");
          continue;
        }
        const newPrompt = await ask(rl, "New prompt (or Enter to keep current): ");
        const promptToUse = newPrompt || getPrompt();
        process.stdout.write("Regenerating... ");
        await runGenerate({
          prompt: promptToUse,
          engineId,
          inputImagePath: inp,
          inputMetaPath: metaResolved,
          outputImagePath: outputPath,
        });
        console.log("ok");
      } else {
        console.log("Unknown. Use a, d, or r.");
      }
    }
  }

  rl.close();
  console.log("Review done.");
}
