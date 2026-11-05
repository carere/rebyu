import type { NewReview, Review } from "../../../schema";
import type { ReviewSession } from "../access/review-session";
import type { ScreenshotRepository } from "../screenshots/screenshot-repository";
import type { ReviewRepository, ReviewScope, StoredReview } from "./review-repository";

export interface ReviewStorageOptions {
  reviews: ReviewRepository;
  screenshots?: ScreenshotRepository;
  onError?: (error: unknown) => void;
}

export function presentReview(review: StoredReview, endpoint: string): Review {
  const { screenshotKey, ...fields } = review;
  return {
    ...fields,
    screenshot: screenshotKey ? `${endpoint}/${review.id}/screenshot` : undefined,
  };
}

export function decodeScreenshot(data: string) {
  let binary: string;
  try {
    binary = atob(data.slice("data:image/png;base64,".length));
  } catch {
    throw new Error("Invalid PNG screenshot");
  }
  const png = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (signature.some((byte, index) => png[index] !== byte))
    throw new Error("Invalid PNG screenshot");
  return png;
}

export class ReviewService {
  constructor(private readonly storage: ReviewStorageOptions) {}

  private async discard(scope: ReviewScope, key: string) {
    try {
      await this.storage.screenshots?.remove(scope, key);
    } catch (cause) {
      this.storage.onError?.(new Error(`Could not remove screenshot ${key}.`, { cause }));
    }
  }

  async create(session: ReviewSession, input: NewReview, png?: Uint8Array) {
    const existing = await this.storage.reviews.get(session.scope, input.id);
    if (existing) return existing;
    const { screenshot: _screenshot, ...fields } = input;
    const screenshotKey = png ? crypto.randomUUID() : undefined;
    if (png && screenshotKey)
      await this.storage.screenshots?.put(session.scope, screenshotKey, png);
    const saved = await this.storage.reviews.create(session.scope, {
      ...fields,
      author: session.reviewer.name,
      authorId: session.reviewer.id,
      ...(screenshotKey ? { screenshotKey } : {}),
    });
    if (screenshotKey && saved.screenshotKey !== screenshotKey)
      await this.discard(session.scope, screenshotKey);
    return saved;
  }

  async remove(scope: ReviewScope, id: string) {
    const existing = await this.storage.reviews.get(scope, id);
    if (!existing || !(await this.storage.reviews.remove(scope, id))) return false;
    if (existing.screenshotKey) await this.discard(scope, existing.screenshotKey);
    return true;
  }
}
