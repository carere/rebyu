import { type ChildProcess, execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const cliPath = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));
const repositoryUrl = new URL("../../dist/file-review-repository.js", import.meta.url).href;
const authenticationUrl = new URL("../../dist/server.js", import.meta.url).href;
const token = "a-private-cli-token-with-at-least-32-characters";
const execute = promisify(execFile);
let directory: string;
let service: ChildProcess | undefined;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "rebyu-cli-"));
  service = undefined;
});

afterEach(async () => {
  if (service && service.exitCode === null && service.signalCode === null) {
    const exited = once(service, "exit", { signal: AbortSignal.timeout(10_000) });
    service.kill("SIGTERM");
    await exited;
  }
  await rm(directory, { recursive: true, force: true });
});

describe("Given the self-hosted service CLI", () => {
  it("Then an operator-supplied configuration starts an authenticated service and shuts down cleanly", async () => {
    const configPath = join(directory, "rebyu.config.mjs");
    await writeFile(
      configPath,
      `import { FileReviewRepository } from ${JSON.stringify(repositoryUrl)};
       import { createTokenAuthenticator } from ${JSON.stringify(authenticationUrl)};
       export default {
         port: 0,
         reviews: new FileReviewRepository(${JSON.stringify(directory)}),
         authenticate: createTokenAuthenticator([{
           token: process.env.REBYU_CLI_TOKEN,
           session: {
             scope: { projectId: "delimoov", environment: "staging" },
             reviewer: { id: "operator", name: "Operator" },
             permissions: ["read"],
           },
         }]),
       };`,
    );
    service = spawn("node", [cliPath, configPath], {
      env: { ...process.env, REBYU_CLI_TOKEN: token },
      stdio: "pipe",
    });
    if (!service.stdout) throw new Error("Missing service output");
    const [output] = await once(service.stdout, "data", { signal: AbortSignal.timeout(10_000) });
    const address = /Listening on (127\.0\.0\.1:\d+)/.exec(String(output))?.[1];
    expect(address).toBeDefined();
    const endpoint = `http://${address}/__rebyu/reviews`;
    expect((await fetch(endpoint)).status).toBe(401);
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    const exited = once(service, "exit", { signal: AbortSignal.timeout(10_000) });
    service.kill("SIGTERM");
    expect(await exited).toEqual([0, null]);
  });

  it("Then missing configuration exits unsuccessfully instead of starting an open service", async () => {
    await expect(execute("node", [cliPath, join(directory, "missing.mjs")])).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("Could not start the review service"),
    });
  });
});
