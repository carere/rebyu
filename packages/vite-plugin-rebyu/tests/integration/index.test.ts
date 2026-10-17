import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import rebyu from "../../dist/index.js";
import type { NewReview } from "../../src/schema";

function fixture(): NewReview {
  return {
    id: crypto.randomUUID(),
    page: "/",
    author: "Kevin",
    authorId: "kevin",
    message: "Give this some room",
    category: "feedback",
    anchor: {
      selector: "#hero",
      xpath: "/html[1]/body[1]/h1[1]",
      text: "Hello",
      tag: "h1",
      kind: "element",
      rect: { x: 10, y: 20, width: 100, height: 50 },
      offset: { x: 0, y: 0 },
      size: { x: 1, y: 1 },
      points: [],
    },
    context: { viewport: "1440 × 900", userAgent: "test", errors: [] },
  };
}
let server: ViteDevServer, dir: string, url: string;
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "rebyu-vite-"));
  await writeFile(join(dir, "index.html"), "<html><head></head><body><h1>Hello</h1></body></html>");
  server = await createServer({
    configFile: false,
    root: dir,
    base: "/nested/",
    plugins: [rebyu({ projectName: "Test </script>" })],
    server: { port: 0, host: "127.0.0.1" },
  });
  await server.listen();
  const localUrl = server.resolvedUrls?.local[0];
  if (!localUrl) throw new Error("Vite did not expose a local URL");
  url = localUrl;
});
afterAll(async () => {
  await server?.close();
  await rm(dir, { recursive: true, force: true });
});
describe("Vite integration", () => {
  it("injects under the Vite base, escapes config, and serves the precompiled framework independent widget", async () => {
    const html = await (await fetch(url)).text();
    expect(html).toContain("/nested/__rebyu/client.js");
    expect(html.indexOf("window.rebyu")).toBeLessThan(html.indexOf("/nested/__rebyu/client.js"));
    expect(html).toContain("Test \\u003c/script>");
    expect(html).not.toContain("Test </script>");
    const widget = await fetch(`${url}__rebyu/client.js`);
    expect(widget.status).toBe(200);
    expect(widget.headers.get("content-type")).toContain("javascript");
    expect((await widget.text()).length).toBeGreaterThan(10000);
  });
  it("supports creating, updating, replying, and deleting through HTTP", async () => {
    const endpoint = `${url}__rebyu/reviews`;
    const created = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fixture()),
    });
    expect(created.status).toBe(201);
    const review = await created.json();
    expect(review.authorId).toBe("kevin");
    expect(await (await fetch(endpoint)).json()).toHaveLength(1);
    const replied = await fetch(`${endpoint}/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: { id: crypto.randomUUID(), author: "Alice", authorId: "alice", message: "Done" },
      }),
    });
    expect((await replied.json()).replies[0].authorId).toBe("alice");
    const updated = await fetch(`${endpoint}/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    expect((await updated.json()).status).toBe("resolved");
    expect((await fetch(`${endpoint}/${review.id}`, { method: "DELETE" })).status).toBe(200);
    expect(await (await fetch(endpoint)).json()).toEqual([]);
  });
});
describe("Vite API boundaries", () => {
  it("rejects malformed input, cross-origin calls, and raw access to review files", async () => {
    const endpoint = `${url}__rebyu/reviews`;
    expect(
      (
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status,
    ).toBe(400);
    expect((await fetch(endpoint, { method: "POST", body: "{}" })).status).toBe(415);
    expect(
      (
        await fetch(endpoint, {
          headers: { Origin: "https://elsewhere.example" },
        })
      ).status,
    ).toBe(403);
    expect((await fetch(`${url}.rebyu/reviews.json`)).status).toBe(403);
    expect((await fetch(`${url}@fs${dir}/.rebyu/reviews.json`)).status).toBe(403);
  });
  it("has no production injection", async () => {
    const result = await build({
      configFile: false,
      root: dir,
      plugins: [rebyu()],
      build: { write: false },
      logLevel: "silent",
    });
    const outputs = Array.isArray(result) ? result : [result];
    const html = outputs
      .flatMap((x) => ("output" in x ? x.output : []))
      .find((x) => x.fileName === "index.html");
    const output = html && "source" in html ? String(html.source) : "";
    expect(output).not.toContain("__rebyu");
    expect(output).not.toContain("window.rebyu");
  });
});

describe("Given the plugin is disabled", () => {
  it("Then neither the identity API nor the widget is injected", async () => {
    const disabled = await createServer({
      configFile: false,
      root: dir,
      plugins: [rebyu({ enabled: false })],
      server: { watch: null },
    });
    try {
      const html = await disabled.transformIndexHtml(
        "/",
        "<html><head></head><body></body></html>",
      );
      expect(html).not.toContain("window.rebyu");
      expect(html).not.toContain("__rebyu");
    } finally {
      await disabled.close();
    }
  });
});
