import { readFileSync, writeFileSync } from "node:fs";

const version = process.argv[2];
if (!version || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
  throw new Error("Provide a stable release version, for example: 0.1.0");
}

const manifestPath = new URL("../packages/vite-plugin-rebyu/package.json", import.meta.url);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.version = version;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
