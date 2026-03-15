"use client";

import type { EngineId, PromptEntry } from "@simpill/image-ai-core";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type { AssetEntry } from "../../lib/sandbox-data";

type ViewMode = "grid" | "table";

type UploadedImage = {
  fileName: string;
  mime: string;
  base64: string;
};

type GeneratedImage = {
  mime: string;
  base64: string;
  engineId: EngineId;
  modelUsed: string;
};

type PerAssetDraft = {
  selectedPromptId: string;
  promptDraft: string;
};

type SandboxSettings = {
  engineId: EngineId;
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  numberOfImages: 1 | 2 | 3 | 4;
  transparentHint: boolean;
};

type PersistedSandboxState = {
  version: 1;
  settings: SandboxSettings;
  perAsset: Record<string, PerAssetDraft>;
};

const ENGINE_IDS: EngineId[] = ["gemini", "openai", "xai"];

const PERSIST_KEY = "image-ai.artifact-sandbox.v1";

const persistedStateSchema = z.object({
  version: z.literal(1),
  settings: z.object({
    engineId: z.enum(["gemini", "openai", "xai"]),
    aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]),
    numberOfImages: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
    ]),
    transparentHint: z.boolean(),
  }),
  perAsset: z.record(
    z.object({
      selectedPromptId: z.string(),
      promptDraft: z.string(),
    })
  ),
});

const generateApiResponseSchema = z.object({
  engineId: z.enum(["gemini", "openai", "xai"]),
  modelUsed: z.string().min(1),
  outputFormat: z.enum(["png", "jpeg", "webp"]),
  imagesBase64: z.array(z.string().min(1)),
});

type GenerateApiResponse = z.infer<typeof generateApiResponseSchema>;

function mimeForOutputFormat(
  format: "png" | "jpeg" | "webp"
): "image/png" | "image/jpeg" | "image/webp" {
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  return "image/png";
}

function buildDefaultPrompt(template: string, asset: AssetEntry): string {
  const tagLine = asset.tags.length > 0 ? `Tags: ${asset.tags.join(", ")}` : "Tags: (none)";
  return `${template}\n\nSubject: ${asset.name} (${asset.type}).\n${tagLine}`;
}

function parseDataUrl(dataUrl: string): { mime: string; base64: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  if (!mime || !base64) return null;
  return { mime, base64 };
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unexpected FileReader result"));
        return;
      }
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
}

function getAssetById(assets: AssetEntry[], id: string): AssetEntry | null {
  const found = assets.find((a) => a.id === id);
  return found ?? null;
}

function sortAssetsByName(assets: AssetEntry[]): AssetEntry[] {
  return [...assets].sort((a, b) => a.name.localeCompare(b.name));
}

export type ArtifactSandboxClientProps = {
  promptBank: PromptEntry[];
  assets: AssetEntry[];
};

