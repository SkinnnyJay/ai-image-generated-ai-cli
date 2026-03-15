import fs from "node:fs";
import path from "node:path";
import {
  checkPromptGuard,
  generateRequestSchema,
  spritesheetMetaSchema,
  type EngineId,
} from "@simpill/image-ai-core";
import { getCLIEngine } from "./engine-singleton.js";

export interface GenerateOptions {
  prompt: string;
  engineId: EngineId;
  apiKey?: string;
  seed?: number;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  count?: number;
  out?: string;
  /** Spritesheet/asset pipeline: input image path (reference image). */
  inputImagePath?: string;
  /** Spritesheet/asset pipeline: input meta JSON path (frameWidth, frameHeight, frameCount). */
  inputMetaPath?: string;
  /** Spritesheet/asset pipeline: output image path (exact file). */
  outputImagePath?: string;
  /** Spritesheet/asset pipeline: output meta JSON path (copy or write updated). */
  outputMetaPath?: string;
}

export async function runGenerate(options: GenerateOptions): Promise<void> {
  const guard = checkPromptGuard(options.prompt);
  if (!guard.ok) {
    throw new Error(guard.reason ?? "Prompt rejected by guard");
  }

  let inputImageBase64: string | undefined;
  let inputImageMime: string | undefined;
  let metaForOutput: unknown = undefined;

  if (options.inputImagePath != null && options.inputMetaPath != null) {
    const imageBuf = fs.readFileSync(options.inputImagePath);
    inputImageBase64 = imageBuf.toString("base64");
    inputImageMime = "image/png";
    const metaRaw = JSON.parse(fs.readFileSync(options.inputMetaPath, "utf8"));
    const metaParsed = spritesheetMetaSchema.safeParse(metaRaw);
    if (!metaParsed.success) {
      throw new Error(`Invalid input meta: ${metaParsed.error.message}`);
    }
    metaForOutput = metaParsed.data;
  }

  const parsed = generateRequestSchema.safeParse({
    prompt: options.prompt,
    seed: options.seed,
    aspectRatio: options.aspectRatio ?? "1:1",
    numberOfImages: options.count ?? 1,
    inputImageBase64,
    inputImageMime,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const engine = getCLIEngine(options.engineId, options.apiKey);
  const response = await engine.generate(parsed.data);

  const useAssetOutput =
    options.outputImagePath != null &&
    options.inputImagePath != null &&
    options.inputMetaPath != null;

  if (useAssetOutput && options.outputImagePath != null) {
    const outDir = path.dirname(options.outputImagePath);
    fs.mkdirSync(outDir, { recursive: true });
    const first = response.images[0];
    if (first == null) {
      throw new Error("No image generated");
    }
    fs.writeFileSync(options.outputImagePath, first);
    console.log("Wrote", options.outputImagePath);
    if (options.outputMetaPath != null && metaForOutput != null) {
      fs.mkdirSync(path.dirname(options.outputMetaPath), { recursive: true });
      fs.writeFileSync(
        options.outputMetaPath,
        JSON.stringify(metaForOutput, null, 2),
        "utf8",
      );
      console.log("Wrote", options.outputMetaPath);
    }
    return;
  }

  // Single image to file path vs N images to directory with timestamped names.
  const outPath = options.out ?? process.cwd();
  const ext = path.extname(outPath);
  const singleToFile = ext.length > 0 && response.images.length === 1;
  const dir = ext.length > 0 ? path.dirname(outPath) : outPath;
  const oneFileName = singleToFile ? path.basename(outPath) : null;

  fs.mkdirSync(dir, { recursive: true });

  const timestamp = Date.now();
  for (let i = 0; i < response.images.length; i++) {
    const buf = response.images[i];
    if (buf === undefined) continue;
    const name = oneFileName ?? `generated-${timestamp}-${i}.png`;
    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, buf);
    console.log("Wrote", filePath);
  }
}
