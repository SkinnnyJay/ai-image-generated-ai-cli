import { listTools } from "@simpill/image-ai-core";

export function runListTools(): void {
  const tools = listTools();
  const builtIn = [{ id: "spritesheet", name: "Spritesheet (built-in)", description: "Generate/vary image from reference spritesheet + meta using AI" }];
  const all = builtIn.concat(
    tools.map((t) => ({ id: t.id, name: t.name, description: t.description ?? "" })),
  );
  if (all.length === 0) {
    console.log("No tools registered. Use run-tool --tool spritesheet for built-in asset mode.");
    return;
  }
  console.log("Registered asset tools:");
  for (const t of all) {
    console.log(`  ${t.id}\t${t.name}${t.description ? ` - ${t.description}` : ""}`);
  }
}