export function ArtifactSandboxClient({ promptBank, assets }: ArtifactSandboxClientProps) {
  const sortedAssets = useMemo(() => sortAssetsByName(assets), [assets]);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [assetQuery, setAssetQuery] = useState("");
  const [focusedAssetId, setFocusedAssetId] = useState(sortedAssets[0]?.id ?? "");

  const [settings, setSettings] = useState<SandboxSettings>({
    engineId: "gemini",
    aspectRatio: "1:1",
    numberOfImages: 1,
    transparentHint: true,
  });

  const [seedText, setSeedText] = useState("");
  const [perAssetDraft, setPerAssetDraft] = useState<Record<string, PerAssetDraft>>({});
  const [originalImages, setOriginalImages] = useState<Record<string, UploadedImage | undefined>>(
    {}
  );
  const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage | undefined>>(
    {}
  );
  const [busyAssetIds, setBusyAssetIds] = useState<Record<string, boolean | undefined>>({});
  const [lastError, setLastError] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    const q = assetQuery.trim().toLowerCase();
    if (!q) return sortedAssets;
    return sortedAssets.filter(
      (asset) =>
        asset.id.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        asset.type.toLowerCase().includes(q) ||
        asset.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [assetQuery, sortedAssets]);

  const focusedAsset = useMemo(() => {
    return getAssetById(sortedAssets, focusedAssetId);
  }, [sortedAssets, focusedAssetId]);

  const focusedDraft = useMemo(() => {
    return perAssetDraft[focusedAssetId] ?? { selectedPromptId: "", promptDraft: "" };
  }, [perAssetDraft, focusedAssetId]);

  const focusedOriginal = useMemo(() => {
    return originalImages[focusedAssetId];
  }, [originalImages, focusedAssetId]);

  const focusedGenerated = useMemo(() => {
    return generatedImages[focusedAssetId];
  }, [generatedImages, focusedAssetId]);

  const focusedBusy = useMemo(() => {
    return busyAssetIds[focusedAssetId] ?? false;
  }, [busyAssetIds, focusedAssetId]);

  useEffect(() => {
    if (sortedAssets.length === 0) return;

    const raw = window.localStorage.getItem(PERSIST_KEY);
    if (!raw) return;
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      return;
    }

    const parsed = persistedStateSchema.safeParse(parsedJson);
    if (!parsed.success) return;

    const state: PersistedSandboxState = parsed.data;
    setSettings(state.settings);
    setPerAssetDraft(state.perAsset);
  }, [sortedAssets.length]);

  useEffect(() => {
    const state: PersistedSandboxState = {
      version: 1,
      settings,
      perAsset: perAssetDraft,
    };
    window.localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  }, [settings, perAssetDraft]);

  function updateDraft(assetId: string, next: PerAssetDraft): void {
    setPerAssetDraft((prev) => ({ ...prev, [assetId]: next }));
  }

  function setFocused(assetId: string): void {
    setFocusedAssetId(assetId);
    setLastError(null);
  }

  function loadPromptTemplate(asset: AssetEntry, promptId: string): void {
    const entry = promptBank.find((p) => p.id === promptId);
    if (!entry) {
      updateDraft(asset.id, { selectedPromptId: "", promptDraft: "" });
      return;
    }
    updateDraft(asset.id, {
      selectedPromptId: entry.id,
      promptDraft: buildDefaultPrompt(entry.template, asset),
    });
  }

  async function onUploadOriginal(asset: AssetEntry, file: File): Promise<void> {
    setLastError(null);
    const dataUrl = await readFileAsDataUrl(file);
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      setLastError("Unsupported image encoding (expected base64 data URL).");
      return;
    }
    setOriginalImages((prev) => ({
      ...prev,
      [asset.id]: { fileName: file.name, mime: parsed.mime, base64: parsed.base64 },
    }));
  }

  async function generateForFocused(): Promise<void> {
    if (!focusedAsset) return;
    const assetId = focusedAsset.id;
    const draft = perAssetDraft[assetId];
    const prompt = draft?.promptDraft?.trim() ?? "";
    if (!prompt) {
      setLastError("Prompt is empty. Select a template or type a prompt first.");
      return;
    }

    setLastError(null);
    setBusyAssetIds((prev) => ({ ...prev, [assetId]: true }));
    try {
      const seedTrim = seedText.trim();
      const seed =
        seedTrim === "" ? undefined : Number.isFinite(Number(seedTrim)) ? Number(seedTrim) : NaN;
      const seedValid =
        seed === undefined || (Number.isInteger(seed) && seed >= 0 && seed <= Number.MAX_SAFE_INTEGER);

      if (!seedValid) {
        setLastError("Seed must be a non-negative integer (or blank).");
        return;
      }

      const original = originalImages[assetId];

      const payload = {
        engineId: settings.engineId,
        prompt,
        seed: seed === undefined ? undefined : seed,
        aspectRatio: settings.aspectRatio,
        outputFormat: "png",
        numberOfImages: settings.numberOfImages,
        transparentHint: settings.transparentHint,
        inputImageBase64: original?.base64,
        inputImageMime: original?.mime,
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw: unknown = await res.json();
      if (!res.ok) {
        const message =
          raw && typeof raw === "object" && "error" in raw && typeof raw.error === "string"
            ? raw.error
            : "Generation request failed.";
        setLastError(message);
        return;
      }

      const parsed = generateApiResponseSchema.safeParse(raw);
      if (!parsed.success) {
        setLastError("Generator returned an unexpected response shape.");
        return;
      }

      const data: GenerateApiResponse = parsed.data;
      const first = data.imagesBase64[0];
      if (!first) {
        setLastError("No images returned.");
        return;
      }

      setGeneratedImages((prev) => ({
        ...prev,
        [assetId]: {
          engineId: data.engineId,
          modelUsed: data.modelUsed,
          mime: mimeForOutputFormat(data.outputFormat),
          base64: first,
        },
      }));
    } finally {
      setBusyAssetIds((prev) => ({ ...prev, [assetId]: false }));
    }
  }

  const focusedPromptText = focusedDraft.promptDraft;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24 }}>
      <aside style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Controls</div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Focus asset</span>
          <select
            value={focusedAssetId}
            onChange={(e) => setFocused(e.target.value)}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          >
            {sortedAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            style={{
              flex: 1,
              padding: "8px 10px",
              border: "1px solid #ccc",
              borderRadius: 6,
              background: viewMode === "grid" ? "#111" : "#fff",
              color: viewMode === "grid" ? "#fff" : "#111",
              cursor: "pointer",
            }}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            style={{
              flex: 1,
              padding: "8px 10px",
              border: "1px solid #ccc",
              borderRadius: 6,
              background: viewMode === "table" ? "#111" : "#fff",
              color: viewMode === "table" ? "#fff" : "#111",
              cursor: "pointer",
            }}
          >
            Table
          </button>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Filter assets</span>
          <input
            type="text"
            value={assetQuery}
            onChange={(e) => setAssetQuery(e.target.value)}
            placeholder="Search by id, name, type, tag..."
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
        </label>

        <div style={{ fontWeight: 700, margin: "16px 0 10px" }}>Generation</div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Engine</span>
          <select
            value={settings.engineId}
            onChange={(e) => {
              const next =
                ENGINE_IDS.find((id) => id === e.target.value) ?? settings.engineId;
              setSettings((prev) => ({ ...prev, engineId: next }));
            }}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          >
            {ENGINE_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Aspect ratio</span>
          <select
            value={settings.aspectRatio}
            onChange={(e) => {
              const val = e.target.value;
              const parsed = z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).safeParse(val);
              if (!parsed.success) return;
              setSettings((prev) => ({ ...prev, aspectRatio: parsed.data }));
            }}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          >
            <option value="1:1">1:1</option>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="4:3">4:3</option>
            <option value="3:4">3:4</option>
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Images per run</span>
          <select
            value={settings.numberOfImages}
            onChange={(e) => {
              const parsed = z.union([
                z.literal(1),
                z.literal(2),
                z.literal(3),
                z.literal(4),
              ]).safeParse(Number(e.target.value));
              if (!parsed.success) return;
              setSettings((prev) => ({ ...prev, numberOfImages: parsed.data }));
            }}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Seed (optional)</span>
          <input
            type="text"
            value={seedText}
            onChange={(e) => setSeedText(e.target.value)}
            placeholder="e.g. 12345"
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={settings.transparentHint}
            onChange={(e) => setSettings((prev) => ({ ...prev, transparentHint: e.target.checked }))}
          />
          <span style={{ fontWeight: 600 }}>Transparent background hint</span>
        </label>

        <button
          type="button"
          onClick={generateForFocused}
          disabled={!focusedAsset || focusedBusy}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #111",
            borderRadius: 8,
            background: focusedBusy ? "#ddd" : "#111",
            color: focusedBusy ? "#333" : "#fff",
            cursor: focusedBusy ? "not-allowed" : "pointer",
          }}
        >
          {focusedBusy ? "Generating..." : "Generate modern variant"}
        </button>

        {lastError ? (
          <div style={{ marginTop: 12, color: "#b00020", fontSize: "0.875rem" }}>
            {lastError}
          </div>
        ) : null}
      </aside>

      <section>
        {!focusedAsset ? (
          <div style={{ color: "#666" }}>No assets found.</div>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: "1.125rem" }}>{focusedAsset.name}</div>
            <div style={{ color: "#666", fontSize: "0.875rem" }}>
              {focusedAsset.id} · {focusedAsset.type}
              {focusedAsset.tags.length > 0 ? ` · ${focusedAsset.tags.join(", ")}` : ""}
            </div>
          </div>
        )}

        {focusedAsset ? (
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Original (upload)</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void onUploadOriginal(focusedAsset, file);
                  }}
                />
                <div style={{ marginTop: 10 }}>
                  {focusedOriginal ? (
                    <Image
                      src={`data:${focusedOriginal.mime};base64,${focusedOriginal.base64}`}
                      alt={`Original for ${focusedAsset.name}`}
                      width={800}
                      height={600}
                      unoptimized
                      style={{
                        width: "100%",
                        height: 260,
                        objectFit: "contain",
                        border: "1px solid #eee",
                        borderRadius: 10,
                        background: "#fafafa",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 260,
                        border: "1px dashed #ccc",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666",
                        background: "#fcfcfc",
                      }}
                    >
                      Upload a reference image.
                    </div>
                  )}
                </div>
                {focusedOriginal ? (
                  <div style={{ marginTop: 8, color: "#666", fontSize: "0.875rem" }}>
                    {focusedOriginal.fileName}
                  </div>
                ) : null}
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Generated (modern)</div>
                <div style={{ marginTop: 10 }}>
                  {focusedGenerated ? (
                    <>
                      <Image
                        src={`data:${focusedGenerated.mime};base64,${focusedGenerated.base64}`}
                        alt={`Generated for ${focusedAsset.name}`}
                        width={800}
                        height={600}
                        unoptimized
                        style={{
                          width: "100%",
                          height: 260,
                          objectFit: "contain",
                          border: "1px solid #eee",
                          borderRadius: 10,
                          background: "#fafafa",
                        }}
                      />
                      <div style={{ marginTop: 8, color: "#666", fontSize: "0.875rem" }}>
                        {focusedGenerated.engineId} · {focusedGenerated.modelUsed}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        height: 260,
                        border: "1px dashed #ccc",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666",
                        background: "#fcfcfc",
                      }}
                    >
                      Generate to see output.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Prompt template</div>
                <select
                  value={focusedDraft.selectedPromptId}
                  onChange={(e) => loadPromptTemplate(focusedAsset, e.target.value)}
                  style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
                >
                  <option value="">Start from blank</option>
                  {promptBank.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label ?? entry.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Prompt editor</div>
                <textarea
                  rows={5}
                  value={focusedPromptText}
                  onChange={(e) =>
                    updateDraft(focusedAsset.id, {
                      selectedPromptId: focusedDraft.selectedPromptId,
                      promptDraft: e.target.value,
                    })
                  }
                  placeholder="Select a template or type a prompt..."
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ fontWeight: 800, marginBottom: 12 }}>
          Assets ({filteredAssets.length})
        </div>

        {viewMode === "table" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                  <th style={{ padding: "10px 8px" }}>Name</th>
                  <th style={{ padding: "10px 8px" }}>Id</th>
                  <th style={{ padding: "10px 8px" }}>Type</th>
                  <th style={{ padding: "10px 8px" }}>Tags</th>
                  <th style={{ padding: "10px 8px" }}>Preview</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => {
                  const original = originalImages[asset.id];
                  const generated = generatedImages[asset.id];
                  const preview = generated ?? original;
                  return (
                    <tr
                      key={asset.id}
                      style={{
                        borderBottom: "1px solid #f2f2f2",
                        background: asset.id === focusedAssetId ? "#fafafa" : "#fff",
                      }}
                    >
                      <td style={{ padding: "10px 8px", fontWeight: 600 }}>
                        <button
                          type="button"
                          onClick={() => setFocused(asset.id)}
                          style={{
                            padding: 0,
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            textAlign: "left",
                            font: "inherit",
                          }}
                        >
                          {asset.name}
                        </button>
                      </td>
                      <td style={{ padding: "10px 8px", color: "#666", fontSize: "0.875rem" }}>
                        {asset.id}
                      </td>
                      <td style={{ padding: "10px 8px" }}>{asset.type}</td>
                      <td style={{ padding: "10px 8px", color: "#666", fontSize: "0.875rem" }}>
                        {asset.tags.join(", ")}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        {preview ? (
                          <Image
                            src={`data:${preview.mime};base64,${preview.base64}`}
                            alt={`Preview for ${asset.name}`}
                            width={56}
                            height={56}
                            unoptimized
                            style={{
                              width: 56,
                              height: 56,
                              objectFit: "cover",
                              borderRadius: 10,
                              border: "1px solid #eee",
                              background: "#fafafa",
                            }}
                          />
                        ) : (
                          <span style={{ color: "#999", fontSize: "0.875rem" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {filteredAssets.map((asset) => {
              const original = originalImages[asset.id];
              const generated = generatedImages[asset.id];
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setFocused(asset.id)}
                  style={{
                    textAlign: "left",
                    padding: 12,
                    border: asset.id === focusedAssetId ? "2px solid #111" : "1px solid #eee",
                    borderRadius: 12,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{asset.name}</div>
                  <div style={{ color: "#666", fontSize: "0.875rem", marginBottom: 10 }}>
                    {asset.type}
                    {asset.tags.length > 0 ? ` · ${asset.tags.join(", ")}` : ""}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ color: "#666", fontSize: "0.75rem", marginBottom: 6 }}>
                        Original
                      </div>
                      <div
                        style={{
                          height: 110,
                          border: "1px solid #eee",
                          borderRadius: 10,
                          background: "#fafafa",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {original ? (
                          <Image
                            src={`data:${original.mime};base64,${original.base64}`}
                            alt=""
                            width={220}
                            height={110}
                            unoptimized
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <span style={{ color: "#999", fontSize: "0.75rem" }}>—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#666", fontSize: "0.75rem", marginBottom: 6 }}>
                        Generated
                      </div>
                      <div
                        style={{
                          height: 110,
                          border: "1px solid #eee",
                          borderRadius: 10,
                          background: "#fafafa",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {generated ? (
                          <Image
                            src={`data:${generated.mime};base64,${generated.base64}`}
                            alt=""
                            width={220}
                            height={110}
                            unoptimized
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <span style={{ color: "#999", fontSize: "0.75rem" }}>—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

