import { z } from "zod";
import type { NewReview, patchSchema, Review } from "../../../schema";

const scopePart = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,99}$/);
export const reviewScopeSchema = z.object({ projectId: scopePart, environment: scopePart });
export type ReviewScope = z.infer<typeof reviewScopeSchema>;
export type StoredNewReview = Omit<NewReview, "screenshot"> & { screenshotKey?: string };
export type StoredReview = Omit<Review, "screenshot"> & { screenshotKey?: string };
export type ReviewPatch = z.infer<typeof patchSchema>;

export interface ReviewRepository {
  list(scope: ReviewScope): Promise<StoredReview[]>;
  get(scope: ReviewScope, id: string): Promise<StoredReview | null>;
  create(scope: ReviewScope, input: StoredNewReview): Promise<StoredReview>;
  update(scope: ReviewScope, id: string, patch: ReviewPatch): Promise<StoredReview | null>;
  remove(scope: ReviewScope, id: string): Promise<boolean>;
}
