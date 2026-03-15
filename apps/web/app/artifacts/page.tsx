import { loadAssets, loadPromptBank } from "../../lib/sandbox-data";
import { ArtifactSandboxClient } from "./artifact-sandbox-client";

export default async function ArtifactsPage() {
  const [promptBank, assets] = await Promise.all([loadPromptBank(), loadAssets()]);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Artifacts sandbox</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Browse asset artifacts, upload a reference “original”, and generate a modern variant
        locally via the Image AI toolkit. Do not use or ship proprietary game assets.
      </p>
      <ArtifactSandboxClient promptBank={promptBank} assets={assets} />
    </main>
  );
}

