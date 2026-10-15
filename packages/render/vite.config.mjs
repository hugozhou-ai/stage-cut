import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "node20",
    minify: false,
    sourcemap: true,
    lib: {
      entry: "src/index.mjs",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    rollupOptions: { external: (id) => id.startsWith("node:") || id.startsWith("@remotion/") },
  },
});
