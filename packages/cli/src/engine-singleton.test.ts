import { describe, it, expect } from "vitest";
import { getCLIEngine, resetCLIEngine } from "./engine-singleton.js";

describe("CLI engine singleton", () => {
  it("getCLIEngine returns engine with correct engineId", () => {
    resetCLIEngine();
    const e = getCLIEngine("gemini");
    expect(e.engineId).toBe("gemini");
    expect(e.name).toBe("Google Gemini");
  });

  it("switching engine returns new engine", () => {
    resetCLIEngine();
    const g = getCLIEngine("gemini");
    const o = getCLIEngine("openai");
    expect(g.engineId).toBe("gemini");
    expect(o.engineId).toBe("openai");
  });
});
