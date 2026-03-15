import {
  discoverPrompts,
  type EngineId,
} from "@simpill/image-ai-core";

export interface DiscoverOptions {
  tags?: string[];
  query?: string;
  engineHint?: EngineId;
}

export function runDiscover(options: DiscoverOptions): void {
  const entries = discoverPrompts({
    tags: options.tags?.length ? options.tags : undefined,
    query: options.query,
    engineHint: options.engineHint,
  });

  if (entries.length === 0) {
    console.log("No prompts found.");
    return;
  }

  console.log(`Found ${entries.length} prompt(s):`);
  for (const p of entries) {
    const label = p.label ? ` (${p.label})` : "";
    const tags = p.tags.length ? ` [${p.tags.join(", ")}]` : "";
    console.log(`  ${p.id}${label}${tags}`);
    console.log(`    ${p.template.slice(0, 60)}${p.template.length > 60 ? "..." : ""}`);
  }
}
