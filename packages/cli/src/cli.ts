#!/usr/bin/env node
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local" });

import { CLI_BINARY_NAME, ENGINE_IDS, buildPromptFromPreset, type EngineId } from "@simpill/image-ai-core";
import { COMMAND_SPECS } from "./commands.js";
import { getCLIEngine } from "./engine-singleton.js";
import { runListModels } from "./run-list-models.js";
import { runDiscover } from "./run-discover.js";
import { runGenerate } from "./run-generate.js";
import { runConfig } from "./run-config.js";
import { runRunTool } from "./run-run-tool.js";
import { runListTools } from "./run-list-tools.js";
import { loadPresetsFromFile, getPresetById } from "./load-presets.js";
import { runScaffold } from "./run-scaffold.js";
import { runGenerateBatch } from "./run-generate-batch.js";
import { runReview } from "./run-review.js";

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"] as const;
type AspectRatio = (typeof ASPECT_RATIOS)[number];

function parseArgv(argv: string[]): { command: string; args: string[]; options: Record<string, string | string[] | boolean> } {
  const args = argv.slice(2);
  const options: Record<string, string | string[] | boolean> = {};
  const positionals: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) continue;
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        if (key === "tag") {
          const arr = (options[key] as string[] | undefined) ?? [];
          arr.push(next);
          options[key] = arr;
        } else {
          options[key] = next;
        }
        i++;
      } else {
        options[key] = true;
      }
    } else {
      positionals.push(arg);
    }
  }

  const command = positionals[0] ?? "help";
  const rest = positionals.slice(1);
  return { command, args: rest, options };
}

function isEngineId(s: string): s is EngineId {
  return (ENGINE_IDS as readonly string[]).includes(s);
}

function getEngineFromOptions(options: Record<string, string | string[] | boolean>): EngineId {
  const e = options["engine"];
  if (typeof e === "string" && isEngineId(e)) {
    return e;
  }
  return "gemini";
}

function printHelp(
  commandName?: string,
  opts: Record<string, string | string[] | boolean> = {},
): void {
  if (commandName) {
    const spec = COMMAND_SPECS.find((c) => c.name === commandName);
    if (spec) {
      console.log(`${CLI_BINARY_NAME} ${spec.name}`);
      console.log(spec.description);
      for (const opt of spec.options) {
        console.log(`  ${opt.name}: ${opt.description}`);
      }
      const engine = getCLIEngine(getEngineFromOptions(opts));
      const engineHelp = engine.getHelp?.();
      if (engineHelp?.length) {
        console.log("Engine-specific help:");
        for (const h of engineHelp) {
          console.log(`  ${h.command}: ${h.description}`);
        }
      }
      return;
    }
  }

  console.log(`Usage: ${CLI_BINARY_NAME} <command> [options]`);
  console.log("Commands:");
  for (const c of COMMAND_SPECS) {
    console.log(`  ${c.name}\t${c.description}`);
  }
  console.log(`\nDefault engine: gemini. Use --engine openai | xai to switch.`);
}

