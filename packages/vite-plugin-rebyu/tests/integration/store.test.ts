import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { NewReview } from "../../src/schema";
import { ReviewStore } from "../../src/store";

const dirs: string[] = [];
async function setup() {
  const dir = await mkdtemp(join(tmpdir(), "rebyu-test-"));
  dirs.push(dir);
  const file = join(dir, "reviews.json");
  return { store: new ReviewStore(file), file };
}
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});
function fixture(): NewReview {
  return {
    id: crypto.randomUUID(),
    page: "/",
    author: "Kevin",
    message: "Give this some room",
    category: "feedback",
    anchor: {
      selector: "#hero",
      xpath: "/html[1]/body[1]/h1[1]",
      text: "Hello",
      tag: "h1",
      kind: "element",
      rect: { x: 10, y: 20, width: 100, height: 50 },
      offset: { x: 0, y: 0 },
      size: { x: 1, y: 1 },
      points: [],
    },
    context: { viewport: "1440 × 900", userAgent: "test", errors: [] },
  };
}
describe("durable reviews", () => {
  it("serializes concurrent writes and makes network retries idempotent", async () => {
    const { store, file } = await setup();
    const input = fixture();
    const [a, b, c] = await Promise.all([
      store.create(input),
      store.create(input),
      store.create(fixture()),
    ]);
    expect(a.id).toBe(b.id);
    expect(c.number).toBe(2);
    expect(await new ReviewStore(file).list()).toHaveLength(2);
  });
  it("never reuses a deleted pin number", async () => {
    const { store } = await setup();
    const a = await store.create(fixture());
    await store.remove(a.id);
    expect((await store.create(fixture())).number).toBe(2);
  });
  it("persists status and idempotent replies", async () => {
    const { store } = await setup();
    const review = await store.create(fixture());
    const reply = { id: crypto.randomUUID(), author: "Alex", message: "On it" };
    await Promise.all([
      store.update(review.id, { status: "resolved", reply }),
      store.update(review.id, { reply }),
    ]);
    const [saved] = await store.list();
    expect(saved.status).toBe("resolved");
    expect(saved.replies).toHaveLength(1);
    expect(await store.update(crypto.randomUUID(), { status: "open" })).toBeNull();
  });
  it("rejects invalid data without touching storage", async () => {
    const { store } = await setup();
    expect(() => store.create({ ...fixture(), message: "   " })).toThrow();
    expect(await store.list()).toEqual([]);
  });
  it("does not overwrite corrupt storage and recovers after it is repaired", async () => {
    const { store, file } = await setup();
    await writeFile(file, "broken");
    await expect(store.create(fixture())).rejects.toThrow();
    expect(await readFile(file, "utf8")).toBe("broken");
    await writeFile(file, JSON.stringify({ version: 1, nextNumber: 1, reviews: [] }));
    await store.create(fixture());
    expect(await store.list()).toHaveLength(1);
  });
});

describe("Given identified reviewers in persistent storage", () => {
  it("Then user IDs survive reopening the store alongside legacy records", async () => {
    const { store, file } = await setup();
    const review = await store.create({ ...fixture(), authorId: "kevin" });
    await store.create(fixture());
    await store.update(review.id, {
      reply: { id: crypto.randomUUID(), author: "Alice", authorId: "alice", message: "Updated" },
    });
    const saved = await new ReviewStore(file).list();
    const identified = saved.find((item) => item.id === review.id);
    expect(identified?.authorId).toBe("kevin");
    expect(identified?.replies[0].authorId).toBe("alice");
    expect(saved.find((item) => item.id !== review.id)?.authorId).toBeUndefined();
  });
});
