import type { ReviewScope } from "../reviews/review-repository";

export interface ScreenshotRepository {
  put(scope: ReviewScope, key: string, png: Uint8Array): Promise<void>;
  get(scope: ReviewScope, key: string): Promise<Uint8Array | null>;
  remove(scope: ReviewScope, key: string): Promise<void>;
}
