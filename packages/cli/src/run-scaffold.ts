import fs from "node:fs";
import path from "node:path";

const META_TEMPLATE = `{
  "frameWidth": 56,
  "frameHeight": 56,
  "frameCount": 1
}
`;

const PRESETS_TEMPLATE = `[
  {
    "id": "front-default",
    "name": "Front view, default style",
    "description": "Front-facing character in default style",
    "assetType": "sprite",
    "style": "soft-painterly",
    "angle": "front",
    "width": 512,
    "height": 512,
    "promptTemplate": "Front-facing character, {{subject}}, soft painterly style, transparent background, high quality illustration.",
    "tags": ["sprite", "front"]
  },
  {
    "id": "back-default",
    "name": "Back view, default style",
    "description": "Back-facing character in default style",
    "assetType": "sprite",
    "style": "soft-painterly",
    "angle": "back",
    "width": 512,
    "height": 512,
    "promptTemplate": "Back view character, {{subject}}, soft painterly style, transparent background, high quality illustration.",
    "tags": ["sprite", "back"]
  }
]
`;

const README_TEMPLATE = `# Asset folder

- Put reference images in \`front/\` and/or \`back/\` (e.g. PNG).
- Use \`meta-single.json\` for single-frame reference (frameWidth x frameHeight, frameCount: 1).
- Use \`presets.json\` for style/angle presets; list with: \`ai-image-gen list-presets --preset-file presets.json\`.

Generate one image:
  ai-image-gen generate --prompt "..." --input-image front/1.png --input-meta meta-single.json --output-image out/1.png

Batch (folder):
  ai-image-gen generate-batch --input-dir front --output-dir out --meta meta-single.json --prompt "..."

Interactive review:
  ai-image-gen review --input-dir front --output-dir out --meta meta-single.json --prompt "..."
`;

export interface ScaffoldOptions {
  /** Target path to create folder structure (e.g. ./data/games/my-game). */
  path: string;
  /** Optional: directory containing meta-single.template.json, presets.template.json, README.template.md. If not set, built-in templates are used. */
  templatesDir?: string;
}

function readTemplate(templatesDir: string, name: string, fallback: string): string {
  const full = path.join(templatesDir, name);
  try {
    return fs.readFileSync(full, "utf-8");
  } catch {
    return fallback;
  }
}

export function runScaffold(options: ScaffoldOptions): void {
  const targetDir = path.resolve(process.cwd(), options.path);
  const templatesDir = options.templatesDir
    ? path.resolve(process.cwd(), options.templatesDir)
    : path.resolve(process.cwd(), "data", "templates");

  if (fs.existsSync(targetDir)) {
    const stat = fs.statSync(targetDir);
    if (!stat.isDirectory()) {
      throw new Error(`Path exists and is not a directory: ${targetDir}`);
    }
  } else {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const frontDir = path.join(targetDir, "front");
  const backDir = path.join(targetDir, "back");
  fs.mkdirSync(frontDir, { recursive: true });
  fs.mkdirSync(backDir, { recursive: true });

  const metaPath = path.join(targetDir, "meta-single.json");
  const presetsPath = path.join(targetDir, "presets.json");
  const readmePath = path.join(targetDir, "README.md");

  const meta = readTemplate(templatesDir, "meta-single.template.json", META_TEMPLATE);
  const presets = readTemplate(templatesDir, "presets.template.json", PRESETS_TEMPLATE);
  const readme = readTemplate(templatesDir, "README.template.md", README_TEMPLATE);

  fs.writeFileSync(metaPath, meta, "utf-8");
  fs.writeFileSync(presetsPath, presets, "utf-8");
  fs.writeFileSync(readmePath, readme, "utf-8");

  console.log("Scaffolded:", targetDir);
  console.log("  front/");
  console.log("  back/");
  console.log("  meta-single.json");
  console.log("  presets.json");
  console.log("  README.md");
}
