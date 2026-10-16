import { describe, expect, it } from "vitest";
import { filterReviews, linkedReviewId, reviewUrl } from "../../../src/client/reviews";
import type { Review } from "../../../src/schema";

// Only fields used by filtering; annotation data is tested by the storage/API suite.
const reviews = [
  {
    id: "home",
    number: 1,
    page: "/",
    message: "More space",
    author: "Mira",
    status: "open",
  },
  {
    id: "work",
    number: 2,
    page: "/work",
    message: "Improve contrast",
    author: "Leo",
    status: "in-progress",
  },
  {
    id: "about",
    number: 3,
    page: "/about",
    message: "Updated copy",
    author: "Mira",
    status: "resolved",
  },
] as Review[];
const defaults = { page: "/", scope: "all" as const, status: "all", query: "" };
describe("cross-page reviews", () => {
  it("includes comments on other pages and narrows only when This page is selected", () => {
    expect(filterReviews(reviews, defaults).map((r) => r.id)).toEqual(["home", "work", "about"]);
    expect(filterReviews(reviews, { ...defaults, scope: "page" }).map((r) => r.id)).toEqual([
      "home",
    ]);
    expect(
      filterReviews(reviews, { ...defaults, page: "/work", scope: "page" }).map((r) => r.id),
    ).toEqual(["work"]);
  });
  it("combines global status, page-path search, and author filters", () => {
    expect(filterReviews(reviews, { ...defaults, status: "open" }).map((r) => r.id)).toEqual([
      "home",
      "work",
    ]);
    expect(
      filterReviews(reviews, {
        ...defaults,
        query: " /ABOUT ",
        author: "Mira",
      }).map((r) => r.id),
    ).toEqual(["about"]);
    expect(filterReviews(reviews, { ...defaults, query: "/work", author: "Mira" })).toEqual([]);
  });
  it("keeps page queries while carrying the selected review through navigation", () => {
    const url = reviewUrl("/work?view=grid", "review-123", "http://localhost:5173");
    expect(url.pathname + url.search).toBe("/work?view=grid");
    expect(linkedReviewId(url.hash)).toBe("review-123");
    expect(linkedReviewId("#about-contact")).toBeNull();
  });
  it("rejects navigation to external origins from stored review data", () => {
    for (const page of ["//evil.example/path", "https://evil.example", "/\\evil.example"])
      expect(() => reviewUrl(page, "review-123", "http://localhost:5173")).toThrow();
  });
});
