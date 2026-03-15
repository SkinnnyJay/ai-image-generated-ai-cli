import { discoverPrompts, registerPrompts } from "@simpill/image-ai-core";
import { loadAssets, loadLevels, loadPromptBank } from "../lib/sandbox-data";
import { PromptDiscoveryClient } from "./prompt-discovery-client";

export default async function PromptDiscoveryPage() {
  const [promptBank, levels, assets] = await Promise.all([
    loadPromptBank(),
    loadLevels(),
    loadAssets(),
  ]);
  registerPrompts(promptBank);
  const initialPrompts = discoverPrompts({});

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Prompt discovery</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Browse and filter prompt templates. Use tags, search, or engine hint.
      </p>
      <PromptDiscoveryClient
        initialPrompts={initialPrompts}
        promptBank={promptBank}
        levels={levels}
        assets={assets}
      />
    </main>
  );
}
