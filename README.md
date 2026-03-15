# ai-image-generated-ai-cli

CLI and SDK for AI image generation, part of the **simpill** toolkit. Use it to generate images from text prompts or to run spritesheet-style workflows (reference image + meta) with swappable engines (Gemini, OpenAI, xAI). Strict TypeScript, Zod validation, and a basic prompt-injection guard.

---

## Quick start

```bash
# From this repo
npm install
npm run build

# Run the CLI (binary: ai-image-gen)
npm run cli -- help
npm run cli -- generate --prompt "a cat" --engine gemini --out ./out
```

Set API keys before calling any engine: copy `.env.sample` to `.env` or `.env.local` and set `GEMINI_API_KEY`, `OPENAI_API_KEY`, and/or `XAI_API_KEY` as needed.

---

## Repo layout (simpill)

| Package      | Name                     | Purpose |
|-------------|--------------------------|--------|
| **packages/core** | `@simpill/image-ai-core` | Engine interface, Zod schemas, prompt registry, guard, adapters (Gemini, OpenAI, xAI). |
| **packages/cli**  | `@simpill/image-ai-cli`  | CLI binary `ai-image-gen`: `list-models`, `discover`, `generate`, `config`, `list-tools`, `run-tool`, `help`. |
| **apps/web**      | `@simpill/image-ai-web`  | Optional Next.js app for prompt discovery (search, tags). |

This repo is **about the CLI and its core**: how to install it, run it, and use it. The web app is optional.

---

## CLI usage

**Binary:** `ai-image-gen`. After `npm run build` (or `npm run build -w @simpill/image-ai-cli`):

```bash
# Help and config
npm run cli -- help
npm run cli -- config
npm run cli -- list-models --engine gemini

# Prompt discovery (registered prompts)
npm run cli -- discover --tag game --query sprite

# Generate images
npm run cli -- generate --prompt "a cat" --engine gemini --out ./out
npm run cli -- generate --prompt "portrait" --count 2 --out ./outputs

# Direct run (from repo root, after build)
node packages/cli/dist/cli.js generate --prompt "isometric sprite" --engine gemini
```

**Generate output behavior:**

- No `--out`: files in current directory as `generated-{timestamp}-{i}.png`.
- `--out <dir>` (directory, no extension): files in that dir as `generated-{timestamp}-{i}.png`.
- `--out <file>` (e.g. `./out.png`) with one image: write to that file.
- `--out <file>` with `--count 2` or more: write into the same directory as the file, names `generated-{timestamp}-{i}.png`.

---

## Asset presets (generic styles and angles)

Use predefined high-quality styles and angles instead of raw prompts. Presets are JSON files with `id`, `name`, `assetType`, `style`, `angle`, and a `promptTemplate` with placeholders `{{subject}}`, `{{width}}`, `{{height}}`.

```bash
# List presets from a file
npm run cli -- list-presets --preset-file ./data/games/pokemon/red-blue/presets.json

# Generate using a preset and optional subject
npm run cli -- generate --preset-file ./data/games/pokemon/red-blue/presets.json \
  --preset front-gb-pixel --subject "fire creature" --out ./out

# Generate all 10 presets (script)
SUBJECT="small creature" OUT_DIR=./.temp/preset-out ./scripts/generate-presets.sh
```

**Preset styles:** `gb-pixel`, `16bit-pixel`, `flat-vector`, `high-res-clean`, `minimal-silhouette`, `cel-shaded`, `soft-painterly`, `ghibli-style`, `modern-anime`.  
**Angles:** `front`, `back`, `side`, `top-down`, `isometric`.  
**Asset types:** `sprite`, `portrait`, `icon`, `texture`, `tile`.

---

## Templates and scaffold

Create a folder structure with template JSON and a README:

```bash
# Create front/, back/, meta-single.json, presets.json, README.md at the given path
npm run cli -- scaffold --path ./data/games/my-project

# Use custom templates from a directory (default: data/templates)
npm run cli -- scaffold --path ./my-assets --templates-dir ./custom-templates
```

Templates (in `data/templates/` or `--templates-dir`): `meta-single.template.json`, `presets.template.json`, `README.template.md`. If missing, built-in defaults are used.

---

## Batch generation (folder)

Generate one image per file in a folder, with the same prompt and meta for all:

