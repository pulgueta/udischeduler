import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "convex",
          include: ["convex/**/*.test.ts"],
          exclude: ["./convex/_generated"],
          environment: "edge-runtime",
        },
      },
      {
        extends: true,
        test: {
          name: "frontend",
          include: ["./src/**/*.test.{ts,tsx}"],
          exclude: ["convex", "node_modules"],
          environment: "jsdom",
        },
      },
    ],
  },
});
