import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    include: ["data/**/*.test.ts"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@data": resolve(import.meta.dirname, "./data"),
    },
  },
});
