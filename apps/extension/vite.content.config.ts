import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "content.ts"),
      name: "ConjureContent",
      formats: ["iife"],
      fileName: () => "content.js",
    },
  },
});
