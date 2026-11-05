import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "client-api": "src/client-api.ts",
    server: "src/server.ts",
    node: "src/node.ts",
    cli: "src/cli.ts",
    widget: "src/widget.ts",
    "file-review-repository": "src/contexts/review/reviews/file-review-repository.ts",
    "d1-review-repository": "src/contexts/review/reviews/d1-review-repository.ts",
    "file-screenshot-repository": "src/contexts/review/screenshots/file-screenshot-repository.ts",
    "s3-screenshot-repository": "src/contexts/review/screenshots/s3-screenshot-repository.ts",
  },
  format: ["esm"],
  dts: true,
  external: ["vite"],
  outDir: "dist",
  // Keep the separately built client, while removing stale server chunks/types before packing.
  clean: ["!client/**"],
});