async function main(): Promise<void> {
  const { command, args, options } = parseArgv(process.argv);
  const engineId = getEngineFromOptions(options);

  try {
    switch (command) {
      case "list-models": {
        await runListModels(engineId);
        break;
      }
      case "discover": {
        const tags = options["tag"];
        runDiscover({
          tags: Array.isArray(tags) ? tags : typeof tags === "string" ? [tags] : undefined,
          query: typeof options["query"] === "string" ? options["query"] : undefined,
          engineHint: typeof options["engine"] === "string" && isEngineId(options["engine"])
            ? options["engine"]
            : undefined,
        });
        break;
      }
      case "generate": {
        const presetId = typeof options["preset"] === "string" ? options["preset"] : undefined;
        const presetFile = typeof options["preset-file"] === "string" ? options["preset-file"] : undefined;
        const subject = typeof options["subject"] === "string" ? options["subject"] : undefined;

        let prompt: string;
        if (presetId != null) {
          if (!presetFile) {
            console.error("--preset requires --preset-file <path>");
            process.exit(1);
          }
          const presets = loadPresetsFromFile(presetFile);
          const preset = getPresetById(presets, presetId);
          if (!preset) {
            console.error(`Preset not found: ${presetId}. Use list-presets --preset-file ${presetFile} to see ids.`);
            process.exit(1);
          }
          prompt = buildPromptFromPreset(preset, { subject });
        } else {
          const p = options["prompt"];
          if (typeof p !== "string" || !p.trim()) {
            console.error("--prompt is required (or use --preset with --preset-file)");
            process.exit(1);
          }
          prompt = p;
        }

        const inputImage = typeof options["input-image"] === "string" ? options["input-image"] : undefined;
        const inputMeta = typeof options["input-meta"] === "string" ? options["input-meta"] : undefined;
        const outputImage = typeof options["output-image"] === "string" ? options["output-image"] : undefined;
        const outputMeta = typeof options["output-meta"] === "string" ? options["output-meta"] : undefined;
        if ((inputImage != null || inputMeta != null || outputImage != null) && !(inputImage && inputMeta && outputImage)) {
          console.error("Asset mode requires all of: --input-image, --input-meta, --output-image");
          process.exit(1);
        }
        await runGenerate({
          prompt,
          engineId,
          apiKey: undefined,
          seed: typeof options["seed"] === "string" ? parseInt(options["seed"], 10) : undefined,
          aspectRatio:
            typeof options["aspect-ratio"] === "string" &&
            ASPECT_RATIOS.includes(options["aspect-ratio"] as AspectRatio)
              ? (options["aspect-ratio"] as AspectRatio)
              : undefined,
          count: typeof options["count"] === "string" ? parseInt(options["count"], 10) : undefined,
          out: typeof options["out"] === "string" ? options["out"] : undefined,
          inputImagePath: inputImage,
          inputMetaPath: inputMeta,
          outputImagePath: outputImage,
          outputMetaPath: outputMeta,
        });
        break;
      }
      case "list-presets": {
        const presetFile = options["preset-file"];
        if (typeof presetFile !== "string") {
          console.error("list-presets requires --preset-file <path>");
          process.exit(1);
        }
        const presets = loadPresetsFromFile(presetFile);
        console.log(`Presets (${presets.length}):`);
        for (const p of presets) {
          console.log(`  ${p.id}\t${p.name}`);
        }
        break;
      }
      case "scaffold": {
        const scaffoldPath = options["path"];
        if (typeof scaffoldPath !== "string") {
          console.error("scaffold requires --path <target>");
          process.exit(1);
        }
        runScaffold({
          path: scaffoldPath,
          templatesDir: typeof options["templates-dir"] === "string" ? options["templates-dir"] : undefined,
        });
        break;
      }
      case "generate-batch": {
        const inDir = options["input-dir"];
        const outDir = options["output-dir"];
        const meta = options["meta"];
        if (typeof inDir !== "string" || typeof outDir !== "string" || typeof meta !== "string") {
          console.error("generate-batch requires --input-dir, --output-dir, --meta");
          process.exit(1);
        }
        const batchPrompt = typeof options["prompt"] === "string" ? options["prompt"] : undefined;
        const batchPreset = typeof options["preset"] === "string" ? options["preset"] : undefined;
        const batchPresetFile = typeof options["preset-file"] === "string" ? options["preset-file"] : undefined;
        if (!batchPrompt && !(batchPreset && batchPresetFile)) {
          console.error("generate-batch requires --prompt or both --preset and --preset-file");
          process.exit(1);
        }
        await runGenerateBatch({
          inputDir: inDir,
          outputDir: outDir,
          metaPath: meta,
          prompt: batchPrompt,
          presetId: batchPreset,
          presetFile: batchPresetFile,
          subject: typeof options["subject"] === "string" ? options["subject"] : undefined,
          engineId,
        });
        break;
      }
      case "review": {
        const reviewInDir = options["input-dir"];
        const reviewOutDir = options["output-dir"];
        const reviewMeta = options["meta"];
        if (typeof reviewInDir !== "string" || typeof reviewOutDir !== "string" || typeof reviewMeta !== "string") {
          console.error("review requires --input-dir, --output-dir, --meta");
          process.exit(1);
        }
        const reviewPrompt = typeof options["prompt"] === "string" ? options["prompt"] : undefined;
        const reviewPreset = typeof options["preset"] === "string" ? options["preset"] : undefined;
        const reviewPresetFile = typeof options["preset-file"] === "string" ? options["preset-file"] : undefined;
        if (!reviewPrompt && !(reviewPreset && reviewPresetFile)) {
          console.error("review requires --prompt or both --preset and --preset-file");
          process.exit(1);
        }
        await runReview({
          inputDir: reviewInDir,
          outputDir: reviewOutDir,
          metaPath: reviewMeta,
          prompt: reviewPrompt,
          presetId: reviewPreset,
          presetFile: reviewPresetFile,
          subject: typeof options["subject"] === "string" ? options["subject"] : undefined,
          engineId,
          existingOnly: options["existing-only"] === true,
        });
        break;
      }
      case "config": {
        runConfig();
        break;
      }
      case "run-tool": {
        const toolId = options["tool"];
        const inImg = options["input-image"];
        const inMeta = options["input-meta"];
        const outImg = options["output-image"];
        if (typeof toolId !== "string" || typeof inImg !== "string" || typeof inMeta !== "string" || typeof outImg !== "string") {
          console.error("run-tool requires: --tool, --input-image, --input-meta, --output-image");
          process.exit(1);
        }
        await runRunTool({
          toolId,
          inputImagePath: inImg,
          inputMetaPath: inMeta,
          outputImagePath: outImg,
          outputMetaPath: typeof options["output-meta"] === "string" ? options["output-meta"] : undefined,
          prompt: typeof options["prompt"] === "string" ? options["prompt"] : undefined,
          engineId: getEngineFromOptions(options),
        });
        break;
      }
      case "list-tools": {
        runListTools();
        break;
      }
      case "help":
      default: {
        const helpArg = args[0];
        printHelp(command === "help" ? helpArg : undefined, options);
        break;
      }
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
