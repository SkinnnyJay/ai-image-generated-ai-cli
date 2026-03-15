# CLAUDE.md

You are working in **ai-image-generated-ai-cli**, part of the **simpill** toolkit: a TypeScript CLI and SDK for AI image generation (Gemini, OpenAI, xAI). The repo contains the core SDK (`@simpill/image-ai-core`), the CLI binary `ai-image-gen`, and an optional prompt-discovery web app.

## Always Do

- Use **README.md** as the source of truth for structure, scripts, and how to use the CLI.
- Use strict TypeScript: no `any` or unsafe casts; validate boundaries with Zod (requests, meta, config).
- Keep the core engine-agnostic; adapters read env and call provider APIs.
- In library code: avoid `process.env` and `console.*` in published code; use config injection or passed options. Tests and CLI entrypoints may use them.

## Never Do

- Do not log or persist user prompt or image content in a way that could leak proprietary data.
- Do not bypass the prompt guard or schema validation at API boundaries.

## Commands

- `npm install`, `npm run build`, `npm run typecheck`, `npm run test`, `npm run lint`
- CLI: `npm run cli -- help`, `npm run cli -- generate --prompt "…" --engine gemini --out ./out`
- Optional web: `npm run dev` (Next.js at http://localhost:3000)

## Reference Docs

- `README.md` — usage, scripts, env, spritesheet mode, tools.
