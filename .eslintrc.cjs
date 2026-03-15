/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: ["./tsconfig.base.json", "./packages/*/tsconfig.json", "./apps/*/tsconfig.json"],
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/strict",
  ],
  ignorePatterns: ["node_modules", "dist", ".next", "*.cjs"],
  overrides: [
    {
      files: ["apps/web/**/*.ts", "apps/web/**/*.tsx"],
      env: { browser: true },
    },
  ],
};
