/**
 * Registry for asset-generation tools (e.g. spritesheet variation pipeline).
 * Tools are invoked by the CLI via the run-tool command with a defined I/O contract.
 */

import type { SpritesheetMeta } from "./schemas.js";

export interface AssetToolArgs {
  /** Path to input spritesheet image (PNG). */
  inputImagePath: string;
  /** Path to input meta JSON (frameWidth, frameHeight, frameCount, etc.). */
  inputMetaPath: string;
  /** Optional prompt for generation/variation. */
  prompt?: string;
  /** Path to write the generated image. */
  outputImagePath: string;
  /** Optional path to write updated meta (if layout changes). */
  outputMetaPath?: string;
  /** Optional engine id (gemini, openai, xai). */
  engineId?: string;
}

export interface AssetToolResult {
  outputImagePath: string;
  outputMetaPath?: string;
  /** If the tool updated meta (e.g. frame count), the new meta. */
  meta?: SpritesheetMeta;
}

export interface AssetTool {
  id: string;
  name: string;
  description?: string;
  run(args: AssetToolArgs): Promise<AssetToolResult>;
}

const tools = new Map<string, AssetTool>();

export function registerTool(tool: AssetTool): void {
  tools.set(tool.id, tool);
}

export function getTool(id: string): AssetTool | undefined {
  return tools.get(id);
}

export function listTools(): AssetTool[] {
  return Array.from(tools.values());
}
