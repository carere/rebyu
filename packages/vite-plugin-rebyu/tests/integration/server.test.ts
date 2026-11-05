import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FileReviewRepository } from "../../src/contexts/review/reviews/file-review-repository";
import { FileScreenshotRepository } from "../../src/contexts/review/screenshots/file-screenshot-repository";
import {
  createReviewHandler,
  createTokenAuthenticator,
  type ReviewRepository,
  type ReviewSession,
} from "../../src/server";
import { reviewFixture } from "../support/review-fixture";

let directory: string;
let reviews: FileReviewRepository;
let screenshots: FileScreenshotRepository;
let session: ReviewSession;
let handler: ReturnType<typeof createReviewHandler>;
const token = "a-private-server-token-with-at-least-32-characters";
const pngData = reviewFixture(2).screenshot ?? "";

function send(method = "GET", data?: unknown, path = "", headers: Record<string, string> = {}) {
  return handler(
    new Request(`https://review.test/__rebyu/reviews${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...headers },
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  );
}

function configure(capture = true) {
  handler = createReviewHandler({
    reviews,
    screenshots: capture ? screenshots : undefined,
    authenticate: createTokenAuthenticator([{ token, session }]),
    onError: vi.fn(),
  });
}

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "rebyu-hosted-"));
  reviews = new FileReviewRepository(join(directory, "reviews"));
  screenshots = new FileScreenshotRepository(join(directory, "screenshots"));
  session = {
    scope: { projectId: "delimoov-console", environment: "pr-42" },
    reviewer: { id: "trusted-reviewer", name: "Trusted Reviewer" },
    permissions: ["read", "create", "reply", "triage", "delete"],
  };
  configure();
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("Given an authenticated self-hosted review service", () => {
  describe("When reviews and replies are submitted", () => {
    it("Then persisted authors come from authentication, not client payloads", async () => {
      const created = await send("POST", reviewFixture(1));
      expect(created.status).toBe(201);
      const review = await created.json();
      expect(review.authorId).toBe(session.reviewer.id);
      expect(review.author).toBe(session.reviewer.name);
      const replied = await send(
        "PATCH",
        {
          reply: {
            id: crypto.randomUUID(),
            author: "Forged",
            authorId: "forged",
            message: "Fixed",
          },
        },
        `/${review.id}`,
      );
      expect((await replied.json()).replies[0]).toMatchObject({
        author: session.reviewer.name,
        authorId: session.reviewer.id,
      });
      expect((await (await send("GET", undefined, `/${review.id}`)).json()).replies).toHaveLength(
        1,
      );
    });

    it("Then concurrent retries keep one review and monotonically increasing pin numbers", async () => {
      const input = reviewFixture(1);
      const responses = await Promise.all([send("POST", input), send("POST", input)]);
      expect(responses.every((response) => response.status === 201)).toBe(true);
      expect(await (await send()).json()).toHaveLength(1);
      await send("DELETE", undefined, `/${input.id}`);
      expect((await (await send("POST", reviewFixture(3))).json()).number).toBe(2);
    });
  });
});

describe("Given an authenticated agent", () => {
  describe("When it has read, reply, and triage permissions", () => {
    beforeEach(async () => {
      await send("POST", reviewFixture(1));
      session = {
        ...session,
        reviewer: { id: "agent", name: "Agent" },
        permissions: ["read", "reply", "triage"],
      };
      configure();
    });

    it("Then it can read and resolve feedback but cannot create or delete it", async () => {
      const [review] = await (await send()).json();
      expect((await send("PATCH", { status: "resolved" }, `/${review.id}`)).status).toBe(200);
      expect((await send("POST", reviewFixture(3))).status).toBe(403);
      expect((await send("DELETE", undefined, `/${review.id}`)).status).toBe(403);
      expect(await (await send()).json()).toHaveLength(1);
    });

    it("Then adding an unauthorized change rejects the entire patch", async () => {
      session.permissions = ["read", "reply"];
      configure();
      const response = await send(
        "PATCH",
        {
          status: "resolved",
          reply: { id: crypto.randomUUID(), author: "Agent", message: "Done" },
        },
        `/${reviewFixture(1).id}`,
      );
      expect(response.status).toBe(403);
      const [review] = await (await send()).json();
      expect(review.status).toBe("open");
      expect(review.replies).toEqual([]);
    });
  });
});

describe("Given an independently persisted review scope", () => {
  describe("When requests target other projects or environments", () => {
    it("Then read, mutation, and screenshot access stay isolated, including after service restart", async () => {
      const original = reviewFixture(2);
      await send("POST", original);
      for (const scope of [
        { projectId: "another-project", environment: "pr-42" },
        { projectId: "delimoov-console", environment: "staging" },
      ]) {
        session = { ...session, scope };
        configure();
        expect(await (await send()).json()).toEqual([]);
        expect((await send("PATCH", { status: "resolved" }, `/${original.id}`)).status).toBe(404);
        expect((await send("DELETE", undefined, `/${original.id}`)).status).toBe(404);
        expect((await send("GET", undefined, `/${original.id}/screenshot`)).status).toBe(404);
        expect((await (await send("POST", original)).json()).number).toBe(1);
      }
      reviews = new FileReviewRepository(join(directory, "reviews"));
      session.scope = { projectId: "delimoov-console", environment: "pr-42" };
      configure();
      expect(await (await send()).json()).toHaveLength(1);
    });
  });
});

describe("Given separately stored, private screenshots", () => {
  it("Then the database stores object keys while the API returns authenticated image routes", async () => {
    const response = await send("POST", reviewFixture(2));
    const review = await response.json();
    expect(review.screenshot).toBe(`/__rebyu/reviews/${review.id}/screenshot`);
    expect(review.screenshotKey).toBeUndefined();
    const stored = await reviews.get(session.scope, review.id);
    expect(stored?.screenshotKey).toBeDefined();
    const disk = await readFile(
      join(directory, "reviews", "delimoov-console", "pr-42", "reviews.json"),
      "utf8",
    );
    expect(disk).not.toContain("data:image");
    const screenshot = await send("GET", undefined, `/${review.id}/screenshot`);
    expect(screenshot.headers.get("content-type")).toBe("image/png");
    expect(screenshot.headers.get("cache-control")).toContain("no-store");
    expect(Buffer.from(await screenshot.arrayBuffer()).toString("base64")).toBe(
      pngData.split(",")[1],
    );
    await send("DELETE", undefined, `/${review.id}`);
    expect(await screenshots.get(session.scope, stored?.screenshotKey ?? "")).toBeNull();
  });

  it("Then concurrent duplicate uploads preserve the winning image and discard the losing object", async () => {
    vi.spyOn(reviews, "get").mockResolvedValue(null);
    const remove = vi.spyOn(screenshots, "remove");
    await Promise.all([send("POST", reviewFixture(2)), send("POST", reviewFixture(2))]);
    const [stored] = await reviews.list(session.scope);
    expect(stored.screenshotKey).toBeDefined();
    expect(await screenshots.get(session.scope, stored.screenshotKey ?? "")).not.toBeNull();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("Then disabling capture rejects screenshot payloads without writing a review", async () => {
    configure(false);
    expect((await send("POST", reviewFixture(2))).status).toBe(403);
    expect(await reviews.list(session.scope)).toEqual([]);
  });

  it("Then malformed PNG payloads are rejected", async () => {
    expect(
      (await send("POST", { ...reviewFixture(2), screenshot: "data:image/png;base64,SGVsbG8=" }))
        .status,
    ).toBe(400);
    expect(await reviews.list(session.scope)).toEqual([]);
  });

  it("Then a failed object upload does not create a database record or leak backend errors", async () => {
    vi.spyOn(screenshots, "put").mockRejectedValue(new Error("private storage detail"));
    const response = await send("POST", reviewFixture(2));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("private storage detail");
    expect(await reviews.list(session.scope)).toEqual([]);
  });

  it("Then an uncertain database write does not delete an object the database might reference", async () => {
    const create = reviews.create.bind(reviews);
    vi.spyOn(reviews, "create").mockImplementation(async (...arguments_) => {
      await create(...arguments_);
      throw new Error("Database committed but connection was interrupted");
    });
    expect((await send("POST", reviewFixture(2))).status).toBe(500);
    const [stored] = await reviews.list(session.scope);
    expect(await screenshots.get(session.scope, stored.screenshotKey ?? "")).not.toBeNull();
    expect((await send("POST", reviewFixture(2))).status).toBe(201);
  });
});

describe("Given a host that disables browser diagnostics", () => {
  it("Then disabling diagnostics rejects captured errors without writing a review", async () => {
    handler = createReviewHandler({
      reviews,
      captureDiagnostics: false,
      authenticate: createTokenAuthenticator([{ token, session }]),
    });
    const input = reviewFixture(1);
    expect(
      (
        await send("POST", {
          ...input,
          context: { ...input.context, errors: ["Private browser error"] },
        })
      ).status,
    ).toBe(403);
    expect(await reviews.list(session.scope)).toEqual([]);
    expect((await send("POST", input)).status).toBe(201);
  });
});

describe("Given untrusted HTTP clients", () => {
  it("Then missing or invalid credentials cannot read reviews or screenshots", async () => {
    await send("POST", reviewFixture(2));
    expect((await send("GET", undefined, "", { Authorization: "" })).status).toBe(401);
    expect(
      (
        await send("GET", undefined, `/${reviewFixture(2).id}/screenshot`, {
          Authorization: "Bearer invalid",
        })
      ).status,
    ).toBe(401);
  });

  it("Then origins, content types, malformed JSON, and oversized bodies are checked", async () => {
    expect((await send("GET", undefined, "", { Origin: "https://attacker.test" })).status).toBe(
      403,
    );
    expect((await send("POST", {}, "", { "Content-Type": "text/plain" })).status).toBe(415);
    expect(
      (await send("POST", { ...reviewFixture(1), message: "a".repeat(3_500_001) })).status,
    ).toBe(413);
    const response = await handler(
      new Request("https://review.test/__rebyu/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: "{",
      }),
    );
    expect(response.status).toBe(400);
    expect(await reviews.list(session.scope)).toEqual([]);
  });

  it("Then project identifiers cannot escape file-storage directories", async () => {
    await expect(reviews.list({ projectId: "../other", environment: "staging" })).rejects.toThrow();
    await expect(reviews.list({ projectId: "Delimoov", environment: "staging" })).rejects.toThrow();
    await expect(screenshots.get(session.scope, "../../outside")).rejects.toThrow();
  });

  it("Then authentication must be configured and bearer tokens must be strong and unique", () => {
    expect(() => createReviewHandler({ reviews } as never)).toThrow("authentication is required");
    expect(() => createTokenAuthenticator([{ token: "weak", session }])).toThrow();
    expect(() =>
      createTokenAuthenticator([
        { token, session },
        { token, session },
      ]),
    ).toThrow();
  });
});

describe("Given configurable persistence and trusted authentication", () => {
  it("Then an injected repository receives authenticated scope instead of client metadata", async () => {
    const repository = {
      list: vi.fn().mockResolvedValue([reviewFixture(1)]),
      get: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(reviewFixture(1)),
      update: vi.fn().mockResolvedValue(null),
      remove: vi.fn().mockResolvedValue(false),
    } satisfies ReviewRepository;
    handler = createReviewHandler({
      reviews: repository,
      authenticate: createTokenAuthenticator([{ token, session }]),
    });
    expect((await send()).status).toBe(200);
    expect(repository.list).toHaveBeenCalledWith(session.scope);
    expect(
      (await send("POST", { ...reviewFixture(1), projectId: "other", environment: "production" }))
        .status,
    ).toBe(201);
    expect(repository.create).toHaveBeenCalledWith(
      session.scope,
      expect.objectContaining({ authorId: session.reviewer.id }),
    );
    expect(repository.create.mock.calls[0]?.[1]).not.toHaveProperty("projectId");
  });

  it("Then invalid authenticated scopes fail closed before storage access", async () => {
    const list = vi.spyOn(reviews, "list");
    handler = createReviewHandler({
      reviews,
      authenticate: async () => ({
        ...session,
        scope: { projectId: "../other", environment: "dev" },
      }),
      onError: vi.fn(),
    });
    expect((await send()).status).toBe(500);
    expect(list).not.toHaveBeenCalled();
  });

  it("Then image cleanup failures report an orphan without undoing review deletion", async () => {
    const onError = vi.fn();
    handler = createReviewHandler({
      reviews,
      screenshots,
      authenticate: createTokenAuthenticator([{ token, session }]),
      onError,
    });
    await send("POST", reviewFixture(2));
    const [stored] = await reviews.list(session.scope);
    vi.spyOn(screenshots, "remove").mockRejectedValue(new Error("Object store unavailable"));
    expect((await send("DELETE", undefined, `/${stored.id}`)).status).toBe(200);
    expect(await reviews.list(session.scope)).toEqual([]);
    expect(await screenshots.get(session.scope, stored.screenshotKey ?? "")).not.toBeNull();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
