import type { PromptEntry, PromptEntryInput } from "./schemas.js";

const registry: PromptEntry[] = [];

/**
 * Register a prompt template for discovery. Idempotent by id (replaces existing).
 */
export function registerPrompt(entry: PromptEntryInput): void {
  const idx = registry.findIndex((p) => p.id === entry.id);
  const normalized: PromptEntry = {
    ...entry,
    tags: entry.tags ?? [],
  };
  if (idx >= 0) {
    registry[idx] = normalized;
  } else {
    registry.push(normalized);
  }
}

/**
 * Register multiple prompts.
 */
export function registerPrompts(entries: PromptEntry[]): void {
  for (const e of entries) {
    registerPrompt(e);
  }
}

/**
 * Discover all prompts, optionally filtered by tag or search query.
 */
export function discoverPrompts(options?: {
  tags?: string[];
  query?: string;
  engineHint?: "gemini" | "openai" | "xai";
}): PromptEntry[] {
  let out = [...registry];

  if (options?.tags?.length) {
    const set = new Set(options.tags);
    out = out.filter((p) => p.tags.some((t) => set.has(t)));
  }

  if (options?.query?.trim()) {
    const q = options.query.trim().toLowerCase();
    out = out.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.template.toLowerCase().includes(q) ||
        (p.label?.toLowerCase().includes(q) ?? false)
    );
  }

  if (options?.engineHint) {
    out = out.filter(
      (p) => p.modelHint === undefined || p.modelHint === options.engineHint
    );
  }

  return out;
}

/**
 * Get a single prompt by id.
 */
export function getPromptById(id: string): PromptEntry | undefined {
  return registry.find((p) => p.id === id);
}
