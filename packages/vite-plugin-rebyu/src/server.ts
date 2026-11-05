import { ZodError } from "zod";
import { type ReviewAuthenticator, validateSession } from "./contexts/review/access/review-session";
import { ReviewService, type ReviewStorageOptions } from "./contexts/review/reviews/review-service";
import { ReviewHttpError, requirePermission, reviewJson } from "./routes/review-http";
import { reviewCollection, reviewItem } from "./routes/review-routes";

export type {
  ReviewAuthenticator,
  ReviewPermission,
  ReviewSession,
} from "./contexts/review/access/review-session";
export {
  createTokenAuthenticator,
  type ReviewToken,
} from "./contexts/review/access/token-authenticator";
export type {
  ReviewPatch,
  ReviewRepository,
  ReviewScope,
  StoredNewReview,
  StoredReview,
} from "./contexts/review/reviews/review-repository";
export type { ScreenshotRepository } from "./contexts/review/screenshots/screenshot-repository";

export interface ReviewHandlerOptions extends ReviewStorageOptions {
  authenticate: ReviewAuthenticator;
  basePath?: string;
  allowedOrigins?: readonly string[];
  captureDiagnostics?: boolean;
}

export function reviewBasePath(basePath = "/__rebyu") {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/?)+$/.test(basePath)) throw new Error("Invalid review basePath.");
  return basePath.replace(/\/$/, "");
}

function verifyOrigin(request: Request, allowedOrigins: readonly string[]) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin && !allowedOrigins.includes(origin))
    throw new ReviewHttpError(403, "Cross-origin requests are not allowed");
}

export function createReviewHandler(options: ReviewHandlerOptions) {
  if (typeof options.authenticate !== "function")
    throw new Error("Review authentication is required.");
  const endpoint = `${reviewBasePath(options.basePath)}/reviews`;
  const report = options.onError ?? ((error: unknown) => console.error("[rebyu]", error));
  const service = new ReviewService({ ...options, onError: report });
  return async (request: Request): Promise<Response> => {
    try {
      const path = new URL(request.url).pathname;
      const item = path.startsWith(`${endpoint}/`) ? path.slice(endpoint.length + 1) : "";
      const match = /^([a-f\d-]{36})(\/screenshot)?$/i.exec(item);
      if (path !== endpoint && !match) return reviewJson(404, { error: "Not found" });
      verifyOrigin(request, options.allowedOrigins ?? []);
      const authenticated = await options.authenticate(request);
      if (!authenticated) return reviewJson(401, { error: "Unauthorized" });
      const session = validateSession(authenticated);
      requirePermission(session, "read");
      const context = { ...options, endpoint, service, session };
      return match
        ? await reviewItem(request, context, match[1], Boolean(match[2]))
        : await reviewCollection(request, context);
    } catch (error) {
      if (error instanceof ZodError) return reviewJson(400, { error: "Invalid review data" });
      if (error instanceof ReviewHttpError)
        return reviewJson(error.status, { error: error.message });
      report(error);
      return reviewJson(500, { error: "Could not process reviews. Check the Rebyu server log." });
    }
  };
}
