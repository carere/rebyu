import type { ReviewPermission, ReviewSession } from "../contexts/review/access/review-session";

export class ReviewHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function reviewJson(status: number, value: unknown) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function requirePermission(session: ReviewSession, permission: ReviewPermission) {
  if (!session.permissions.includes(permission)) throw new ReviewHttpError(403, "Forbidden");
}

export async function readReviewBody(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json"
  )
    throw new ReviewHttpError(415, "Expected application/json");
  const reader = request.body?.getReader();
  if (!reader) throw new ReviewHttpError(400, "Invalid JSON");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.byteLength;
      if (size > 3_500_000) {
        await reader.cancel();
        throw new ReviewHttpError(413, "Request too large");
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ReviewHttpError(400, "Invalid JSON");
  }
}
