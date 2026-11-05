import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  D1ReviewRepository,
  d1ReviewSchema,
} from "../../src/contexts/review/reviews/d1-review-repository";
import type { ReviewScope, StoredNewReview } from "../../src/server";
import { reviewFixture } from "../support/review-fixture";

let emulator: Miniflare;
let repository: D1ReviewRepository;
const scope: ReviewScope = { projectId: "delimoov-console", environment: "pr-89" };
const otherScope: ReviewScope = { ...scope, environment: "staging" };
const input = (number: number): StoredNewReview => {
  const {
    screenshot: _image,
    number: _pin,
    status: _status,
    createdAt: _created,
    replies: _replies,
    ...review
  } = reviewFixture(number);
  return review;
};

beforeEach(async () => {
  emulator = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: "export default { fetch() { return new Response('test'); } };",
      compatibilityDate: "2026-09-15",
      d1Databases: ["REVIEWS"],
    }),
  );
  const database = await emulator.getD1Database("REVIEWS");
  await database.exec(d1ReviewSchema);
  repository = new D1ReviewRepository(database);
});

afterEach(async () => {
  await emulator.dispose();
});

describe("Given independently scoped reviews in real D1", () => {
  describe("When several repository instances create reviews concurrently", () => {
    it("Then retries preserve the winning review and pins are allocated once per scoped UUID", async () => {
      const second = new D1ReviewRepository(await emulator.getD1Database("REVIEWS"));
      const records = await Promise.all([
        repository.create(scope, input(1)),
        second.create(scope, { ...input(1), message: "Retry" }),
        repository.create(scope, input(2)),
        second.create(scope, input(3)),
      ]);
      expect(records[0]).toEqual(records[1]);
      expect((await repository.list(scope)).map((review) => review.number)).toEqual([1, 2, 3]);
      expect((await second.get(scope, input(1).id))?.status).toBe("open");
    });
  });

  describe("When the same UUID appears in another project or environment", () => {
    it("Then all read and mutation operations remain confined to their authenticated scope", async () => {
      await repository.create(scope, input(1));
      for (const alternate of [otherScope, { ...scope, projectId: "delimoov-storefront" }]) {
        expect(await repository.list(alternate)).toEqual([]);
        expect(await repository.get(alternate, input(1).id)).toBeNull();
        expect(await repository.update(alternate, input(1).id, { status: "resolved" })).toBeNull();
        expect(await repository.remove(alternate, input(1).id)).toBe(false);
        expect((await repository.create(alternate, input(1))).number).toBe(1);
      }
      expect((await repository.get(scope, input(1).id))?.status).toBe("open");
    });
  });

  describe("When replies and status changes are retried concurrently", () => {
    it("Then replies append once without losing another reply or a status change", async () => {
      await repository.create(scope, input(1));
      const reply = {
        id: crypto.randomUUID(),
        author: "Agent",
        authorId: "agent",
        message: "Fixed",
      };
      const otherReply = { ...reply, id: crypto.randomUUID(), message: "Verified" };
      await Promise.all([
        repository.update(scope, input(1).id, { reply }),
        repository.update(scope, input(1).id, { reply, status: "in-progress" }),
        repository.update(scope, input(1).id, { reply: otherReply }),
      ]);
      const review = await repository.get(scope, input(1).id);
      expect(review?.status).toBe("in-progress");
      expect(review?.replies).toHaveLength(2);
      expect(review?.replies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ...reply, createdAt: expect.any(String) }),
          expect.objectContaining({ ...otherReply, createdAt: expect.any(String) }),
        ]),
      );
    });
  });

  describe("When the highest-numbered review is deleted", () => {
    it("Then the sequence survives deletion and a new repository instance", async () => {
      await repository.create(scope, input(1));
      expect((await repository.create(scope, input(2))).number).toBe(2);
      expect(await repository.remove(scope, input(2).id)).toBe(true);
      repository = new D1ReviewRepository(await emulator.getD1Database("REVIEWS"));
      expect((await repository.create(scope, input(3))).number).toBe(3);
      expect(await repository.remove(scope, input(2).id)).toBe(false);
    });
  });
});
