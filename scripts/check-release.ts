import { appendFileSync, readFileSync } from "node:fs";

const manifest = JSON.parse(
  readFileSync(new URL("../packages/vite-plugin-rebyu/package.json", import.meta.url), "utf8"),
);
if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(process.env.RELEASE_TAG ?? "")) {
  throw new Error("Release tags must use vMAJOR.MINOR.PATCH; prereleases are not supported yet.");
}
if (process.env.RELEASE_TAG !== `v${manifest.version}`) {
  throw new Error("The release tag must match the plugin package version.");
}

const packageName = encodeURIComponent(manifest.name);
const response = await fetch(`https://registry.npmjs.org/${packageName}/${manifest.version}`, {
  signal: AbortSignal.timeout(30_000),
});
if (!response.ok && response.status !== 404) {
  throw new Error(`Cannot check the published version: npm returned ${response.status}.`);
}

const publish = response.status === 404;
console.log(
  `${manifest.name}@${manifest.version}: ${publish ? "ready to publish" : "already published"}`,
);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `publish=${publish}\n`);
}
