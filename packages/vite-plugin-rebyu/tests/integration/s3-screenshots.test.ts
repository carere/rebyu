import { createServer, type Server } from "node:http";
import { S3Client } from "@aws-sdk/client-s3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { S3ScreenshotRepository } from "../../src/contexts/review/screenshots/s3-screenshot-repository";
import { reviewFixture } from "../support/review-fixture";

let server: Server;
let client: S3Client;
let repository: S3ScreenshotRepository;
let requests: {
  method?: string;
  path?: string;
  authorization?: string;
  body: Buffer;
  contentType?: string;
}[];
let status: number;
const scope = { projectId: "delimoov-console", environment: "pr-42" };
const key = "00000000-0000-4000-8000-000000000002";
const png = Buffer.from((reviewFixture(2).screenshot ?? "").split(",")[1], "base64");

beforeEach(async () => {
  requests = [];
  status = 200;
  server = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    requests.push({
      method: request.method,
      path: request.url,
      authorization: request.headers.authorization,
      contentType: request.headers["content-type"],
      body: Buffer.concat(chunks),
    });
    response.statusCode = status;
    if (status >= 400) {
      response.setHeader("Content-Type", "application/xml");
      response.end(`<Error><Code>${status === 404 ? "NoSuchKey" : "AccessDenied"}</Code></Error>`);
    } else if (request.method === "GET") {
      response.setHeader("Content-Type", "image/png");
      response.end(png);
    } else response.end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing S3 test address");
  client = new S3Client({
    endpoint: `http://127.0.0.1:${address.port}`,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId: "test-access-key", secretAccessKey: "test-secret-key" },
    requestChecksumCalculation: "WHEN_REQUIRED",
    maxAttempts: 1,
  });
  repository = new S3ScreenshotRepository({ client, bucket: "screenshots", prefix: "rebyu/" });
});

afterEach(async () => {
  client?.destroy();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

describe("Given an S3-compatible screenshot adapter", () => {
  it("Then uploads are signed and separated by project, environment, and object key", async () => {
    await repository.put(scope, key, png);
    expect(requests[0]).toMatchObject({
      method: "PUT",
      path: `/screenshots/rebyu/delimoov-console/pr-42/${key}.png?x-id=PutObject`,
      contentType: "image/png",
      body: png,
    });
    expect(requests[0].authorization).toContain("AWS4-HMAC-SHA256");
    expect(requests[0].authorization).toContain("Credential=test-access-key/");
  });

  it("Then private image bytes can be read and objects can be deleted", async () => {
    expect(await repository.get(scope, key)).toEqual(new Uint8Array(png));
    await repository.remove(scope, key);
    expect(requests.map((request) => request.method)).toEqual(["GET", "DELETE"]);
  });

  it("Then absent objects return null, but provider failures remain errors", async () => {
    status = 404;
    expect(await repository.get(scope, key)).toBeNull();
    status = 403;
    await expect(repository.get(scope, key)).rejects.toThrow();
  });

  it("Then invalid object references cannot cross storage scopes", async () => {
    await expect(
      repository.put({ ...scope, environment: "../staging" }, key, png),
    ).rejects.toThrow();
    await expect(repository.get(scope, "../../other")).rejects.toThrow();
    expect(requests).toEqual([]);
  });
});
