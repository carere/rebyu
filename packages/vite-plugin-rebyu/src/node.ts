import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createReviewHandler, type ReviewHandlerOptions, reviewBasePath } from "./server";

export interface RebyuServerOptions extends ReviewHandlerOptions {
  hostname?: string;
  port?: number;
}

function webRequest(request: IncomingMessage) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(name, entry);
    } else if (value !== undefined) headers.set(name, value);
  }
  const controller = new AbortController();
  request.once("aborted", () => controller.abort());
  const init: RequestInit & { duplex: "half" } = {
    method: request.method,
    headers,
    signal: controller.signal,
    duplex: "half",
  };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = requestBody(request);
  return new Request(
    new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`),
    init,
  );
}

function requestBody(request: IncomingMessage) {
  const iterator = request.iterator({ destroyOnReturn: false });
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const result = await iterator.next();
      if (result.done) controller.close();
      else controller.enqueue(new Uint8Array(result.value));
    },
    async cancel() {
      await iterator.return?.();
      request.resume();
    },
  });
}

async function respond(
  request: IncomingMessage,
  response: ServerResponse,
  handler: (request: Request) => Promise<Response>,
  widgetPath: string,
) {
  const incoming = webRequest(request);
  const result =
    new URL(incoming.url).pathname === widgetPath && request.method === "GET"
      ? new Response(await readFile(new URL("./client/client.js", import.meta.url)), {
          headers: {
            "Content-Type": "text/javascript",
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff",
          },
        })
      : await handler(incoming);
  await incoming.body?.cancel().catch(() => {});
  response.writeHead(result.status, Object.fromEntries(result.headers));
  response.end(new Uint8Array(await result.arrayBuffer()));
}

export async function startRebyuServer(options: RebyuServerOptions) {
  const handler = createReviewHandler(options);
  const widgetPath = `${reviewBasePath(options.basePath)}/client.js`;
  const server = createServer((request, response) => {
    void respond(request, response, handler, widgetPath).catch((error: unknown) => {
      (options.onError ?? console.error)(error);
      if (!response.headersSent) response.writeHead(500, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Could not process the review request." }));
    });
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 3001, options.hostname ?? "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  return server;
}
