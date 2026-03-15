import { describe, it, expect, beforeEach } from "vitest";
import {
  registerPrompt,
  registerPrompts,
  discoverPrompts,
  getPromptById,
} from "./registry.js";

// Registry is module-level; we need to reset between tests. There's no reset export,
// so we use unique ids per test to avoid collisions.
describe("registry", () => {
  beforeEach(() => {
    registerPrompts([
      { id: "r1", template: "template one", tags: ["a"] },
      { id: "r2", template: "template two", tags: ["b", "a"] },
      { id: "r3", template: "other", tags: ["b"] },
    ]);
  });

  it("getPromptById returns entry", () => {
    const p = getPromptById("r1");
    expect(p).toBeDefined();
    expect(p?.id).toBe("r1");
    expect(p?.template).toBe("template one");
  });

  it("getPromptById returns undefined for unknown id", () => {
    expect(getPromptById("nonexistent")).toBeUndefined();
  });

  it("discoverPrompts returns all without filters", () => {
    const all = discoverPrompts({});
    expect(all.length).toBeGreaterThanOrEqual(3);
  });

  it("discoverPrompts filters by tag", () => {
    const withA = discoverPrompts({ tags: ["a"] });
    expect(withA.every((p) => p.tags.includes("a"))).toBe(true);
  });

  it("discoverPrompts filters by query", () => {
    const withTwo = discoverPrompts({ query: "two" });
    expect(withTwo.some((p) => p.template.includes("two"))).toBe(true);
  });

  it("registerPrompt replaces existing by id", () => {
    registerPrompt({ id: "r1", template: "replaced" });
    const p = getPromptById("r1");
    expect(p?.template).toBe("replaced");
  });
});
