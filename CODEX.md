# CODEX.md

Project: **ai-image-generated-ai-cli** (simpill)  
Languages: TypeScript (Node and optional Next.js)

## Project Context

This repo is the **Image AI CLI** for the simpill toolkit: a standalone CLI and SDK for generating images via Gemini, OpenAI, and xAI. It includes the core SDK (`@simpill/image-ai-core`), the CLI binary `ai-image-gen`, and an optional Next.js app for prompt discovery. The focus is on the CLI and how to use it; see **README.md** for full usage.

## Engineering Rules

- TypeScript strict: no `any` or unsafe casts; validate at boundaries with Zod.
- Layered config: defaults → config file → env → CLI args.
- API keys and model overrides via env (`.env` / `.env.local`); do not commit secrets.
- Do not log or persist user prompt or image content in a way that could leak proprietary data.

## Architecture

- **Core:** Engine interface, Zod schemas, prompt registry, prompt-injection guard, adapters (Gemini, OpenAI, xAI), factory singleton, asset-tool registration.
- **CLI:** Commands: `list-models`, `discover`, `generate`, `list-presets`, `scaffold`, `generate-batch`, `review`, `run-tool`, `list-tools`, `config`, `help`. Reads env for API keys; dotenv loads `.env` / `.env.local`.
- **Web (optional):** Next.js App Router; uses core’s prompt registry only; no engine or Node-only code in client bundle.

## Commands

- `make help` — list make targets
- `make check` — lint, typecheck, test, build
- `npm run cli -- help` — CLI usage
- `npm run image -- --prompt "…"` — build CLI and run generate

## Key Docs

- **README.md** — structure, scripts, CLI usage, env, spritesheet mode, templates, batch, review.
- **CLAUDE.md**, **AGENTS.md** — agent and coding context for this repo.

## Quality / Audit

- `npm run lint` and `npm run typecheck` must pass. `npm audit` may report dev-only issues (e.g. vitest/esbuild); fix with `npm audit fix` when acceptable, or `npm audit fix --force` for breaking updates.
