import type { Review } from "../schema";
export type ReviewScope = "all" | "page";
export function filterReviews(
  reviews: Review[],
  options: {
    page: string;
    scope: ReviewScope;
    status: string;
    query: string;
    author?: string;
  },
) {
  const query = options.query.trim().toLowerCase();
  return reviews.filter(
    (review) =>
      (options.scope === "all" || review.page === options.page) &&
      (options.status === "all" ||
        (options.status === "open"
          ? ["open", "in-progress"].includes(review.status)
          : review.status === options.status)) &&
      (!options.author || review.author === options.author) &&
      `${review.message} ${review.author} ${review.number} ${review.page}`
        .toLowerCase()
        .includes(query),
  );
}
export function reviewUrl(page: string, id: string, origin: string): URL {
  const url = new URL(page, origin);
  if (!page.startsWith("/") || url.origin !== origin)
    throw new Error("This review points outside the current site.");
  url.hash = `rebyu-review=${encodeURIComponent(id)}`;
  return url;
}
export function linkedReviewId(hash: string) {
  return new URLSearchParams(hash.slice(1)).get("rebyu-review");
}
