import tailwind from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
export default defineConfig({
  plugins: [solid(), tailwind()],
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