```bash
# From a folder of reference images
npm run cli -- generate-batch \
  --input-dir ./data/games/pokemon/red-blue/front \
  --output-dir ./tmp/generated \
  --meta ./data/games/pokemon/red-blue/meta-single.json \
  --prompt "Upgrade to Studio Ghibli style, transparent background"

# Using a preset instead of --prompt
npm run cli -- generate-batch \
  --input-dir ./front --output-dir ./out \
  --meta ./meta-single.json \
  --preset-file ./presets.json --preset front-ghibli-style --subject "creature"
```

Supported image extensions: `.png`, `.jpg`, `.jpeg`, `.webp`. Output filenames match input (converted to `.png`).

---

## Interactive review (accept / deny / regenerate)

Generate from a folder, then for each image: open it, and choose **Accept (a)**, **Deny (d)**, or **Regenerate with a new prompt (r)**. Denied images are moved to `output-dir/rejected/`.

```bash
npm run cli -- review \
  --input-dir ./data/games/pokemon/red-blue/front \
  --output-dir ./tmp/generated \
  --meta ./data/games/pokemon/red-blue/meta-single.json \
  --prompt "Studio Ghibli style, transparent background"
```

When you choose **r**, you’re prompted for a new prompt (or Enter to keep the current one); the image is regenerated and shown again until you accept or deny.

To review existing outputs without generating (e.g. re-run accept/deny on `output-dir`):

```bash
npm run cli -- review --input-dir ./front --output-dir ./tmp/generated --meta ./meta.json --prompt "..." --existing-only
```

Note: Regenerate is only available when not using `--existing-only` (input images are required).

---

## Spritesheet / reference-image mode

For pipelines that need a reference image and frame metadata (e.g. spritesheet-style variation), pass **all three**: `--input-image`, `--input-meta`, and `--output-image`. The CLI sends the reference image and your prompt to the engine and writes the result to `--output-image`. Optional `--output-meta` copies the input meta for downstream tools.

Input meta must be JSON with at least: `frameWidth`, `frameHeight`, `frameCount` (see `spritesheetMetaSchema` in core).

```bash
npm run cli -- generate --prompt "same style, snow theme" \
  --input-image ./spritesheet.png --input-meta ./meta.json \
  --output-image ./out/generated.png --output-meta ./out/meta.json
```

---

## Registered tools

- `list-tools` — list built-in and registered asset tools.
- `run-tool --tool <id>` — run a tool by id. Built-in: `spritesheet` (same as generate with asset args). Custom tools register via `registerTool()` from `@simpill/image-ai-core`.

```bash
npm run cli -- list-tools
npm run cli -- run-tool --tool spritesheet --input-image ./in.png --input-meta ./meta.json --output-image ./out.png --prompt "variation"
```

---

## Scripts (from repo root)

| Script           | Description |
|------------------|-------------|
| `npm install`    | Install all workspaces. |
| `npm run build`  | Build core → cli → web. |
| `npm run typecheck` | Type-check all workspaces. |
| `npm run test`   | Run tests (core + cli). |
| `npm run lint`   | Lint all workspaces. |
| `npm run clean`  | Remove `node_modules` and `dist`. |
| `npm run cli`    | Run built CLI, e.g. `npm run cli -- help`. |
| `npm run image`  | Build CLI and run generate: `npm run image -- --prompt "…" [--engine gemini\|openai\|xai]`. |
| `npm run dev`    | Start optional web app at http://localhost:3000. |

---

## Environment

Copy `.env.sample` to `.env` or `.env.local` and set:

- `GEMINI_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY` (as needed)
- Optional: `GEMINI_API_MODEL`, `OPENAI_API_MODEL`, `XAI_API_MODEL` (defaults in core)

---

## Using the core package elsewhere

Other apps can depend on `@simpill/image-ai-core`:

```ts
import {
  getEngine,
  checkPromptGuard,
  discoverPrompts,
  registerPrompts,
  registerTool,
  getTool,
  listTools,
  generateRequestSchema,
  spritesheetMetaSchema,
} from "@simpill/image-ai-core";
```

Asset tools: implement `AssetTool` and call `registerTool(tool)` so the CLI’s `run-tool` can invoke it.

---

## Tests

- **Core:** Zod schemas, prompt guard, prompt registry (Vitest).
- **CLI:** engine singleton and help wiring.

Run: `npm run test` from repo root.
