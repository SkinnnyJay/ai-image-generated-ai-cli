import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    globals: true,
    environment: "node",
  },
  resolve: {
    extensions: [".ts", ".tsx"],
  },
  esbuild: { target: "ES2022" },
});
