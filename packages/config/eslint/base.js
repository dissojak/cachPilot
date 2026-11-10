/**
 * Shared ESLint flat config for all packages (course s.43).
 * apps/web keeps its own next/core-web-vitals config for now.
 */
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**", ".turbo/**", "coverage/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
];
