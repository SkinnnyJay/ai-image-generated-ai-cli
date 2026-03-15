/**
 * Command specs for help introspection. Each engine can extend with getHelp().
 */

export interface CommandSpec {
  name: string;
  description: string;
  options: { name: string; description: string; required?: boolean }[];
}

export const COMMAND_SPECS: CommandSpec[] = [
  {
    name: "list-models",
    description: "List available image models for the current engine",
    options: [
      { name: "--engine", description: "Engine: gemini | openai | xai", required: false },
    ],
  },
  {
    name: "discover",
    description: "Discover prompt templates (optional: --tag, --query, --engine)",
    options: [
      { name: "--tag", description: "Filter by tag (repeatable)", required: false },
      { name: "--query", description: "Search in id/template/label", required: false },
      { name: "--engine", description: "Filter by engine hint", required: false },
    ],
  },
  {
    name: "generate",
    description: "Generate image(s) from a prompt or preset; optional asset mode: --input-image + --input-meta + --output-image",
    options: [
      { name: "--prompt", description: "Text prompt (required unless --preset is used)", required: false },
      { name: "--preset", description: "Preset id from --preset-file (builds prompt from style/angle)", required: false },
      { name: "--preset-file", description: "Path to presets JSON (required when using --preset)", required: false },
      { name: "--subject", description: "Subject for preset template, e.g. 'fire creature' (used with --preset)", required: false },
      { name: "--engine", description: "Engine: gemini | openai | xai", required: false },
      { name: "--seed", description: "Optional seed for reproducibility", required: false },
      { name: "--aspect-ratio", description: "1:1 | 16:9 | 9:16 | 4:3 | 3:4", required: false },
      { name: "--count", description: "Number of images (1-4)", required: false },
      { name: "--out", description: "Output path or directory", required: false },
      { name: "--input-image", description: "Asset mode: path to spritesheet/reference PNG", required: false },
      { name: "--input-meta", description: "Asset mode: path to meta JSON (frameWidth, frameHeight, frameCount)", required: false },
      { name: "--output-image", description: "Asset mode: path to write generated image", required: false },
      { name: "--output-meta", description: "Asset mode: path to write (or copy) meta JSON", required: false },
    ],
  },
  {
    name: "list-presets",
    description: "List presets from a JSON file (--preset-file)",
    options: [
      { name: "--preset-file", description: "Path to presets JSON", required: true },
    ],
  },
  {
    name: "scaffold",
    description: "Create folder structure and template files (presets.json, meta-single.json, README)",
    options: [
      { name: "--path", description: "Target path (e.g. ./data/games/my-game)", required: true },
      { name: "--templates-dir", description: "Optional: dir with template files (default: data/templates)", required: false },
    ],
  },
  {
    name: "generate-batch",
    description: "Generate from a folder of images (same prompt/meta for each); output one file per input",
    options: [
      { name: "--input-dir", description: "Folder containing reference images", required: true },
      { name: "--output-dir", description: "Folder to write generated images", required: true },
      { name: "--meta", description: "Path to meta JSON (frameWidth, frameHeight, frameCount)", required: true },
      { name: "--prompt", description: "Prompt (required unless --preset used)", required: false },
      { name: "--preset", description: "Preset id (use with --preset-file)", required: false },
      { name: "--preset-file", description: "Path to presets JSON", required: false },
      { name: "--subject", description: "Subject for preset", required: false },
      { name: "--engine", description: "Engine: gemini | openai | xai", required: false },
    ],
  },
  {
    name: "review",
    description: "Generate then interactively accept/deny/regenerate each image (a/d/r); denied moved to output-dir/rejected",
    options: [
      { name: "--input-dir", description: "Folder containing reference images", required: true },
      { name: "--output-dir", description: "Folder to write generated images", required: true },
      { name: "--meta", description: "Path to meta JSON", required: true },
      { name: "--prompt", description: "Prompt (required unless --preset used)", required: false },
      { name: "--preset", description: "Preset id (use with --preset-file)", required: false },
      { name: "--preset-file", description: "Path to presets JSON", required: false },
      { name: "--subject", description: "Subject for preset", required: false },
      { name: "--existing-only", description: "Only review existing output files (no generation)", required: false },
      { name: "--engine", description: "Engine: gemini | openai | xai", required: false },
    ],
  },
  {
    name: "run-tool",
    description: "Run a registered asset tool (e.g. spritesheet variation)",
    options: [
      { name: "--tool", description: "Tool id (from list-tools)", required: true },
      { name: "--input-image", description: "Path to input spritesheet PNG", required: true },
      { name: "--input-meta", description: "Path to input meta JSON", required: true },
      { name: "--output-image", description: "Path to write output image", required: true },
      { name: "--output-meta", description: "Path to write output meta (optional)", required: false },
      { name: "--prompt", description: "Optional prompt for the tool", required: false },
      { name: "--engine", description: "Engine: gemini | openai | xai", required: false },
    ],
  },
  {
    name: "list-tools",
    description: "List registered asset tools (extensions)",
    options: [],
  },
  {
    name: "config",
    description: "Validate and show config (env + optional config file)",
    options: [],
  },
  {
    name: "help",
    description: "Show help for a command or list all commands",
    options: [{ name: "command", description: "Command name", required: false }],
  },
];
