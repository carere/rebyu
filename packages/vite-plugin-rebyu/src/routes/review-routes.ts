import type { ReviewSession } from "../contexts/review/access/review-session";
import type { ReviewRepository } from "../contexts/review/reviews/review-repository";
import {
  decodeScreenshot,
  presentReview,
  type ReviewService,
} from "../contexts/review/reviews/review-service";
import type { ScreenshotRepository } from "../contexts/review/screenshots/screenshot-repository";
import { createSchema, patchSchema } from "../schema";
import { ReviewHttpError, readReviewBody, requirePermission, reviewJson } from "./review-http";

export interface ReviewRouteContext {
  reviews: ReviewRepository;
  screenshots?: ScreenshotRepository;
  service: ReviewService;
  endpoint: string;
  session: ReviewSession;
  captureDiagnostics?: boolean;
}

export async function reviewCollection(request: Request, context: ReviewRouteContext) {
  const { reviews, session, endpoint, service } = context;
  if (request.method === "GET")
    return reviewJson(
      200,
      (await reviews.list(session.scope)).map((review) => presentReview(review, endpoint)),
    );
  if (request.method !== "POST") throw new ReviewHttpError(405, "Method not allowed");
  requirePermission(session, "create");
  const input = createSchema.parse(await readReviewBody(request));
  if (context.captureDiagnostics === false && input.context.errors.length)
    throw new ReviewHttpError(403, "Diagnostic capture is disabled");
  if (input.screenshot && !context.screenshots)
    throw new ReviewHttpError(403, "Screenshot capture is disabled");
  let png: Uint8Array | undefined;
  if (input.screenshot) {
    try {
      png = decodeScreenshot(input.screenshot);
    } catch {
      throw new ReviewHttpError(400, "Invalid PNG screenshot");
    }
  }
  return reviewJson(201, presentReview(await service.create(session, input, png), endpoint));
}

async function screenshotResponse(context: ReviewRouteContext, id: string) {
  const review = await context.reviews.get(context.session.scope, id);
  const png = review?.screenshotKey
    ? await context.screenshots?.get(context.session.scope, review.screenshotKey)
    : null;
  if (!png) throw new ReviewHttpError(404, "Screenshot not found");
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function reviewItem(
  request: Request,
  context: ReviewRouteContext,
  id: string,
  screenshot: boolean,
) {
  const { reviews, session, endpoint } = context;
  if (screenshot) {
    if (request.method !== "GET") throw new ReviewHttpError(405, "Method not allowed");
    return screenshotResponse(context, id);
  }
  if (request.method === "DELETE") {
    requirePermission(session, "delete");
    if (!(await context.service.remove(session.scope, id)))
      throw new ReviewHttpError(404, "Review not found");
    return reviewJson(200, { ok: true });
  }
  if (request.method === "GET") {
    const review = await reviews.get(session.scope, id);
    if (!review) throw new ReviewHttpError(404, "Review not found");
    return reviewJson(200, presentReview(review, endpoint));
  }
  if (request.method !== "PATCH") throw new ReviewHttpError(405, "Method not allowed");
  const patch = patchSchema.parse(await readReviewBody(request));
  if (patch.status) requirePermission(session, "triage");
  if (patch.reply) {
    requirePermission(session, "reply");
    patch.reply = { ...patch.reply, author: session.reviewer.name, authorId: session.reviewer.id };
  }
  const review = await reviews.update(session.scope, id, patch);
  if (!review) throw new ReviewHttpError(404, "Review not found");
  return reviewJson(200, presentReview(review, endpoint));
}
