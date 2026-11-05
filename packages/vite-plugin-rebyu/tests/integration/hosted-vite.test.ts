import { access, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build, createServer, type ViteDevServer } from "vite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileReviewRepository } from "../../dist/file-review-repository.js";
import rebyu from "../../dist/index.js";
import { startRebyuServer } from "../../dist/node.js";
import { createTokenAuthenticator } from "../../dist/server.js";
import { reviewFixture } from "../support/review-fixture";

let directory: string;
let vite: ViteDevServer | undefined;
let backend: Server | undefined;
const token = "a-private-proxy-token-with-at-least-32-characters";

beforeEach(async () => {
  directory = await realpath(await mkdtemp(join(tmpdir(), "rebyu-hosted-vite-")));
  await writeFile(
    join(directory, "index.html"),
    "<html><head></head><body><h1>Preview</h1></body></html>",
  );
  vite = undefined;
  backend = undefined;
});

afterEach(async () => {
  await vite?.close();
  if (backend) {
    backend.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      backend?.close((error) => (error ? reject(error) : resolve())),
    );
  }
  await rm(directory, { recursive: true, force: true });
});

describe("Given a Vite app connected to its independently deployed backend", () => {
  it("Then same-origin requests use that backend without creating local review storage", async () => {
    backend = await startRebyuServer({
      port: 0,
      basePath: "/feedback",
      reviews: new FileReviewRepository(join(directory, "data")),
      authenticate: createTokenAuthenticator([
        {
          token,
          session: {
            scope: { projectId: "delimoov-console", environment: "staging" },
            reviewer: { id: "reviewer", name: "Reviewer" },
            permissions: ["read", "create"],
          },
        },
      ]),
    });
    const address = backend.address();
    if (!address || typeof address === "string") throw new Error("Missing backend address");
    vite = await createServer({
      configFile: false,
      root: directory,
      logLevel: "silent",
      plugins: [rebyu({ endpoint: "/feedback/reviews", projectId: "delimoov-console:staging" })],
      server: {
        port: 0,
        host: "127.0.0.1",
        proxy: {
          "/feedback": {
            target: `http://127.0.0.1:${address.port}`,
            headers: { Authorization: `Bearer ${token}` },
          },
        },
      },
    });
    await vite.listen();
    const origin = vite.resolvedUrls?.local[0];
    if (!origin) throw new Error("Missing Vite address");
    const html = await (await fetch(origin)).text();
    expect(html).toContain('"endpoint":"/feedback/reviews"');
    expect(html).not.toContain(token);
    const response = await fetch(`${origin}feedback/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewFixture(1)),
    });
    expect(response.status).toBe(201);
    expect((await response.json()).authorId).toBe("reviewer");
    expect(await (await fetch(`${origin}feedback/reviews`)).json()).toHaveLength(1);
    expect((await fetch(`${origin}__rebyu/client.js`)).status).toBe(200);
    expect((await fetch(`${origin}__rebyu/reviews`)).status).toBe(404);
    await expect(access(join(directory, ".rebyu/reviews.json"))).rejects.toThrow();
  });
});

describe("Given explicitly enabled hosted review injection in production", () => {
  it("Then the build includes an isolated widget asset and only public connection settings", async () => {
    const result = await build({
      configFile: false,
      root: directory,
      base: "/staging/",
      logLevel: "silent",
      plugins: [
        rebyu({
          production: true,
          endpoint: "/feedback/reviews",
          projectId: "delimoov-console:staging",
        }),
      ],
      build: { write: false, assetsDir: "nested/assets" },
    });
    const results = Array.isArray(result) ? result : [result];
    const output = results.flatMap((entry) => ("output" in entry ? entry.output : []));
    const html = output.find((entry) => entry.fileName === "index.html");
    const widget = output.find((entry) => entry.fileName === "nested/assets/rebyu-client.js");
    expect(html && "source" in html ? String(html.source) : "").toContain(
      "/staging/nested/assets/rebyu-client.js",
    );
    expect(widget && "source" in widget ? String(widget.source).length : 0).toBeGreaterThan(10_000);
    expect(html && "source" in html ? String(html.source) : "").toContain(
      '"endpoint":"/feedback/reviews"',
    );
  });

  it("Then production injection cannot silently fall back to an unauthenticated local API", () => {
    expect(() => rebyu({ production: true })).toThrow("hosted endpoint");
    expect(() => rebyu({ endpoint: "/feedback/reviews" })).toThrow("stable projectId");
    expect(() => rebyu({ endpoint: "https://elsewhere.test/reviews", projectId: "test" })).toThrow(
      "same-origin",
    );
    expect(() => rebyu({ endpoint: "/\\elsewhere.test/reviews", projectId: "test" })).toThrow(
      "same-origin",
    );
    expect(() => rebyu({ endpoint: "/feedback/../reviews", projectId: "test" })).toThrow(
      "same-origin",
    );
    expect(() => rebyu({ enabled: false, production: true })).not.toThrow();
  });
});

describe("Given the runtime-neutral HTTP handler", () => {
  it("Then the public server entry bundles for Web runtimes without Node or Vite shims", async () => {
    const result = await build({
      configFile: false,
      logLevel: "silent",
      build: {
        write: false,
        minify: false,
        lib: {
          entry: fileURLToPath(new URL("../../src/server.ts", import.meta.url)),
          formats: ["es"],
        },
      },
    });
    const results = Array.isArray(result) ? result : [result];
    const chunks = results.flatMap((entry) => ("output" in entry ? entry.output : []));
    const source = chunks.map((chunk) => ("code" in chunk ? chunk.code : "")).join("\n");
    expect(source).toContain("createReviewHandler");
    expect(source).not.toMatch(/node:|__vite-browser-external|from ["']vite["']/);
  });
});
