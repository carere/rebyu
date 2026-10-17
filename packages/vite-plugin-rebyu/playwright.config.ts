import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/integration/browser",
  testMatch: "**/*.e2e.ts",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5199",
    browserName: "chromium",
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bunx --bun vite --host 127.0.0.1 --port 5199 --strictPort",
    cwd: fileURLToPath(new URL("../../apps/playground", import.meta.url)),
    url: "http://127.0.0.1:5199",
    reuseExistingServer: false,
  },
});
