import { defineConfig } from "vite";
import rebyu from "vite-plugin-rebyu";
export default defineConfig({
  plugins: [rebyu({ projectName: "Studio / website", open: true })],
});
