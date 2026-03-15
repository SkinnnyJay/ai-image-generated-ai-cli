import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolRoot = path.resolve(__dirname, "..", "..");

const nextConfig: NextConfig = {
  transpilePackages: ["@simpill/image-ai-core"],
  outputFileTracingRoot: toolRoot,
};

export default nextConfig;
