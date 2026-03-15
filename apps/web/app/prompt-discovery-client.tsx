"use client";

import { useMemo, useState } from "react";
import type { EngineId, PromptEntry } from "@simpill/image-ai-core";
import type { AssetEntry, LevelEntry } from "../lib/sandbox-data";

const ENGINE_IDS: EngineId[] = ["gemini", "openai", "xai"];

type AngleOption = {
  id: string;
  label: string;
  prompt: string;
};

const ANGLE_OPTIONS: AngleOption[] = [
  { id: "none", label: "No angle hint", prompt: "" },
  { id: "front", label: "Front view", prompt: "front view" },
  { id: "three-quarter", label: "Three-quarter view", prompt: "three-quarter view" },
  { id: "side", label: "Side view", prompt: "side view" },
  { id: "isometric", label: "Isometric view", prompt: "isometric view" },
  { id: "top-down", label: "Top-down view", prompt: "top-down view" },
  { id: "low-angle", label: "Low angle", prompt: "low-angle view" },
  { id: "high-angle", label: "High angle", prompt: "high-angle view" },
];

type PromptDiscoveryClientProps = {
  initialPrompts: PromptEntry[];
  promptBank: PromptEntry[];
  levels: LevelEntry[];
  assets: AssetEntry[];
};

export function PromptDiscoveryClient({
  initialPrompts,
  promptBank,
  levels,
  assets,
}: PromptDiscoveryClientProps) {
  const [tagFilter, setTagFilter] = useState("");
  const [query, setQuery] = useState("");
  const [engineHint, setEngineHint] = useState<EngineId | "">("");
  const [sandboxPrompt, setSandboxPrompt] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [angleId, setAngleId] = useState("none");
  const [levelQuery, setLevelQuery] = useState("");
  const [assetQuery, setAssetQuery] = useState("");

  const prompts = useMemo(() => {
    let out = initialPrompts;

    if (tagFilter.trim()) {
      const set = new Set(tagFilter.split(",").map((t) => t.trim()));
      out = out.filter((p) => p.tags.some((t) => set.has(t)));
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.template.toLowerCase().includes(q) ||
          (p.label?.toLowerCase().includes(q) ?? false)
      );
    }

    if (engineHint) {
      out = out.filter(
        (p) => p.modelHint === undefined || p.modelHint === engineHint
      );
    }

    return out;
  }, [initialPrompts, tagFilter, query, engineHint]);

  const selectedAngle = useMemo(() => {
    return ANGLE_OPTIONS.find((option) => option.id === angleId) ?? ANGLE_OPTIONS[0];
  }, [angleId]);

  const finalPrompt = useMemo(() => {
    const base = sandboxPrompt.trim();
    const angle = selectedAngle.prompt.trim();

    if (!base) return angle;
    if (!angle) return base;
    return `${base}, ${angle}`;
  }, [sandboxPrompt, selectedAngle]);

  const filteredLevels = useMemo(() => {
    if (!levelQuery.trim()) return levels;
    const q = levelQuery.trim().toLowerCase();
    return levels.filter(
      (level) =>
        level.id.toLowerCase().includes(q) ||
        level.name.toLowerCase().includes(q) ||
        level.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [levelQuery, levels]);

  const filteredAssets = useMemo(() => {
    if (!assetQuery.trim()) return assets;
    const q = assetQuery.trim().toLowerCase();
    return assets.filter(
      (asset) =>
        asset.id.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        asset.type.toLowerCase().includes(q) ||
        asset.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [assetQuery, assets]);

  function loadPrompt(entry: PromptEntry): void {
    setSelectedPromptId(entry.id);
    setSandboxPrompt(entry.template);
  }

  function clearSandbox(): void {
    setSelectedPromptId("");
    setSandboxPrompt("");
  }

  return (
    <>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: 12 }}>Sandbox</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: 600 }}>Prompt bank</span>
            <select
              value={selectedPromptId}
              onChange={(event) => {
                const selected = promptBank.find((p) => p.id === event.target.value);
                if (selected) {
                  loadPrompt(selected);
                  return;
                }
                clearSandbox();
              }}
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            >
              <option value="">Start from blank</option>
              {promptBank.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label ?? entry.id}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: 600 }}>Prompt editor</span>
            <textarea
              rows={4}
              placeholder="Type or edit a prompt..."
              value={sandboxPrompt}
              onChange={(event) => setSandboxPrompt(event.target.value)}
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: 600 }}>Render angle</span>
            <select
              value={angleId}
              onChange={(event) => setAngleId(event.target.value)}
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            >
              {ANGLE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={clearSandbox}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: 4,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Start blank
            </button>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Final prompt</div>
            <pre
              style={{
                margin: 0,
                padding: 12,
                fontSize: "0.875rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                border: "1px solid #eee",
                borderRadius: 8,
                background: "#fafafa",
              }}
            >
              {finalPrompt || "Prompt is empty."}
            </pre>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: 12 }}>Context data</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: 600 }}>Levels</span>
            <input
              type="text"
              placeholder="Search levels by name, id, or tag..."
              value={levelQuery}
              onChange={(event) => setLevelQuery(event.target.value)}
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
          </label>
          {filteredLevels.length === 0 ? (
            <p style={{ color: "#666" }}>No levels match the filter.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {filteredLevels.map((level) => (
                <li
                  key={level.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{level.name}</div>
                  <div style={{ fontSize: "0.875rem", color: "#666" }}>{level.id}</div>
                  {level.summary ? (
                    <div style={{ fontSize: "0.875rem", marginTop: 6 }}>
                      {level.summary}
                    </div>
                  ) : null}
                  {level.tags.length > 0 ? (
                    <div style={{ fontSize: "0.75rem", color: "#666", marginTop: 6 }}>
                      {level.tags.join(", ")}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: 600 }}>Assets</span>
            <input
              type="text"
              placeholder="Search assets by name, id, type, or tag..."
              value={assetQuery}
              onChange={(event) => setAssetQuery(event.target.value)}
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
          </label>
          {filteredAssets.length === 0 ? (
            <p style={{ color: "#666" }}>No assets match the filter.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {filteredAssets.map((asset) => (
                <li
                  key={asset.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{asset.name}</div>
                  <div style={{ fontSize: "0.875rem", color: "#666" }}>
                    {asset.id} · {asset.type}
                  </div>
                  {asset.tags.length > 0 ? (
                    <div style={{ fontSize: "0.75rem", color: "#666", marginTop: 6 }}>
                      {asset.tags.join(", ")}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div
        style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Search</span>
          <input
            type="text"
            placeholder="Search in id, pretty name, template..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Tags (comma-separated)</span>
          <input
            type="text"
            placeholder="e.g. game, sprite"
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Engine hint</span>
          <select
            value={engineHint}
            onChange={(event) => {
              const matched =
                ENGINE_IDS.find((id) => id === event.target.value) ?? "";
              setEngineHint(matched);
            }}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          >
            <option value="">Any</option>
            {ENGINE_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: 12 }}>
          Prompts ({prompts.length})
        </h2>
        {prompts.length === 0 ? (
          <p style={{ color: "#666" }}>No prompts match the filters.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {prompts.map((p) => (
              <li
                key={p.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {p.label ?? p.id}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#666", marginBottom: 6 }}>
                  {p.id}
                </div>
                {p.tags.length > 0 ? (
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#666",
                      marginBottom: 8,
                    }}
                  >
                    {p.tags.join(", ")}
                  </div>
                ) : null}
                <pre
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {p.template}
                </pre>
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => loadPrompt(p)}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Use in sandbox
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
