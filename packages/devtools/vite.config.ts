import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      bundleTypes: true,
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      outDirs: "dist/types",
      tsconfigPath: "./tsconfig.build.json",
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
      formats: ["es", "cjs"],
    },
    minify: true,
    rollupOptions: {
      external: ["@stagecut/core", "@stagecut/react", "react", "react/jsx-runtime", "react-dom"],
      output: { banner: '"use client";' },
    },
    sourcemap: true,
  },
});
