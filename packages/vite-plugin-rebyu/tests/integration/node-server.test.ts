import { mkdtemp, rm } from "node:fs/promises";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileReviewRepository } from "../../dist/file-review-repository.js";
import { startRebyuServer } from "../../dist/node.js";
import { createTokenAuthenticator } from "../../dist/server.js";
import { reviewFixture } from "../support/review-fixture";

let directory: string;
let server: Server;
let origin: string;
const token = "a-private-server-token-with-at-least-32-characters";

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "rebyu-node-"));
  server = await startRebyuServer({
    reviews: new FileReviewRepository(directory),
    port: 0,
    basePath: "/feedback",
    authenticate: createTokenAuthenticator([
      {
        token,
        session: {
          scope: { projectId: "delimoov", environment: "staging" },
          reviewer: { id: "operator", name: "Operator" },
          permissions: ["read", "create"],
        },
      },
    ]),
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing review server address");
  origin = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await rm(directory, { recursive: true, force: true });
});

describe("Given the independently deployable Node service", () => {
  it("Then real HTTP requests require authentication and persist through the configured adapter", async () => {
    const endpoint = `${origin}/feedback/reviews`;
    expect((await fetch(endpoint)).status).toBe(401);
    const created = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(reviewFixture(1)),
    });
    expect(created.status).toBe(201);
    const listed = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    expect(await listed.json()).toHaveLength(1);
  });

  it("Then the standalone widget is served without embedding server secrets", async () => {
    const widget = await fetch(`${origin}/feedback/client.js`);
    expect(widget.headers.get("content-type")).toContain("javascript");
    const source = await widget.text();
    expect(source.length).toBeGreaterThan(10_000);
    expect(source).not.toContain(token);
    expect(source).not.toContain("@aws-sdk");
    expect((await fetch(`${origin}/.rebyu/reviews.json`)).status).toBe(404);
  });

  it("Then oversized HTTP bodies receive an error without resetting the connection", async () => {
    const response = await fetch(`${origin}/feedback/reviews`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "a".repeat(3_500_001) }),
    });
    expect(response.status).toBe(413);
  });
});
