# AGENTS.md

Project: **ai-image-generated-ai-cli** (simpill) — TypeScript CLI and SDK for AI image generation.

## Agent Focus Areas

- **Core SDK (`@simpill/image-ai-core`):** Engine interface, Zod schemas, prompt registry, prompt-injection guard, adapters (Gemini, OpenAI, xAI), factory, asset tools registration.
- **CLI (`ai-image-gen`):** Commands: `list-models`, `discover`, `generate`, `list-presets`, `scaffold`, `generate-batch`, `review`, `run-tool`, `list-tools`, `config`, `help`. Build and wire to core.
- **Optional web app:** Next.js prompt discovery (search, tags); uses core registry only (no API keys in browser).

## Task Checklist

- Confirm scope with **README.md** (structure, scripts, usage).
- Enforce strict typing and Zod validation at boundaries (generate requests, spritesheet meta, config).
- Add or update tests for core (schemas, guard, registry) and CLI (engine singleton, help).
- Do not log or persist user prompt/image content; do not bypass guard or validation.

## Commands

- `npm install`, `npm run build`, `npm run typecheck`, `npm run test`, `npm run lint`
- `npm run cli -- help` — CLI usage
- `npm run dev` — optional web app

## Reference

- **README.md** — how to use the CLI, env, spritesheet mode, templates, batch, interactive review, registered tools.
