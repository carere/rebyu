import { z } from "zod";
import { type ReviewScope, reviewScopeSchema } from "../reviews/review-repository";

export function screenshotPath(scope: ReviewScope, key: string) {
  const { projectId, environment } = reviewScopeSchema.parse(scope);
  return `${projectId}/${environment}/${z.uuid().parse(key)}.png`;
}
