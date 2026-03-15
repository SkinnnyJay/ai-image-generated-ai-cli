import type { EngineId } from "@simpill/image-ai-core";
import { getTool } from "@simpill/image-ai-core";
import { runGenerate } from "./run-generate.js";

export interface RunToolOptions {
  toolId: string;
  inputImagePath: string;
  inputMetaPath: string;
  outputImagePath: string;
  outputMetaPath?: string;
  prompt?: string;
  engineId?: EngineId;
}

/**
 * Run a registered asset tool. Built-in "spritesheet" tool uses the generate
 * pipeline with reference image + meta; other tools are from registerTool().
 */
export async function runRunTool(options: RunToolOptions): Promise<void> {
  const tool = getTool(options.toolId);
  if (tool) {
    const result = await tool.run({
      inputImagePath: options.inputImagePath,
      inputMetaPath: options.inputMetaPath,
      outputImagePath: options.outputImagePath,
      outputMetaPath: options.outputMetaPath,
      prompt: options.prompt,
      engineId: options.engineId,
    });
    console.log("Output:", result.outputImagePath, result.outputMetaPath ?? "");
    return;
  }

  if (options.toolId === "spritesheet") {
    if (!options.prompt) {
      throw new Error("Built-in spritesheet tool requires --prompt");
    }
    await runGenerate({
      prompt: options.prompt,
      engineId: options.engineId ?? "gemini",
      inputImagePath: options.inputImagePath,
      inputMetaPath: options.inputMetaPath,
      outputImagePath: options.outputImagePath,
      outputMetaPath: options.outputMetaPath,
    });
    return;
  }

  throw new Error(`Unknown tool: ${options.toolId}. Use list-tools to see registered tools.`);
}
