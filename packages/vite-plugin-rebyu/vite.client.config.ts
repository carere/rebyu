import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwind from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { paraglideOptions } from "./paraglide.config";
import { shadowProperties } from "./postcss/shadow-properties";
export default defineConfig({
  plugins: [solid(), paraglideVitePlugin(paraglideOptions), tailwind()],
  css: { postcss: { plugins: [shadowProperties()] } },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    lib: {
      entry: "src/client/index.tsx",
      formats: ["es"],
      fileName: () => "client.js",
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
    minify: true,
  },
});
