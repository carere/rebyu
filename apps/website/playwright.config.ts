import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.e2e.ts",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5200",
    browserName: "chromium",
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bunx --bun vite preview --host 127.0.0.1 --port 5200 --strictPort",
    url: "http://127.0.0.1:5200",
    reuseExistingServer: false,
  },
});
