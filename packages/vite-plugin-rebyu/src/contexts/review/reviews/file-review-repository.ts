import { resolve } from "node:path";
import { ReviewStore } from "../../../store";
import {
  type ReviewPatch,
  type ReviewRepository,
  type ReviewScope,
  reviewScopeSchema,
  type StoredNewReview,
  type StoredReview,
} from "./review-repository";

export class FileReviewRepository implements ReviewRepository {
  private readonly stores = new Map<string, ReviewStore>();
  constructor(private readonly directory: string) {}

  private store(scope: ReviewScope) {
    const { projectId, environment } = reviewScopeSchema.parse(scope);
    const file = resolve(this.directory, projectId, environment, "reviews.json");
    let store = this.stores.get(file);
    if (!store) {
      store = new ReviewStore(file);
      this.stores.set(file, store);
    }
    return store;
  }

  async list(scope: ReviewScope): Promise<StoredReview[]> {
    return this.store(scope).list();
  }

  async get(scope: ReviewScope, id: string): Promise<StoredReview | null> {
    return (await this.list(scope)).find((review) => review.id === id) ?? null;
  }

  async create(scope: ReviewScope, input: StoredNewReview): Promise<StoredReview> {
    return this.store(scope).create(input);
  }

  async update(scope: ReviewScope, id: string, patch: ReviewPatch): Promise<StoredReview | null> {
    return this.store(scope).update(id, patch);
  }

  async remove(scope: ReviewScope, id: string) {
    return this.store(scope).remove(id);
  }
}
