import { defineConfig } from "vitest/config";

// The integration tests download and start a MongoDB binary the first time.
export default defineConfig({ test: { testTimeout: 30_000, hookTimeout: 180_000 } });
