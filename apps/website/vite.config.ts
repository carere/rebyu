import { readFileSync } from "node:fs";
import rebyu from "@carere/rebyu";
import { defineConfig } from "vite";
export default defineConfig(({ mode }) => ({
  publicDir: "../../assets",
  plugins: [
    ...(mode === "test"
      ? [
          {
            name: "website-browser-fixture",
            transformIndexHtml: {
              order: "pre" as const,
              handler: () =>
                readFileSync(new URL("./tests/fixtures/index.html", import.meta.url), "utf8"),
            },
          },
        ]
      : []),
    rebyu({ projectName: mode === "test" ? "Studio / website" : "Rebyu website" }),
  ],
}));
