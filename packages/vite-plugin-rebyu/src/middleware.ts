import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Logger } from "vite";
import { ZodError } from "zod";
import { type ClientConfig, createSchema } from "./schema";
import type { ReviewStore } from "./store";

function json(res: ServerResponse, status: number, value: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
}
async function body(req: IncomingMessage) {
  if (!req.headers["content-type"]?.startsWith("application/json"))
    throw Object.assign(new Error("Expected application/json"), { status: 415 });
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 3_500_000) throw Object.assign(new Error("Request too large"), { status: 413 });
    chunks.push(Buffer.from(chunk));
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw Object.assign(new Error("Invalid JSON"), { status: 400 });
  }
}
async function collection(req: IncomingMessage, res: ServerResponse, store: ReviewStore) {
  if (req.method === "GET") return json(res, 200, await store.list());
  if (req.method === "POST")
    return json(res, 201, await store.create(createSchema.parse(await body(req))));
  return json(res, 405, { error: "Method not allowed" });
}
async function item(req: IncomingMessage, res: ServerResponse, store: ReviewStore, id: string) {
  if (req.method === "PATCH") {
    const review = await store.update(id, await body(req));
    return json(res, review ? 200 : 404, review ?? { error: "Review not found" });
  }
  if (req.method === "DELETE") {
    const removed = await store.remove(id);
    return json(res, removed ? 200 : 404, { ok: removed });
  }
  return json(res, 405, { error: "Method not allowed" });
}
async function route(
  req: IncomingMessage,
  res: ServerResponse,
  config: ClientConfig,
  store: ReviewStore,
  path: string,
) {
  // Browser callers must be same-origin; JSON-only mutations also reject form CSRF.
  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host)
    return json(res, 403, { error: "Cross-origin requests are not allowed" });
  if (path === config.clientUrl && req.method === "GET") {
    const source = await readFile(new URL("./client/client.js", import.meta.url), "utf8");
    res.setHeader("Content-Type", "text/javascript");
    res.setHeader("Cache-Control", "no-cache");
    res.end(source);
    return;
  }
  if (path === config.endpoint) return collection(req, res, store);
  const id = path.startsWith(`${config.endpoint}/`) ? path.slice(config.endpoint.length + 1) : "";
  if (/^[a-f\d-]{36}$/i.test(id)) return item(req, res, store, id);
  return json(res, 404, { error: "Not found" });
}
function failure(error: unknown, res: ServerResponse, logger: Logger) {
  if (error instanceof ZodError)
    return json(res, 400, { error: "Invalid review data", issues: error.issues });
  const status = (error as { status?: number }).status ?? 500;
  if (status === 500) logger.error(`[rebyu] ${String(error)}`);
  json(res, status, {
    error:
      status === 500
        ? "Could not save reviews. Check the Vite server log."
        : (error as Error).message,
  });
}
export function reviewMiddleware(
  config: ClientConfig,
  store: ReviewStore,
  logger: Logger,
): Connect.NextHandleFunction {
  const prefix = config.clientUrl.slice(0, config.clientUrl.lastIndexOf("/") + 1);
  return async (req, res, next) => {
    const path = req.url?.split("?")[0];
    if (!path?.startsWith(prefix)) return next();
    try {
      await route(req, res, config, store, path);
    } catch (error) {
      failure(error, res, logger);
    }
  };
}
