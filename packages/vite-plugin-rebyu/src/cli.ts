#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { startRebyuServer } from "./node";

const configPath = process.argv[2] ?? "rebyu.config.ts";
try {
  const configuration = await import(pathToFileURL(resolve(configPath)).href);
  if (!configuration.default) throw new Error("Export the Rebyu server configuration as default.");
  const server = await startRebyuServer(configuration.default);
  const address = server.address();
  if (address && typeof address !== "string")
    console.log(`[rebyu] Listening on ${address.address}:${address.port}`);
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.once(signal, () =>
      server.close(() => {
        process.exitCode = 0;
      }),
    );
} catch (error) {
  console.error("[rebyu] Could not start the review service.", error);
  process.exitCode = 1;
}
